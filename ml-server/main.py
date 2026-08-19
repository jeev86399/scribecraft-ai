from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import pipeline, AutoModelForSequenceClassification, AutoTokenizer, AutoModelForCausalLM
import torch
import math

app = FastAPI(title="ScribeCraft AI ML Engine")

# ---------------------------------------------------------
# 1. LOAD MODELS (This will take a few minutes the first time!)
# ---------------------------------------------------------
models_loaded = False
try:
    print("Loading DeBERTa Classification Model...")
    # Using a top-performing RAID benchmark model based on DeBERTa-v3
    classifier_name = "desklib/ai-text-detector-v1.01" 
    clf_tokenizer = AutoTokenizer.from_pretrained(classifier_name)
    clf_model = AutoModelForSequenceClassification.from_pretrained(classifier_name)

    print("Loading GPT-2 for Token Predictability...")
    lm_name = "gpt2"
    lm_tokenizer = AutoTokenizer.from_pretrained(lm_name)
    lm_model = AutoModelForCausalLM.from_pretrained(lm_name)
    
    models_loaded = True
    print("✅ Models Loaded Successfully!")
except Exception as e:
    print(f"❌ Failed to load models: {e}")

# ---------------------------------------------------------
# 2. DEFINE DATA STRUCTURES
# ---------------------------------------------------------
class TextPayload(BaseModel):
    text: str

# ---------------------------------------------------------
# 3. ENDPOINTS
# ---------------------------------------------------------
@app.get("/health")
def health():
    return {
        "status": "ok" if models_loaded else "degraded", 
        "models": ["desklib/ai-text-detector-v1.01", "gpt2"] if models_loaded else [], 
        "version": "2.0"
    }

class DetectPayload(BaseModel):
    text: str
    models: list[str] = ["roberta_base"]

@app.post("/detect")
def detect(payload: DetectPayload):
    if not models_loaded:
        raise HTTPException(status_code=503, detail="Local models failed to load due to environment constraint")
        
    text = payload.text
    if len(text.strip()) < 10:
        raise HTTPException(status_code=400, detail="Text too short")

    # Run through DeBERTa
    inputs = clf_tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
    with torch.no_grad():
        outputs = clf_model(**inputs)
        logits = outputs.logits
        probabilities = torch.nn.functional.softmax(logits, dim=-1).squeeze().tolist()

    ai_probability = probabilities[1] if len(probabilities) > 1 else probabilities[0]
    calibrated_ai_prob = round(ai_probability * 100, 2)

    # Return matching schema for Node.js ML client
    # The node client expects: { results: { "model_name": { calibrated_probability: X, confidence: Y } } }
    results = {}
    for model_name in payload.models:
        results[model_name] = {
            "calibrated_probability": calibrated_ai_prob,
            "confidence": 95 if calibrated_ai_prob > 80 or calibrated_ai_prob < 20 else 60
        }

    return {"results": results, "status": "success"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5002)
