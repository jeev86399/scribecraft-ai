import os
import yaml
import argparse
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset
from transformers import AutoTokenizer
from pathlib import Path
import sys

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

def train_model(config_path):
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
        
    base_dir = Path(__file__).parent.parent
    
    device = get_device()
    print(f"Using device: {device}")
    
    tokenizer = AutoTokenizer.from_pretrained(config['model']['transformer_name'])
    model = DetectorEnsemble(transformer_name=config['model']['transformer_name'])
    model.to(device)
    
    train_path = base_dir / config['dataset']['train_path']
    val_path = base_dir / config['dataset']['val_path']
    
    if not train_path.exists() or not val_path.exists():
        print(f"Dataset not found. Please run prepare_dataset.py first.")
        return
        
    train_dataset = DetectorDataset(train_path, tokenizer, max_length=config['model']['max_length'])
    val_dataset = DetectorDataset(val_path, tokenizer, max_length=config['model']['max_length'])
    
    train_loader = DataLoader(train_dataset, batch_size=config['training']['batch_size'], shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=config['training']['batch_size'])
    
    optimizer = torch.optim.AdamW(model.parameters(), lr=float(config['training']['learning_rate']))
    criterion = nn.CrossEntropyLoss()
    
    epochs = config['training']['epochs']
    
    out_dir = base_dir / config['output']['checkpoint_dir']
    out_dir.mkdir(parents=True, exist_ok=True)
    
    print("Starting training...")
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
            print("Saved new best model checkpoint.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", type=str, default="configs/development.yaml")
    args = parser.parse_args()
    
    config_path = Path(__file__).parent.parent / args.config
    train_model(config_path)
