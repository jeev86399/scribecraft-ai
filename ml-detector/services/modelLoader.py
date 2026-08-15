import os
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline

_model_cache = {}

# Map generic names to specific HF repo IDs
MODEL_REGISTRY = {
    "roberta_base": "Hello-SimpleAI/chatgpt-detector-roberta"
}

def get_model_pipeline(model_id: str):
    """
    Lazily loads the requested transformer pipeline into memory.
    """
    if model_id in _model_cache:
        return _model_cache[model_id]
        
    repo_id = MODEL_REGISTRY.get(model_id)
    if not repo_id:
        raise ValueError(f"Unknown model_id: {model_id}")
        
    print(f"Initializing pipeline for {repo_id}...")
    
    device = 0 if torch.cuda.is_available() else -1
    
    # We use a text-classification pipeline
    tokenizer = AutoTokenizer.from_pretrained(repo_id)
    model = AutoModelForSequenceClassification.from_pretrained(repo_id)
    
    pipe = pipeline("text-classification", model=model, tokenizer=tokenizer, device=device)
    
    _model_cache[model_id] = pipe
    return pipe
