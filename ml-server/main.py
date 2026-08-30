import os
import torch
import pickle
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoTokenizer
from pathlib import Path
import sys
import numpy as np

# Add parent directory to path to import models
sys.path.append(str(Path(__file__).parent))
from models.ensemble import DetectorEnsemble

app = FastAPI(title="ScribeCraft AI ML Engine (V3)")

models_loaded = False
model = None
tokenizer = None
calibrator = None
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
    v3_dir = Path(__file__).parent / "models" / "v3"
    checkpoint_path = v3_dir / "best_model.pt"
    calibrator_path = v3_dir / "isotonic_calibrator.pkl"
    
    if checkpoint_path.exists():
        try:
            model.load_state_dict(torch.load(checkpoint_path, map_location=device))
            print("✅ V3 Models Loaded Successfully!")
        except RuntimeError as e:
            print(f"⚠️ Warning: Could not load all model weights. Using initialized weights. ({e})")
            
        model.to(device)
        model.eval()
        models_loaded = True
        
        if calibrator_path.exists():
            with open(calibrator_path, 'rb') as f:
                calibrator = pickle.load(f)
            print("✅ Isotonic Calibrator Loaded Successfully!")
        else:
            print("⚠️ Warning: No Isotonic Calibrator found.")
            
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

def determine_evidence_tier(word_count):
    if word_count < 30:
        return "VERY SHORT (LOW EVIDENCE)"
    elif word_count < 150:
        return "SHORT (LIMITED EVIDENCE)"
    elif word_count < 500:
        return "MEDIUM (REASONABLE EVIDENCE)"
    else:
        return "LONG (STRONGER EVIDENCE)"

def determine_classification(ai_prob, human_prob, mixed_prob, word_count):
    if word_count < 30:
        return "UNCERTAIN"
        
    if mixed_prob > 0.4:
        return "MIXED / AI-ASSISTED"
    
    if ai_prob > 0.65:
        return "LIKELY AI"
    elif human_prob > 0.65:
        return "LIKELY HUMAN"
    else:
        return "UNCERTAIN"

@app.post("/detect")
def detect(payload: DetectPayload):
    if not models_loaded:
        return {
            "status": "success",
            "results": {
                "ensemble_v3": {
                    "available": False,
                    "classification": "UNCERTAIN",
                    "confidence": "LOW",
                    "reason": "ML model unavailable"
                }
            }
        }
        
    text = payload.text
    word_count = len(text.split())
    
    if word_count < 10:
        raise HTTPException(status_code=400, detail="Text too short")

    # Sentence-level inference first
    sentences = split_into_sentences(text)
    sentence_results = []
    
    ai_sentence_count = 0
    total_valid_sentences = 0
    
    if len(sentences) > 0 and len(sentences) < 500:
        encodings = tokenizer(
            sentences,
            truncation=True,
            padding='max_length',
            max_length=128,
            return_tensors='pt'
        )
        
        with torch.no_grad():
            s_input_ids = encodings['input_ids'].to(device)
            s_attention_mask = encodings['attention_mask'].to(device)
            s_logits = model(s_input_ids, s_attention_mask, sentences)
            s_probs = torch.nn.functional.softmax(s_logits, dim=1).cpu().numpy()
            
        for i, s_prob in enumerate(s_probs):
            s_human_prob = s_prob[0]
            s_ai_prob = s_prob[1]
            s_mixed_prob = s_prob[2]
            
            if calibrator is not None:
                s_ai_prob = float(calibrator.predict([s_ai_prob])[0])
            
            s_calib_prob = round(s_ai_prob * 100, 2)
            s_word_count = len(sentences[i].split())
            
            if s_word_count > 5:
                total_valid_sentences += 1
                if s_ai_prob > 0.6:
                    ai_sentence_count += 1
                    
            s_conf = "HIGH" if s_word_count > 15 else "LOW"
            sentence_results.append({
                "probability": s_calib_prob,
                "confidence": s_conf
            })
            
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
        probs = torch.nn.functional.softmax(logits, dim=1).squeeze().cpu().numpy()
        
    human_prob = float(probs[0])
    ai_prob = float(probs[1])
    mixed_prob = float(probs[2])
    
    if calibrator is not None:
        ai_prob = float(calibrator.predict([ai_prob])[0])
        
    calibrated_ai_prob = round(ai_prob * 100, 2)
    calibrated_human_prob = round(human_prob * 100, 2)
    
    # Calculate Estimated AI content proportion
    estimated_ai_content = 0.0
    if total_valid_sentences > 0:
        estimated_ai_content = round((ai_sentence_count / total_valid_sentences) * 100, 2)
    else:
        estimated_ai_content = calibrated_ai_prob
        
    classification = determine_classification(ai_prob, human_prob, mixed_prob, word_count)
    evidence_tier = determine_evidence_tier(word_count)
    
    confidence = "HIGH" if word_count >= 150 else "MEDIUM" if word_count >= 30 else "LOW"
    if classification == "UNCERTAIN":
        confidence = "LOW"
        
    results = {}
    for model_name in payload.models:
        results[model_name] = {
            "available": True,
            "classification": classification,
            "confidence": confidence,
            "evidence_tier": evidence_tier,
            "ai_probability": calibrated_ai_prob,
            "human_probability": calibrated_human_prob,
            "estimated_ai_content": estimated_ai_content,
        }

    return {
        "results": results, 
        "sentences": sentence_results,
        "status": "success"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5002)
