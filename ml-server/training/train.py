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
from sklearn.isotonic import IsotonicRegression
from sklearn.metrics import accuracy_score

# Add parent directory to path to import models
sys.path.append(str(Path(__file__).parent.parent))
from models.ensemble import DetectorEnsemble

class DetectorDataset(Dataset):
    def __init__(self, parquet_path, tokenizer, max_length=512):
        self.df = pd.read_parquet(parquet_path)
        self.tokenizer = tokenizer
        self.max_length = max_length
        
    def __len__(self):
        return len(self.df)
        
    def __getitem__(self, idx):
        row = self.df.iloc[idx]
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
    if torch.backends.mps.is_available():
        return torch.device("mps")
    elif torch.cuda.is_available():
        return torch.device("cuda")
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
            
            logits = model(input_ids, attention_mask, texts)
            probs = torch.softmax(logits, dim=1)
            
            # We calibrate the AI class (1) probability
            ai_probs = probs[:, 1].cpu().numpy()
            all_probs.extend(ai_probs)
            
            # Binary target for AI calibration (1 if label==1, else 0)
            binary_labels = (labels == 1).cpu().numpy().astype(int)
            all_labels.extend(binary_labels)
            
    iso_reg = IsotonicRegression(out_of_bounds='clip')
    iso_reg.fit(all_probs, all_labels)
    
    calibrator_path = out_dir / "isotonic_calibrator.pkl"
    with open(calibrator_path, 'wb') as f:
        pickle.dump(iso_reg, f)
    print(f"Calibrator saved to {calibrator_path}")

def train_model(config_path, scale):
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
        
    base_dir = Path(__file__).parent.parent
    device = get_device()
    print(f"Using device: {device}")
    
    tokenizer = AutoTokenizer.from_pretrained(config['model']['transformer_name'])
    model = DetectorEnsemble(transformer_name=config['model']['transformer_name'])
    model.to(device)
    
    # Override paths for V3 scale
    train_path = base_dir / "datasets/processed/v3_train.parquet"
    val_path = base_dir / "datasets/processed/v3_val.parquet"
    
    if not train_path.exists() or not val_path.exists():
        print(f"Dataset not found at {train_path}. Please run prepare_dataset.py first.")
        return
        
    train_dataset = DetectorDataset(train_path, tokenizer, max_length=config['model']['max_length'])
    val_dataset = DetectorDataset(val_path, tokenizer, max_length=config['model']['max_length'])
    
    train_loader = DataLoader(train_dataset, batch_size=config['training']['batch_size'], shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=config['training']['batch_size'])
    
    optimizer = torch.optim.AdamW(model.parameters(), lr=float(config['training']['learning_rate']))
    criterion = nn.CrossEntropyLoss()
    epochs = config['training']['epochs']
    
    out_dir = base_dir / "models" / "v3"
    out_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"Starting training on {len(train_dataset)} samples...")
    best_val_loss = float('inf')
    
    for epoch in range(epochs):
        model.train()
        total_loss = 0
        for batch_idx, batch in enumerate(train_loader):
            input_ids = batch['input_ids'].to(device)
            attention_mask = batch['attention_mask'].to(device)
            labels = batch['label'].to(device)
            texts = batch['text']
            
            optimizer.zero_grad()
            logits = model(input_ids, attention_mask, texts)
            
            loss = criterion(logits, labels)
            loss.backward()
            optimizer.step()
            
            total_loss += loss.item()
            if batch_idx % 10 == 0:
                print(f"Epoch {epoch+1}/{epochs} | Batch {batch_idx}/{len(train_loader)} | Loss: {loss.item():.4f}")
                
        # Validation
        model.eval()
        val_loss = 0
        correct = 0
        total = 0
        with torch.no_grad():
            for batch in val_loader:
                input_ids = batch['input_ids'].to(device)
                attention_mask = batch['attention_mask'].to(device)
                labels = batch['label'].to(device)
                texts = batch['text']
                
                logits = model(input_ids, attention_mask, texts)
                loss = criterion(logits, labels)
                val_loss += loss.item()
                
                preds = torch.argmax(logits, dim=1)
                correct += (preds == labels).sum().item()
                total += labels.size(0)
                
        avg_val_loss = val_loss / len(val_loader)
        accuracy = correct / total
        print(f"Epoch {epoch+1} Validation | Loss: {avg_val_loss:.4f} | Accuracy: {accuracy:.4f}")
        
        if avg_val_loss < best_val_loss:
            best_val_loss = avg_val_loss
            torch.save(model.state_dict(), out_dir / "best_model.pt")
            print("Saved new best model checkpoint to models/v3/best_model.pt")
            
    # Load best model for calibration
    model.load_state_dict(torch.load(out_dir / "best_model.pt", map_location=device))
    calibrate_model(model, val_loader, device, out_dir)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", type=str, default="configs/development.yaml")
    parser.add_argument("--scale", type=str, default="10k", help="Dataset scale identifier")
    args = parser.parse_args()
    
    config_path = Path(__file__).parent.parent / args.config
    train_model(config_path, args.scale)
