import os
import json
import yaml
import argparse
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset
from transformers import AutoTokenizer
from pathlib import Path
import sys
import pickle
import datetime
from collections import Counter
from sklearn.isotonic import IsotonicRegression
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score, precision_score, recall_score, average_precision_score

# Add parent directory to path to import models
sys.path.append(str(Path(__file__).parent.parent))
from models.ensemble import DetectorEnsemble

class V4DetectorDataset(Dataset):
    def __init__(self, jsonl_path, tokenizer, max_length=512):
        self.records = []
        label_map = {"human": 0, "ai": 1, "mixed": 2}
        
        with open(jsonl_path, 'r', encoding='utf-8') as f:
            for line in f:
                if not line.strip(): continue
                data = json.loads(line)
                label_str = data.get("label", "")
                if label_str in label_map:
                    self.records.append({
                        "text": data["text"],
                        "label": label_map[label_str],
                        "id": data.get("id", ""),
                        "word_count": data.get("word_count", 0)
                    })
                    
        self.tokenizer = tokenizer
        self.max_length = max_length
        
    def __len__(self):
        return len(self.records)
        
    def __getitem__(self, idx):
        row = self.records[idx]
        text = str(row['text'])
        label = int(row['label'])
        
        encoding = self.tokenizer(
            text,
            truncation=True,
            padding='max_length',
            max_length=self.max_length,
            return_tensors='pt'
        )
        
        return {
            'input_ids': encoding['input_ids'].squeeze(),
            'attention_mask': encoding['attention_mask'].squeeze(),
            'text': text,
            'label': torch.tensor(label, dtype=torch.long)
        }

def get_device():
    print("-" * 50)
    print("HARDWARE DETECTION")
    print("-" * 50)
    if torch.cuda.is_available():
        gpu_name = torch.cuda.get_device_name(0)
        print(f"✅ CUDA Available: True")
        print(f"✅ GPU Name: {gpu_name}")
        return torch.device("cuda")
    elif torch.backends.mps.is_available():
        print(f"✅ MPS Available: True (Apple Silicon GPU)")
        return torch.device("mps")
    print("❌ CUDA/MPS NOT DETECTED. Running on CPU is NOT recommended.")
    return torch.device("cpu")

def calibrate_model(model, val_loader, device, out_dir):
    print("Calibrating probabilities using Isotonic Regression on Validation Set...")
    model.eval()
    all_probs = []
    all_labels = []
    
    with torch.no_grad():
        for batch in val_loader:
            input_ids = batch['input_ids'].to(device)
            attention_mask = batch['attention_mask'].to(device)
            labels = batch['label'].to(device)
            texts = batch['text']
            
            # Use AMP for inference speed too
            with torch.amp.autocast('cuda' if torch.cuda.is_available() else 'cpu'):
                logits = model(input_ids, attention_mask, texts)
                probs = torch.softmax(logits, dim=1)
            
            ai_probs = probs[:, 1].cpu().numpy()
            all_probs.extend(ai_probs)
            
            binary_labels = (labels == 1).cpu().numpy().astype(int)
            all_labels.extend(binary_labels)
            
    iso_reg = IsotonicRegression(out_of_bounds='clip')
    iso_reg.fit(all_probs, all_labels)
    
    calibrator_path = out_dir / "isotonic_calibrator.pkl"
    with open(calibrator_path, 'wb') as f:
        pickle.dump(iso_reg, f)
    print(f"✅ Calibrator saved to {calibrator_path}")

