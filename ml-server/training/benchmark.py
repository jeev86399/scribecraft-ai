import os
import yaml
import argparse
import pandas as pd
import numpy as np
import torch
from torch.utils.data import DataLoader, Dataset
from transformers import AutoTokenizer
from pathlib import Path
from sklearn.metrics import roc_auc_score, precision_recall_curve, f1_score, confusion_matrix
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
from transformers import AutoTokenizer

def expected_calibration_error(y_true, y_prob, n_bins=10):
    bin_boundaries = np.linspace(0, 1, n_bins + 1)
    bin_lowers = bin_boundaries[:-1]
    bin_uppers = bin_boundaries[1:]
    
    ece = 0.0
    for bin_lower, bin_upper in zip(bin_lowers, bin_uppers):
        in_bin = (y_prob > bin_lower) & (y_prob <= bin_upper)
        prop_in_bin = in_bin.mean()
        if prop_in_bin > 0:
            accuracy_in_bin = y_true[in_bin].mean()
            avg_confidence_in_bin = y_prob[in_bin].mean()
            ece += np.abs(avg_confidence_in_bin - accuracy_in_bin) * prop_in_bin
    return ece

def get_tpr_at_fpr(y_true, y_prob, target_fpr=0.01):
    fpr, tpr, thresholds = roc_curve(y_true, y_prob)
    # Find the threshold where FPR is just below the target_fpr
    idx = np.where(fpr <= target_fpr)[0][-1]
    return tpr[idx], thresholds[idx]

def run_benchmark(scale="10k"):
    base_dir = Path(__file__).parent.parent
    device = torch.device("mps" if torch.backends.mps.is_available() else "cuda" if torch.cuda.is_available() else "cpu")
    print(f"Benchmarking on {device}...")
    
    # Load model
    transformer_name = "distilbert-base-uncased"
    tokenizer = AutoTokenizer.from_pretrained(transformer_name)
    model = DetectorEnsemble(transformer_name=transformer_name)
    
    checkpoint_path = base_dir / "models" / "v3" / "best_model.pt"
    if checkpoint_path.exists():
        model.load_state_dict(torch.load(checkpoint_path, map_location=device))
        print("✅ V3 Model loaded successfully.")
    else:
        print("⚠️ Warning: No trained V3 model found. Proceeding with initialized weights for baseline verification.")
        
    model.to(device)
    model.eval()
    
    # Load Dataset
    val_path = base_dir / "datasets/processed/v3_val.parquet"
    if not val_path.exists():
        print(f"Validation dataset not found at {val_path}")
        return
        
    df = pd.read_parquet(val_path)
    print(f"Testing on {len(df)} samples...")
    
    y_true = []
    y_pred_probs = []
    y_preds = []
    
    with torch.no_grad():
        for i, row in df.iterrows():
            text = str(row['text'])
            label = int(row['label']) # 0=Human, 1=AI, 2=Mixed
            
            encoding = tokenizer(
                text,
                truncation=True,
                padding='max_length',
                max_length=512,
                return_tensors='pt'
            )
            
            logits = model(
                input_ids=encoding['input_ids'].to(device),
                attention_mask=encoding['attention_mask'].to(device),
                raw_texts=[text]
            )
            
            probs = torch.softmax(logits, dim=1)[0].cpu().numpy()
            
            y_true.append(label)
            y_pred_probs.append(probs)
            y_preds.append(np.argmax(probs))
            
    y_true = np.array(y_true)
    y_pred_probs = np.array(y_pred_probs)
    y_preds = np.array(y_preds)
    
    # Metrics
    # For binary metrics (AUROC, TPR, Brier), we binarize: Target=1 (AI), Target=0 (Human/Mixed)
    y_true_bin = (y_true == 1).astype(int)
    y_prob_ai = y_pred_probs[:, 1]
    
    acc = accuracy_score(y_true, y_preds)
    auroc = roc_auc_score(y_true_bin, y_prob_ai)
    brier = brier_score_loss(y_true_bin, y_prob_ai)
    ece = expected_calibration_error(y_true_bin, y_prob_ai)
    
    tpr_1, thr_1 = get_tpr_at_fpr(y_true_bin, y_prob_ai, 0.01)
    tpr_5, thr_5 = get_tpr_at_fpr(y_true_bin, y_prob_ai, 0.05)
    
    cm = confusion_matrix(y_true, y_preds, labels=[0, 1, 2])
    
    print("\n==================================================")
    print("SCRIBECRAFT AI DETECTOR V3 - BENCHMARK RESULTS")
    print("==================================================")
    print(f"Total Samples Tested: {len(y_true)}")
    print("-" * 50)
    print(f"Accuracy (3-class):      {acc:.4f}")
    print(f"AUROC (AI vs Rest):      {auroc:.4f}")
    print(f"Brier Score (AI):        {brier:.4f}")
    print(f"Expected Calib Error:    {ece:.4f}")
    print("-" * 50)
    print(f"TPR @ 1% FPR (AI):       {tpr_1:.4f} (Threshold: {thr_1:.4f})")
    print(f"TPR @ 5% FPR (AI):       {tpr_5:.4f} (Threshold: {thr_5:.4f})")
    print("-" * 50)
    print("Confusion Matrix (0=Human, 1=AI, 2=Mixed):")
    print(cm)
    print("==================================================\n")
    
    # Save reports
    reports_dir = base_dir / "reports"
    reports_dir.mkdir(parents=True, exist_ok=True)
    
    report_data = {
        "dataset_size": len(y_true),
        "accuracy": acc,
        "auroc": auroc,
        "brier_score": brier,
        "ece": ece,
        "tpr_at_1_fpr": tpr_1,
        "tpr_at_5_fpr": tpr_5,
        "confusion_matrix": cm.tolist()
    }
    
    with open(reports_dir / "latest_v3.json", "w") as f:
        json.dump(report_data, f, indent=4)
        
    print(f"Saved JSON report to {reports_dir / 'latest_v3.json'}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--scale", type=str, default="10k", help="Dataset scale identifier")
    args = parser.parse_args()
    run_benchmark(args.scale)
