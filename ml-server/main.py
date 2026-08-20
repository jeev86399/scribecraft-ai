import os
import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoTokenizer
from pathlib import Path
import sys

# Add parent directory to path to import models
sys.path.append(str(Path(__file__).parent))
from models.ensemble import DetectorEnsemble

app = FastAPI(title="ScribeCraft AI ML Engine (V3)")

models_loaded = False
model = None
tokenizer = None
device = torch.device("cpu")

if torch.backends.mps.is_available():
    device = torch.device("mps")
elif torch.cuda.is_available():
    device = torch.device("cuda")

# ---------------------------------------------------------
# 1. LOAD MODELS
# ---------------------------------------------------------
try:
    print(f"Loading V3 Ensemble Model on {device}...")
    transformer_name = "distilbert-base-uncased"
    tokenizer = AutoTokenizer.from_pretrained(transformer_name)
    model = DetectorEnsemble(transformer_name=transformer_name)
    
    # Load checkpoint
    checkpoint_path = Path(__file__).parent / "checkpoints/baseline/best_model.pt"
    if checkpoint_path.exists():
        model.load_state_dict(torch.load(checkpoint_path, map_location=device))
        model.to(device)
        model.eval()
        models_loaded = True
        print("✅ Models Loaded Successfully!")
    else:
        print(f"❌ Checkpoint not found at {checkpoint_path}. Please train the model first.")
except Exception as e:
    print(f"❌ Failed to load models: {e}")

# ---------------------------------------------------------
# 2. DEFINE DATA STRUCTURES
# ---------------------------------------------------------
class TextPayload(BaseModel):
    text: str

class DetectPayload(BaseModel):
    text: str
    models: list[str] = ["ensemble_v3"]

# ---------------------------------------------------------
# 3. ENDPOINTS
# ---------------------------------------------------------
@app.get("/health")
def health():
    return {
        "status": "ok" if models_loaded else "degraded",
        "models": ["ensemble_v3"] if models_loaded else [],
        "version": "3.0"
    }

def split_into_sentences(text):
    import re
    sentences = re.split(r'(?<=[.!?]) +', text)
    return [s.strip() for s in sentences if len(s.strip()) > 0]

@app.post("/detect")
def detect(payload: DetectPayload):
    if not models_loaded:
        raise HTTPException(status_code=503, detail="Local models failed to load due to environment constraint")
        
    text = payload.text
    if len(text.strip()) < 10:
        raise HTTPException(status_code=400, detail="Text too short")

    # Document level inference
    encoding = tokenizer(
        text,
        truncation=True,
        padding='max_length',
        max_length=512,
        return_tensors='pt'
    )
    
    input_ids = encoding['input_ids'].to(device)
    attention_mask = encoding['attention_mask'].to(device)
    
    with torch.no_grad():
        logits = model(input_ids, attention_mask, [text])
        probs = torch.nn.functional.softmax(logits, dim=1).squeeze()
        ai_probability = probs[1].item() # index 1 is AI class
        
    calibrated_ai_prob = round(ai_probability * 100, 2)
    
    # Simple uncertainty based on text length and prob margin
    margin = abs(0.5 - ai_probability)
    word_count = len(text.split())
    
    confidence = 95
    if word_count < 30:
        confidence = 40
    elif word_count < 100:
        confidence = 70
        
    if margin < 0.2: # near 0.5 boundary
        confidence -= 20
        
    confidence = max(0, min(100, confidence))

    # Sentence-level inference (for V3)
    sentences = split_into_sentences(text)
    sentence_results = []
    
    if len(sentences) > 0 and len(sentences) < 50:
        encodings = tokenizer(
            sentences,
            truncation=True,
            padding='max_length',
            max_length=128,
            return_tensors='pt'
        )
        s_input_ids = encodings['input_ids'].to(device)
        s_attention_mask = encodings['attention_mask'].to(device)
        
        with torch.no_grad():
            s_logits = model(s_input_ids, s_attention_mask, sentences)
            s_probs = torch.nn.functional.softmax(s_logits, dim=1)[:, 1].tolist()
            
        for i, s_prob in enumerate(s_probs):
            s_calib_prob = round(s_prob * 100, 2)
            s_word_count = len(sentences[i].split())
            s_conf = 80 if s_word_count > 10 else 40
            sentence_results.append({
                "probability": s_calib_prob,
                "confidence": s_conf
            })

    results = {}
    for model_name in payload.models:
        results[model_name] = {
            "calibrated_probability": calibrated_ai_prob,
            "confidence": confidence
        }

    return {
        "results": results, 
        "sentences": sentence_results,
        "status": "success"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5002)