def train_model(config_path):
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
        
    base_dir = Path(__file__).parent.parent
    device = get_device()
    
    torch.manual_seed(config['training']['seed'])
    
    transformer_name = config['model']['transformer_name']
    tokenizer = AutoTokenizer.from_pretrained(transformer_name)
    model = DetectorEnsemble(transformer_name=transformer_name)
    model.to(device)
    
    train_path = base_dir / config['dataset']['train_path']
    val_path = base_dir / config['dataset']['val_path']
    
    print(f"Loading datasets from {train_path.parent}...")
    train_dataset = V4DetectorDataset(train_path, tokenizer, max_length=config['model']['max_length'])
    val_dataset = V4DetectorDataset(val_path, tokenizer, max_length=config['model']['max_length'])
    
    # Gradient accumulation and batch sizing for Colab GPU memory
    base_batch_size = config['training'].get('batch_size', 16)
    gradient_accumulation_steps = config['training'].get('gradient_accumulation_steps', 4)
    # Typically Colab T4 limits us to BS 8 or 16 for 512 max_len
    eff_batch_size = base_batch_size * gradient_accumulation_steps
    
    train_loader = DataLoader(train_dataset, batch_size=base_batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=base_batch_size)
    
    optimizer = torch.optim.AdamW(model.parameters(), lr=float(config['training']['learning_rate']))
    criterion = nn.CrossEntropyLoss()
    epochs = config['training']['epochs']
    
    out_dir = base_dir / config['output']['checkpoint_dir']
    out_dir.mkdir(parents=True, exist_ok=True)
    
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    version_dir = out_dir / f"run_{timestamp}"
    version_dir.mkdir(exist_ok=True)
    
    reports_dir = base_dir / config['output']['reports_dir']
    reports_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"Starting Mixed Precision (AMP) training on {len(train_dataset)} samples...")
    best_val_loss = float('inf')
    experiment_log = []
    
    # Setup PyTorch AMP Scaler
    scaler = torch.amp.GradScaler('cuda' if torch.cuda.is_available() else 'cpu')
    
    # Check for resume
    resume_checkpoint = out_dir / "latest_checkpoint.pt"
    start_epoch = 0
    if resume_checkpoint.exists():
        print(f"Resuming from checkpoint {resume_checkpoint}")
        checkpoint = torch.load(resume_checkpoint)
        model.load_state_dict(checkpoint['model_state_dict'])
        optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
        start_epoch = checkpoint['epoch'] + 1
        best_val_loss = checkpoint.get('best_val_loss', float('inf'))

    start_time = datetime.datetime.now()
    
    for epoch in range(start_epoch, epochs):
        model.train()
        total_loss = 0
        optimizer.zero_grad()
        
        for batch_idx, batch in enumerate(train_loader):
            input_ids = batch['input_ids'].to(device)
            attention_mask = batch['attention_mask'].to(device)
            labels = batch['label'].to(device)
            texts = batch['text']
            
            with torch.amp.autocast('cuda' if torch.cuda.is_available() else 'cpu'):
                logits = model(input_ids, attention_mask, texts)
                loss = criterion(logits, labels)
                loss = loss / gradient_accumulation_steps
            
            scaler.scale(loss).backward()
            
            if ((batch_idx + 1) % gradient_accumulation_steps == 0) or (batch_idx + 1 == len(train_loader)):
                scaler.step(optimizer)
                scaler.update()
                optimizer.zero_grad()
            
            total_loss += loss.item() * gradient_accumulation_steps
            if batch_idx % 50 == 0:
                print(f"Epoch {epoch+1}/{epochs} | Batch {batch_idx}/{len(train_loader)} | Loss: {loss.item() * gradient_accumulation_steps:.4f}")
                
        # Validation
        model.eval()
        val_loss = 0
        
        all_preds = []
        all_labels = []
        all_probs_ai = []
        
        with torch.no_grad():
            for batch in val_loader:
                input_ids = batch['input_ids'].to(device)
                attention_mask = batch['attention_mask'].to(device)
                labels = batch['label'].to(device)
                texts = batch['text']
                
                with torch.amp.autocast('cuda' if torch.cuda.is_available() else 'cpu'):
                    logits = model(input_ids, attention_mask, texts)
                    loss = criterion(logits, labels)
                    
                val_loss += loss.item()
                
                probs = torch.softmax(logits, dim=1)
                preds = torch.argmax(probs, dim=1)
                
                all_preds.extend(preds.cpu().numpy())
                all_labels.extend(labels.cpu().numpy())
                all_probs_ai.extend(probs[:, 1].cpu().numpy())
                
        avg_val_loss = val_loss / len(val_loader)
        binary_labels = [1 if l == 1 else 0 for l in all_labels]
        binary_preds = [1 if p == 1 else 0 for p in all_preds]
        
        accuracy = accuracy_score(all_labels, all_preds)
        precision = precision_score(binary_labels, binary_preds, zero_division=0)
        recall = recall_score(binary_labels, binary_preds, zero_division=0)
        f1 = f1_score(binary_labels, binary_preds, zero_division=0)
        
        try:
            auroc = roc_auc_score(binary_labels, all_probs_ai)
            auprc = average_precision_score(binary_labels, all_probs_ai)
        except:
            auroc = 0.5
            auprc = 0.5
            
        print("-" * 60)
        print(f"Epoch {epoch+1} Validation Metrics:")
        print(f"Loss: {avg_val_loss:.4f} | Accuracy: {accuracy:.4f}")
        print(f"Precision: {precision:.4f} | Recall: {recall:.4f} | F1: {f1:.4f}")
        print(f"AUROC: {auroc:.4f} | AUPRC: {auprc:.4f}")
        print("-" * 60)
        
        experiment_log.append({
            "epoch": epoch + 1,
            "train_loss": total_loss / len(train_loader),
            "val_loss": avg_val_loss,
            "val_accuracy": accuracy,
            "val_precision": precision,
            "val_recall": recall,
            "val_f1": f1,
            "val_auroc": auroc,
            "val_auprc": auprc
        })
        
        # Save checkpoint (resume point)
        torch.save({
            'epoch': epoch,
            'model_state_dict': model.state_dict(),
            'optimizer_state_dict': optimizer.state_dict(),
            'best_val_loss': best_val_loss,
        }, resume_checkpoint)
        
        if avg_val_loss < best_val_loss:
            best_val_loss = avg_val_loss
            
            # Save best validation checkpoint
            torch.save(model.state_dict(), version_dir / "best_model.pt")
            torch.save(model.state_dict(), out_dir / "best_model.pt")
            print(f"✅ Saved new best model checkpoint to models/v4/best_model.pt")
            
    duration = datetime.datetime.now() - start_time
    
    # Save final model state
    torch.save(model.state_dict(), version_dir / "final_model.pt")
    
    # Add metadata
    import platform
    import transformers
    metadata = {
        "python_version": platform.python_version(),
        "pytorch_version": torch.__version__,
        "transformers_version": transformers.__version__,
        "gpu_name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "None",
        "epochs": epochs,
        "batch_size": base_batch_size,
        "gradient_accumulation_steps": gradient_accumulation_steps,
        "learning_rate": config['training']['learning_rate'],
        "training_duration": str(duration),
        "log": experiment_log
    }
    
    with open(reports_dir / f"training_summary_{timestamp}.json", "w") as f:
        json.dump(metadata, f, indent=4)
            
    # Final step: Calibration
    print("Loading best model for calibration...")
    model.load_state_dict(torch.load(out_dir / "best_model.pt", map_location=device))
    calibrate_model(model, val_loader, device, out_dir)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", type=str, default="configs/v4.yaml")
    args = parser.parse_args()
    
    config_path = Path(__file__).parent.parent / args.config
    train_model(config_path)
