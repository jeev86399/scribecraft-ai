import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from services.modelLoader import get_model_pipeline
from services.inferenceService import run_inference
from services.calibrationService import calibrate_probability
from services.domainShiftService import check_domain_shift

app = FastAPI(title="ScribeCraft ML Detector Service")

class DetectRequest(BaseModel):
    text: str
    models: Optional[List[str]] = ["roberta_base"]

class DetectResponse(BaseModel):
    results: dict
    is_ood: bool
    ood_score: float

@app.on_event("startup")
async def startup_event():
    # Pre-load the primary model into memory on startup
    print("Loading models into memory...")
    get_model_pipeline("roberta_base")
    print("Models loaded successfully.")

@app.post("/detect", response_model=DetectResponse)
async def detect_ai_text(req: DetectRequest):
    if not req.text or len(req.text.split()) < 10:
        raise HTTPException(status_code=400, detail="Text too short")

    results = {}
    
    # 1. Domain Shift / OOD Detection
    is_ood, ood_score = check_domain_shift(req.text)

    # 2. Run Inference for requested models
    for model_id in req.models:
        try:
            raw_prob = run_inference(req.text, model_id)
            calibrated_prob = calibrate_probability(raw_prob, model_id, is_ood)
            results[model_id] = {
                "raw_probability": raw_prob,
                "calibrated_probability": calibrated_prob
            }
        except Exception as e:
            print(f"Error running inference for {model_id}: {str(e)}")
            results[model_id] = {"error": str(e)}
            
    return DetectResponse(results=results, is_ood=is_ood, ood_score=ood_score)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=False)
