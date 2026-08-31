import os
import json
import argparse
import hashlib
from datasets import load_dataset
from pathlib import Path
import random

def setup_directories():
    base_dir = Path(__file__).parent.parent
    v4_dir = base_dir / "datasets" / "v4"
    v4_dir.mkdir(parents=True, exist_ok=True)
    return v4_dir

def compute_hash(text):
    clean_text = " ".join(text.lower().split())
    return hashlib.md5(clean_text.encode('utf-8')).hexdigest()

def extract_metadata(text, label, source, domain, source_model, attack_type=None, original_id=None, human_fraction=None, ai_fraction=None):
    word_count = len(text.split())
    char_count = len(text)
    doc_hash = compute_hash(text)
    
    return {
        "id": doc_hash,
        "text": text,
        "label": label, # "human", "ai", "mixed"
        "source": source,
        "source_model": source_model,
        "domain": domain,
        "language": "en",
        "word_count": word_count,
        "character_count": char_count,
        "human_fraction": human_fraction,
        "ai_fraction": ai_fraction,
        "attack_type": attack_type,
        "original_id": original_id,
        "dataset_version": "v4",
        "hash": doc_hash
    }

def inject_hard_negatives_and_adversarials():
    items = []
    
    # 1. Formal Human (to prevent false positives)
    human_texts = [
        "The implementation of the multi-class stochastic gradient descent algorithm requires careful hyperparameter tuning. Furthermore, we must ensure convergence.",
        "I am writing this email to follow up on our previous conversation regarding the project deliverables.",
        "In this study, we investigate the implications of artificial intelligence on modern pedagogical methodologies."
    ]
    for i, text in enumerate(human_texts):
        items.append(extract_metadata(
            text=text,
            label="human",
            source="synthetic_human",
            domain="formal_technical",
            source_model="human",
            human_fraction=1.0,
            ai_fraction=0.0
        ))
        
    # 2. Obvious AI
    ai_texts = [
        "As an AI language model, I cannot provide subjective opinions, but I can summarize the facts.",
        "Here is a comprehensive breakdown of the key factors to consider:"
    ]
    for i, text in enumerate(ai_texts):
        items.append(extract_metadata(
            text=text,
            label="ai",
            source="synthetic_ai",
            domain="general",
            source_model="unknown_gpt",
            human_fraction=0.0,
            ai_fraction=1.0
        ))
        
    # 3. Mixed / Paraphrased
    mixed_texts = [
        "The multi-class gradient descent algorithm needs careful tuning. Also, convergence must be ensured. However, as an AI, I suggest running 100 epochs."
    ]
    for i, text in enumerate(mixed_texts):
        items.append(extract_metadata(
            text=text,
            label="mixed",
            source="synthetic_mixed",
            domain="technical_mixed",
            source_model="human_and_gpt",
            attack_type="ai_completion",
            human_fraction=0.6,
            ai_fraction=0.4
        ))
        
    return items

