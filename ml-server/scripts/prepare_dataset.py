import os
import json
import argparse
import pandas as pd
from datasets import load_dataset
from pathlib import Path

def setup_directories():
    base_dir = Path(__file__).parent.parent
    processed_dir = base_dir / "datasets" / "processed"
    processed_dir.mkdir(parents=True, exist_ok=True)
    return processed_dir

def process_hc3_subset(output_dir, max_samples=5000):
    """
    Downloads a small balanced subset of the HC3 dataset (Human ChatGPT Comparison Corpus)
    for development/baseline testing.
    """
    print("Loading HC3 dataset (streaming mode)...")
    dataset = load_dataset("Hello-SimpleAI/HC3", name="all", split="train", streaming=True, trust_remote_code=True)
    
    data_records = []
    human_count = 0
    ai_count = 0
    
    # We want a balanced dataset. Each record in HC3 has 'human_answers' and 'chatgpt_answers'
    for item in dataset:
        if human_count < max_samples // 2 and len(item['human_answers']) > 0:
            data_records.append({
                "text": item['human_answers'][0],
                "label": 0, # 0 for Human
                "source": "HC3_human",
                "domain": item.get('source', 'unknown')
            })
            human_count += 1
            
        if ai_count < max_samples // 2 and len(item['chatgpt_answers']) > 0:
            data_records.append({
                "text": item['chatgpt_answers'][0],
                "label": 1, # 1 for AI
                "source": "HC3_chatgpt",
                "domain": item.get('source', 'unknown')
            })
            ai_count += 1
            
        if human_count >= max_samples // 2 and ai_count >= max_samples // 2:
            break

    df = pd.DataFrame(data_records)
    # Shuffle
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    # Train/Val Split (80/20)
    train_size = int(len(df) * 0.8)
    train_df = df.iloc[:train_size]
    val_df = df.iloc[train_size:]
    
    train_path = output_dir / "baseline_train.parquet"
    val_path = output_dir / "baseline_val.parquet"
    
    train_df.to_parquet(train_path, index=False)
    val_df.to_parquet(val_path, index=False)
    
    print(f"Dataset preparation complete.")
    print(f"Training samples: {len(train_df)}")
    print(f"Validation samples: {len(val_df)}")
    print(f"Saved to {output_dir}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", type=str, default="development", help="development, research, or large_scale")
    args = parser.parse_args()
    
    out_dir = setup_directories()
    
    if args.mode == "development":
        process_hc3_subset(out_dir, max_samples=4000)
    else:
        print(f"Mode {args.mode} not fully implemented yet. Use development mode for baseline.")
