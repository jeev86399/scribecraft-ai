import os
import json
import yaml
import argparse
import pandas as pd
import numpy as np
import torch
from torch.utils.data import DataLoader, Dataset
from transformers import AutoTokenizer
from pathlib import Path
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, 
    roc_auc_score, average_precision_score, brier_score_loss, 
    roc_curve, confusion_matrix
)
from sklearn.calibration import calibration_curve
import sys

sys.path.append(str(Path(__file__).parent.parent))
from models.ensemble import DetectorEnsemble

class V4BenchmarkDataset(Dataset):
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
                        "id": data.get("id", ""),
                        "text": data["text"],
                        "label": label_map[label_str],
                        "word_count": data.get("word_count", 0),
                        "domain": data.get("domain", "unknown"),
                        "source_model": data.get("source_model", "unknown"),
                        "source": data.get("source", "unknown")
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
    return float(ece)

def get_tpr_at_fpr(y_true, y_prob, target_fpr=0.01):
    fpr, tpr, thresholds = roc_curve(y_true, y_prob)
    idx = np.where(fpr <= target_fpr)[0][-1]
    return float(tpr[idx]), float(thresholds[idx])

def compute_binary_metrics(y_true, y_pred, y_prob):
    try:
        acc = accuracy_score(y_true, y_pred)
        prec = precision_score(y_true, y_pred, zero_division=0)
        rec = recall_score(y_true, y_pred, zero_division=0)
        f1 = f1_score(y_true, y_pred, zero_division=0)
        auroc = roc_auc_score(y_true, y_prob) if len(np.unique(y_true)) > 1 else 0.0
        auprc = average_precision_score(y_true, y_prob) if len(np.unique(y_true)) > 1 else 0.0
        brier = brier_score_loss(y_true, y_prob)
        ece = expected_calibration_error(y_true, y_prob)
        
        tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0,1]).ravel()
        fpr_val = fp / (fp + tn) if (fp + tn) > 0 else 0.0
        fnr_val = fn / (fn + tp) if (fn + tp) > 0 else 0.0
        
        return {
            "accuracy": float(acc), "precision": float(prec), "recall": float(rec), "f1": float(f1),
            "auroc": float(auroc), "auprc": float(auprc), "brier": float(brier), "ece": float(ece),
            "fpr": float(fpr_val), "fnr": float(fnr_val),
            "tp": int(tp), "fp": int(fp), "tn": int(tn), "fn": int(fn)
        }
    except Exception as e:
        return {}

def bucket_length(wc):
    if wc < 50: return "<50 words"
    if wc < 100: return "50-99 words"
    if wc < 200: return "100-199 words"
    if wc < 500: return "200-499 words"
    if wc < 1000: return "500-999 words"
    return "1000+ words"