def prepare_v4_dataset(output_dir, max_samples=10000):
    print(f"Loading dataset pipeline (Targeting ~{max_samples} samples)...")
    
    dataset = load_dataset("Hello-SimpleAI/HC3", name="all", split="train", streaming=True, trust_remote_code=True)
    
    records = []
    seen_hashes = set()
    
    target_human = int(max_samples * 0.5)
    target_ai = int(max_samples * 0.5)
    target_mixed = int(max_samples * 0.1)
    
    human_count = 0
    ai_count = 0
    mixed_count = 0
    
    for item in dataset:
        domain = item.get('source', 'unknown')
        
        # Human answers
        if human_count < target_human and len(item['human_answers']) > 0:
            for text in item['human_answers']:
                # Filter extremely short text
                if len(text.split()) < 5: continue
                
                doc = extract_metadata(text, "human", "HC3", domain, "human", human_fraction=1.0, ai_fraction=0.0)
                if doc["hash"] not in seen_hashes:
                    seen_hashes.add(doc["hash"])
                    records.append(doc)
                    human_count += 1
                    break # Take one per source item to ensure diversity
                
        # AI answers
        if ai_count < target_ai and len(item['chatgpt_answers']) > 0:
            for text in item['chatgpt_answers']:
                if len(text.split()) < 5: continue
                
                doc = extract_metadata(text, "ai", "HC3", domain, "gpt-3.5", human_fraction=0.0, ai_fraction=1.0)
                if doc["hash"] not in seen_hashes:
                    seen_hashes.add(doc["hash"])
                    records.append(doc)
                    
                    # Create a mixed adversarial text by replacing second half with human
                    if mixed_count < target_mixed and len(item['human_answers']) > 0:
                        human_text = item['human_answers'][0]
                        ai_sentences = [s.strip() for s in text.split('.') if len(s.strip()) > 5]
                        human_sentences = [s.strip() for s in human_text.split('.') if len(s.strip()) > 5]
                        
                        if len(ai_sentences) > 1 and len(human_sentences) > 1:
                            mixed_text = ". ".join(ai_sentences[:len(ai_sentences)//2]) + ". " + ". ".join(human_sentences[len(human_sentences)//2:]) + "."
                            mixed_doc = extract_metadata(
                                text=mixed_text,
                                label="mixed",
                                source="HC3_synthetic_mixed",
                                domain=domain,
                                source_model="gpt-3.5_and_human",
                                attack_type="human_completion",
                                original_id=doc["id"],
                                human_fraction=0.5,
                                ai_fraction=0.5
                            )
                            if mixed_doc["hash"] not in seen_hashes:
                                seen_hashes.add(mixed_doc["hash"])
                                records.append(mixed_doc)
                                mixed_count += 1
                                
                    ai_count += 1
                    break
                
        if human_count >= target_human and ai_count >= target_ai:
            break

    # Inject hard negatives
    synthetic_data = inject_hard_negatives_and_adversarials()
    for item in synthetic_data:
        if item["hash"] not in seen_hashes:
            seen_hashes.add(item["hash"])
            records.append(item)
            if item['label'] == "mixed":
                mixed_count += 1
            elif item['label'] == "human":
                human_count += 1
            else:
                ai_count += 1

    # SECURE SPLIT BY HASH TO PREVENT LEAKAGE
    # Sort hashes to ensure deterministic splitting based on seed
    random.seed(42)
    # Group by original_id if exists to keep variants in same split
    groups = {}
    for r in records:
        key = r.get("original_id") or r["id"]
        if key not in groups:
            groups[key] = []
        groups[key].append(r)
        
    group_keys = list(groups.keys())
    random.shuffle(group_keys)
    
    n_groups = len(group_keys)
    train_end = int(n_groups * 0.70)
    val_end = int(n_groups * 0.85)
    
    train_keys = group_keys[:train_end]
    val_keys = group_keys[train_end:val_end]
    test_keys = group_keys[val_end:]
    
    def save_split(keys, filename):
        path = output_dir / filename
        count = 0
        with open(path, 'w', encoding='utf-8') as f:
            for k in keys:
                for r in groups[k]:
                    f.write(json.dumps(r) + "\n")
                    count += 1
        return count

    n_train = save_split(train_keys, "v4_train.jsonl")
    n_val = save_split(val_keys, "v4_val.jsonl")
    n_test = save_split(test_keys, "v4_test.jsonl")
    
    print("\n========================================")
    print("V4 DATASET PREPARATION COMPLETE")
    print("========================================")
    print(f"Total Unique Samples: {len(records)}")
    print(f"Human: {human_count} | AI: {ai_count} | Mixed: {mixed_count}")
    print("----------------------------------------")
    print(f"Train set:       {n_train} samples")
    print(f"Validation set:  {n_val} samples")
    print(f"Final Test set:  {n_test} samples")
    print("========================================\n")
    print(f"Saved to: {output_dir}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--scale", type=int, default=10000, help="Target number of samples")
    args = parser.parse_args()
    
    out_dir = setup_directories()
    prepare_v4_dataset(out_dir, max_samples=args.scale)
