import os
import json
import subprocess
import datetime
from pathlib import Path

def get_git_info():
    try:
        sha = subprocess.check_output(['git', 'rev-parse', 'HEAD']).strip().decode('utf-8')
        branch = subprocess.check_output(['git', 'rev-parse', '--abbrev-ref', 'HEAD']).strip().decode('utf-8')
        return {"sha": sha, "branch": branch}
    except Exception:
        return {"sha": "unknown", "branch": "unknown"}

def freeze_baseline():
    base_dir = Path(__file__).parent.parent
    baseline_dir = base_dir / "experiments" / "baseline"
    baseline_dir.mkdir(parents=True, exist_ok=True)
    
    metadata = {
        "timestamp": datetime.datetime.now().isoformat(),
        "git": get_git_info(),
        "model_architecture_version": "v2.0_transformer_stylometric",
        "feature_version": "1.0",
        "dataset_version": "1.0_HC3_subset",
        "random_seed": 42,
        "python_version": subprocess.check_output(['python', '--version']).strip().decode('utf-8'),
        "transformer_model": "distilbert-base-uncased"
    }
    
    metadata_path = baseline_dir / "baseline_metadata.json"
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=4)
        
    print(f"✅ Baseline state frozen and saved to {metadata_path}")
    print(json.dumps(metadata, indent=4))

if __name__ == "__main__":
    freeze_baseline()
