from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import pipeline, AutoModelForSequenceClassification, AutoTokenizer, AutoModelForCausalLM
import torch
import math

app = FastAPI(title="ScribeCraft AI ML Engine")

# ---------------------------------------------------------
# 1. LOAD MODELS (This will take a few minutes the first time!)
# ---------------------------------------------------------
print("Loading DeBERTa Classification Model...")
# Using a top-performing RAID benchmark model based on DeBERTa-v3
classifier_name = "desklib/ai-text-detector-v1.01" 
clf_tokenizer = AutoTokenizer.from_pretrained(classifier_name)
clf_model = AutoModelForSequenceClassification.from_pretrained(classifier_name)

print("Loading GPT-2 for Token Predictability...")
lm_name = "gpt2"
lm_tokenizer = AutoTokenizer.from_pretrained(lm_name)
lm_model = AutoModelForCausalLM.from_pretrained(lm_name)

print("✅ Models Loaded Successfully!")

# ---------------------------------------------------------
# 2. DEFINE DATA STRUCTURES
# ---------------------------------------------------------
class TextPayload(BaseModel):
    text: str

# ---------------------------------------------------------
# 3. ENDPOINTS
# ---------------------------------------------------------
@app.get("/")
def health_check():
    return {"status": "online", "message": "ScribeCraft ML Engines are running."}

@app.post("/analyze/classification")
def analyze_classification(payload: TextPayload):
    """
    Family D: Transformer Classification
    Returns the strict ML probability that the text is AI generated.
    """
    text = payload.text
    if len(text.strip()) < 10:
        raise HTTPException(status_code=400, detail="Text too short")

    # Run through DeBERTa
    inputs = clf_tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
    with torch.no_grad():
        outputs = clf_model(**inputs)
        logits = outputs.logits
        # Convert logits to probabilities using Softmax
        probabilities = torch.nn.functional.softmax(logits, dim=-1).squeeze().tolist()

    # The desklib model usually outputs [Human_Prob, AI_Prob] or a single AI logit. 
    # Assuming standard binary classification where index 1 is AI:
    ai_probability = probabilities[1] if len(probabilities) > 1 else probabilities[0]

    return {
        "engine": "DeBERTa-v3-large",
        "ai_confidence": round(ai_probability * 100, 2),
        "status": "success"
    }

@app.post("/analyze/perplexity")
def analyze_perplexity(payload: TextPayload):
    """
    Family C: Token Distribution & Predictability
    Measures the negative log-likelihood of the sequence.
    """
    text = payload.text
    inputs = lm_tokenizer(text, return_tensors="pt")
    
    with torch.no_grad():
        outputs = lm_model(**inputs, labels=inputs["input_ids"])
        loss = outputs.loss
        perplexity = math.exp(loss.item())

    # Lower perplexity = Higher AI likelihood
    # Typical AI perplexity is 10-25. Typical Human is 40-80+.
    is_highly_predictable = perplexity < 30

    return {
        "engine": "GPT-2 Logits",
        "perplexity_score": round(perplexity, 2),
        "is_highly_predictable": is_highly_predictable,
        "status": "success"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
