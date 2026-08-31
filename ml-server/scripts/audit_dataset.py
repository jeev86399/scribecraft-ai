import json
import argparse
from pathlib import Path
from collections import Counter
import numpy as np

def audit_dataset(jsonl_path):
    print(f"Auditing Dataset: {jsonl_path}")
    records = []
    with open(jsonl_path, 'r', encoding='utf-8') as f:
        for line in f:
            if not line.strip(): continue
            records.append(json.loads(line))
            
    total = len(records)
    if total == 0:
        print("Dataset is empty.")
        return
        
    labels = Counter(r.get("label", "unknown") for r in records)
    sources = Counter(r.get("source", "unknown") for r in records)
    domains = Counter(r.get("domain", "unknown") for r in records)
    models = Counter(r.get("source_model", "unknown") for r in records)
    
    lengths = [r.get("word_count", 0) for r in records]
    
    # Check duplicates via hash
    hashes = [r.get("hash", "") for r in records if r.get("hash")]
    unique_hashes = set(hashes)
    duplicate_rate = 1.0 - (len(unique_hashes) / len(hashes)) if hashes else 0.0
    
    empty_records = sum(1 for r in records if not r.get("text", "").strip())
    
    print("\n--- Summary ---")
    print(f"Total Records: {total}")
    print(f"Empty Records: {empty_records}")
    print(f"Duplicate Rate (Exact Hash): {duplicate_rate:.2%}")
    
    print("\n--- Class Balance ---")
    for k, v in labels.items():
        print(f"  {k}: {v} ({v/total:.2%})")
        
    print("\n--- Source Distribution ---")
    for k, v in sources.most_common(5):
        print(f"  {k}: {v} ({v/total:.2%})")
        
    print("\n--- Domain Distribution ---")
    for k, v in domains.most_common(5):
        print(f"  {k}: {v} ({v/total:.2%})")
        
    print("\n--- AI Model Distribution ---")
    for k, v in models.most_common(5):
        print(f"  {k}: {v} ({v/total:.2%})")
        
    print("\n--- Length Distribution (Words) ---")
    if lengths:
        print(f"  Min: {np.min(lengths)}")
        print(f"  25th: {np.percentile(lengths, 25):.1f}")
        print(f"  Median: {np.median(lengths):.1f}")
        print(f"  75th: {np.percentile(lengths, 75):.1f}")
        print(f"  Max: {np.max(lengths)}")
        
        # Buckets
        buckets = {
            "<50": sum(1 for l in lengths if l < 50),
            "50-99": sum(1 for l in lengths if 50 <= l < 100),
            "100-199": sum(1 for l in lengths if 100 <= l < 200),
            "200-499": sum(1 for l in lengths if 200 <= l < 500),
            "500-999": sum(1 for l in lengths if 500 <= l < 1000),
            "1000+": sum(1 for l in lengths if l >= 1000)
        }
        print("\n  Length Buckets:")
        for k, v in buckets.items():
            print(f"    {k}: {v} ({v/total:.2%})")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", type=str, required=True, help="Path to JSONL file")
    args = parser.parse_args()
    audit_dataset(args.file)