def run_benchmark(config_path):
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
        
    base_dir = Path(__file__).parent.parent
    device = torch.device("mps" if torch.backends.mps.is_available() else "cuda" if torch.cuda.is_available() else "cpu")
    print(f"Benchmarking on {device}...")
    
    transformer_name = config['model']['transformer_name']
    tokenizer = AutoTokenizer.from_pretrained(transformer_name)
    model = DetectorEnsemble(transformer_name=transformer_name)
    
    checkpoint_path = base_dir / config['output']['checkpoint_dir'] / "best_model.pt"
    if checkpoint_path.exists():
        model.load_state_dict(torch.load(checkpoint_path, map_location=device))
        print("✅ V4 Model loaded successfully.")
    else:
        print("⚠️ Warning: No trained V4 model found. Proceeding with initialized weights.")
        
    model.to(device)
    model.eval()
    
    test_path = base_dir / config['dataset']['test_path']
    if not test_path.exists():
        print(f"Test dataset not found at {test_path}")
        return
        
    test_dataset = V4BenchmarkDataset(test_path, tokenizer, max_length=config['model']['max_length'])
    test_loader = DataLoader(test_dataset, batch_size=config['training']['batch_size'], shuffle=False)
    
    print(f"Running Inference on Final Test Set ({len(test_dataset)} samples)...")
    
    results = []
    
    with torch.no_grad():
        for batch_idx, batch in enumerate(test_loader):
            input_ids = batch['input_ids'].to(device)
            attention_mask = batch['attention_mask'].to(device)
            labels = batch['label'].cpu().numpy()
            texts = batch['text']
            
            logits = model(input_ids, attention_mask, texts)
            probs = torch.softmax(logits, dim=1).cpu().numpy()
            preds = np.argmax(probs, axis=1)
            
            for i in range(len(labels)):
                idx = batch_idx * config['training']['batch_size'] + i
                r = test_dataset.records[idx]
                results.append({
                    "id": r["id"],
                    "true_label": int(labels[i]),
                    "pred_label": int(preds[i]),
                    "human_prob": float(probs[i][0]),
                    "ai_prob": float(probs[i][1]),
                    "mixed_prob": float(probs[i][2]),
                    "domain": r["domain"],
                    "source_model": r["source_model"],
                    "word_count": r["word_count"],
                    "length_bucket": bucket_length(r["word_count"])
                })
                
    df = pd.DataFrame(results)
    
    # ----------------------------------------------------
    # CORE METRICS (AI vs Rest)
    # ----------------------------------------------------
    y_true_bin = (df['true_label'] == 1).astype(int)
    y_pred_bin = (df['pred_label'] == 1).astype(int)
    y_prob_ai = df['ai_prob']
    
    overall_metrics = compute_binary_metrics(y_true_bin, y_pred_bin, y_prob_ai)
    if len(np.unique(y_true_bin)) > 1:
        tpr_1, thr_1 = get_tpr_at_fpr(y_true_bin, y_prob_ai, 0.01)
        tpr_5, thr_5 = get_tpr_at_fpr(y_true_bin, y_prob_ai, 0.05)
    else:
        tpr_1, thr_1, tpr_5, thr_5 = 0,0,0,0
        
    overall_metrics["tpr_at_1_fpr"] = tpr_1
    overall_metrics["tpr_at_5_fpr"] = tpr_5
    overall_metrics["3class_accuracy"] = accuracy_score(df['true_label'], df['pred_label'])
    
    # Calibration Curve
    prob_true, prob_pred = calibration_curve(y_true_bin, y_prob_ai, n_bins=10)
    calibration_data = {"prob_true": prob_true.tolist(), "prob_pred": prob_pred.tolist()}
    
    # Sub-group Analysis
    def analyze_group(group_col):
        group_metrics = {}
        for name, group in df.groupby(group_col):
            ytb = (group['true_label'] == 1).astype(int)
            ypb = (group['pred_label'] == 1).astype(int)
            ypai = group['ai_prob']
            if len(ytb) >= 10:
                group_metrics[name] = compute_binary_metrics(ytb, ypb, ypai)
                group_metrics[name]["count"] = len(group)
        return group_metrics

    length_metrics = analyze_group("length_bucket")
    domain_metrics = analyze_group("domain")
    model_metrics = analyze_group("source_model")
    
    # Error Analysis Log
    errors = df[df['true_label'] != df['pred_label']].copy()
    
    def classify_error(row):
        if row['true_label'] == 0 and row['pred_label'] == 1: return "Human_False_Positive"
        if row['true_label'] == 1 and row['pred_label'] == 0: return "AI_False_Negative"
        return "Mixed_Misclassification"
        
    errors['error_type'] = errors.apply(classify_error, axis=1)

    reports_dir = base_dir / config['output']['reports_dir']
    reports_dir.mkdir(parents=True, exist_ok=True)
    
    # Export JSONs
    with open(reports_dir / "benchmark_summary.json", "w") as f:
        json.dump({
            "overall": overall_metrics,
            "calibration": calibration_data,
            "by_length": length_metrics,
            "by_domain": domain_metrics,
            "by_model": model_metrics
        }, f, indent=4)
        
    errors.to_json(reports_dir / "failure_analysis.json", orient="records", indent=4)
    
    # Generate MD Report
    with open(reports_dir / "FINAL_REPORT.md", "w") as f:
        f.write("# ScribeCraft AI V4 - Final Detector Validation Report\n\n")
        
        f.write("## 1. Dataset Composition\n")
        f.write(f"- **Total Samples**: {len(df)}\n")
        f.write(f"- **HUMAN (Class 0)**: {sum(df['true_label'] == 0)}\n")
        f.write(f"- **AI (Class 1)**: {sum(df['true_label'] == 1)}\n")
        f.write(f"- **MIXED (Class 2)**: {sum(df['true_label'] == 2)}\n\n")
        
        f.write("## 2. Overall Performance (AI vs Rest)\n")
        f.write(f"- **Accuracy (3-class)**: {overall_metrics['3class_accuracy']:.4f}\n")
        f.write(f"- **Binary Accuracy**: {overall_metrics['accuracy']:.4f}\n")
        f.write(f"- **Precision**: {overall_metrics['precision']:.4f}\n")
        f.write(f"- **Recall**: {overall_metrics['recall']:.4f}\n")
        f.write(f"- **F1 Score**: {overall_metrics['f1']:.4f}\n")
        f.write(f"- **AUROC**: {overall_metrics['auroc']:.4f}\n")
        f.write(f"- **AUPRC**: {overall_metrics['auprc']:.4f}\n")
        f.write(f"- **Human False Positive Rate**: {overall_metrics['fpr']:.4f}\n")
        f.write(f"- **AI False Negative Rate**: {overall_metrics['fnr']:.4f}\n")
        f.write(f"- **TPR @ 1% FPR**: {overall_metrics['tpr_at_1_fpr']:.4f}\n")
        f.write(f"- **TPR @ 5% FPR**: {overall_metrics['tpr_at_5_fpr']:.4f}\n\n")
        
        f.write("## 3. Calibration & Reliability\n")
        f.write(f"- **Brier Score**: {overall_metrics['brier']:.4f}\n")
        f.write(f"- **Expected Calibration Error (ECE)**: {overall_metrics['ece']:.4f}\n\n")
        
        f.write("## 4. Length Robustness\n")
        for k, v in length_metrics.items():
            f.write(f"### {k} (N={v['count']})\n")
            f.write(f"- AUROC: {v.get('auroc', 0):.4f} | F1: {v.get('f1', 0):.4f} | FPR: {v.get('fpr', 0):.4f}\n")
            
        f.write("\n## 5. Domain Robustness\n")
        for k, v in domain_metrics.items():
            f.write(f"### {k} (N={v['count']})\n")
            f.write(f"- AUROC: {v.get('auroc', 0):.4f} | F1: {v.get('f1', 0):.4f} | FPR: {v.get('fpr', 0):.4f}\n")
            
        f.write("\n## 6. Model Source Robustness\n")
        for k, v in model_metrics.items():
            f.write(f"### {k} (N={v['count']})\n")
            f.write(f"- AUROC: {v.get('auroc', 0):.4f} | F1: {v.get('f1', 0):.4f} | Recall: {v.get('recall', 0):.4f}\n")
            
        f.write("\n## 7. Failure Mode Summary\n")
        fp_count = len(errors[errors['error_type'] == 'Human_False_Positive'])
        fn_count = len(errors[errors['error_type'] == 'AI_False_Negative'])
        f.write(f"- **False Positives (Human flagged as AI)**: {fp_count}\n")
        f.write(f"- **False Negatives (AI missed)**: {fn_count}\n")
        f.write("\n*See `failure_analysis.json` for detailed misclassifications.*\n")
        
    print(f"✅ V4 Benchmark Complete. Reports saved to {reports_dir}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", type=str, default="configs/v4.yaml")
    args = parser.parse_args()
    run_benchmark(args.config)
