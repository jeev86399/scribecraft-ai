import os
import json
import argparse
import hashlib
import pandas as pd
from datasets import load_dataset
from pathlib import Path

def setup_directories():
    base_dir = Path(__file__).parent.parent
    processed_dir = base_dir / "datasets" / "processed"
    processed_dir.mkdir(parents=True, exist_ok=True)
    return processed_dir

def compute_hash(text):
    """Compute a fast hash to prevent exact duplicates and simple leakage."""
    # For a production system we'd use MinHash/LSH, but for this step MD5 of lowercased stripped text is a start
    clean_text = " ".join(text.lower().split())
    return hashlib.md5(clean_text.encode('utf-8')).hexdigest()

def inject_hard_negatives_and_adversarials():
    """Returns a list of engineered hard-negatives (Human) and adversarials (Mixed/AI)."""
    # 0 = Human, 1 = AI, 2 = Mixed/Adversarial
    return [
        {"text": "The implementation of the multi-class stochastic gradient descent algorithm requires careful hyperparameter tuning. Furthermore, we must ensure convergence.", "label": 0, "source": "synthetic_hard_negative_human", "domain": "technical"},
        {"text": "I am writing this email to follow up on our previous conversation regarding the project deliverables.", "label": 0, "source": "synthetic_hard_negative_human", "domain": "formal_email"},
        {"text": "The multi-class gradient descent algorithm needs careful tuning. Also, convergence must be ensured.", "label": 2, "source": "synthetic_adversarial_mixed", "domain": "technical_paraphrase"},
        {"text": "As an AI language model, I cannot provide subjective opinions, but I can summarize the facts.", "label": 1, "source": "synthetic_ai_obvious", "domain": "ai_disclaimer"}
    ]

def prepare_multi_class_dataset(output_dir, max_samples=10000):
    print(f"Loading dataset pipeline (Targeting ~{max_samples} samples)...")
    
    # We load HC3 as our primary source for Human (0) and AI (1)
    dataset = load_dataset("Hello-SimpleAI/HC3", name="all", split="train", streaming=True, trust_remote_code=True)
    
    records = []
    seen_hashes = set()
    
    human_count = 0
    ai_count = 0
    mixed_count = 0
    
    target_human = int(max_samples * 0.45)
    target_ai = int(max_samples * 0.45)
    target_mixed = int(max_samples * 0.10)
    
    for item in dataset:
        # Add Human
        if human_count < target_human and len(item['human_answers']) > 0:
            text = item['human_answers'][0]
            h = compute_hash(text)
            if h not in seen_hashes:
                seen_hashes.add(h)
                records.append({"text": text, "label": 0, "source": "HC3_human", "domain": item.get('source', 'unknown')})
                human_count += 1
                
        # Add AI
        if ai_count < target_ai and len(item['chatgpt_answers']) > 0:
            text = item['chatgpt_answers'][0]
            h = compute_hash(text)
            if h not in seen_hashes:
                seen_hashes.add(h)
                records.append({"text": text, "label": 1, "source": "HC3_chatgpt", "domain": item.get('source', 'unknown')})
                ai_count += 1
                
        if human_count >= target_human and ai_count >= target_ai:
            break

    # Inject synthetic hard negatives and mixed/adversarial data
    synthetic_data = inject_hard_negatives_and_adversarials()
    for item in synthetic_data:
        h = compute_hash(item['text'])
        if h not in seen_hashes:
            seen_hashes.add(h)
            records.append(item)
            if item['label'] == 2:
                mixed_count += 1
            elif item['label'] == 0:
                human_count += 1
            else:
                ai_count += 1

    df = pd.DataFrame(records)
    # Shuffle fully
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    # Secure Split: 70% Train, 15% Val, 15% Locked Test
    n = len(df)
    train_end = int(n * 0.70)
    val_end = int(n * 0.85)
    
    train_df = df.iloc[:train_end]
    val_df = df.iloc[train_end:val_end]
    test_df = df.iloc[val_end:]
    
    train_path = output_dir / "v3_train.parquet"
    val_path = output_dir / "v3_val.parquet"
    test_path = output_dir / "v3_locked_test.parquet"
    
    train_df.to_parquet(train_path, index=False)
    val_df.to_parquet(val_path, index=False)
    test_df.to_parquet(test_path, index=False)
    
    print("\n========================================")
    print("DATASET PREPARATION COMPLETE (V3)")
    print("========================================")
    print(f"Total Unique Samples: {len(df)}")
    print(f"Human: {human_count} | AI: {ai_count} | Mixed: {mixed_count}")
    print("----------------------------------------")
    print(f"Train set:       {len(train_df)} samples")
    print(f"Validation set:  {len(val_df)} samples")
    print(f"Locked Test set: {len(test_df)} samples")
    print("========================================\n")
    print(f"Saved to: {output_dir}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--scale", type=int, default=10000, help="Target number of samples")
    args = parser.parse_args()
    
    out_dir = setup_directories()
    prepare_multi_class_dataset(out_dir, max_samples=args.scale)
