import crypto from 'crypto';

const inferenceCache = new Map();
let mlDetectorState = 'ACTIVE';
let lastHealthCheck = 0;
const HEALTH_CACHE_TTL = 30000; 

function generateHash(text, models) {
  return crypto.createHash('sha256').update(text + models.join(',')).digest('hex');
}

export async function detectAIWithML(text, models = ['ensemble_v4']) {
  if (!text || text.trim().split(/\s+/).length < 15) {
    return { available: false, reason: 'insufficient_text' };
  }

  if (mlDetectorState === 'DISABLED' || mlDetectorState === 'TEMPORARILY_UNAVAILABLE') {
     if (Date.now() - lastHealthCheck < HEALTH_CACHE_TTL) {
         return { available: false, state: mlDetectorState, reason: 'service_unavailable' };
     }
  }

  const hash = generateHash(text, models);
  if (inferenceCache.has(hash)) {
    return inferenceCache.get(hash);
  }

  try {
    const ML_URL = process.env.ML_DETECTOR_URL || 'http://127.0.0.1:5002';
    const endpoint = `${ML_URL.replace(/\/$/, '')}/detect`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s for CPU
    
    let data;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, models }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) throw new Error('ML API error');
    data = await response.json();

    if (data && data.status === "success" && data.results) {
      for (const model of models) {
        if (data.results[model] && typeof data.results[model].ai_probability !== 'number') {
           throw new Error('Invalid probability received from ML service');
        }
      }
    } else {
       throw new Error('Malformed response from ML service');
    }

    const processedResults = {};
    for (const model of models) {
        processedResults[model] = {
            probability: data.results[model].estimated_ai_content || data.results[model].ai_probability, 
            confidence: data.results[model].confidence || 50,
            classification: data.results[model].classification || 'Unknown',
            evidenceTier: data.results[model].evidence_tier || 'Unknown',
            calibrationStatus: 'calibrated',
            modelAvailable: true
        };
    }

    const resultData = {
        available: true,
        state: 'ACTIVE',
        results: processedResults,
        sentences: data.sentences || []
    };

    inferenceCache.set(hash, resultData);
    
    if (inferenceCache.size > 100) {
      const firstKey = inferenceCache.keys().next().value;
      inferenceCache.delete(firstKey);
    }
    
    mlDetectorState = 'ACTIVE';
    lastHealthCheck = Date.now();
    return resultData;
  } catch (error) {
    console.error(`Local ML Inference Failed (${error.name}: ${error.message}). Checking for Hugging Face fallback...`);
    
    mlDetectorState = 'TEMPORARILY_UNAVAILABLE';
    lastHealthCheck = Date.now();
    return { available: false, state: mlDetectorState, fallbackMode: true, reason: error.message };
  }
}

export async function pingMLDetector() {
  if (Date.now() - lastHealthCheck < HEALTH_CACHE_TTL && mlDetectorState === 'ACTIVE') {
      return true;
  }

  try {
    const ML_URL = process.env.ML_DETECTOR_URL || 'http://127.0.0.1:5002';
    const endpoint = `${ML_URL.replace(/\/$/, '')}/health`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    
    const response = await fetch(endpoint, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
        mlDetectorState = 'ACTIVE';
        lastHealthCheck = Date.now();
        return true;
    } else {
        mlDetectorState = 'TEMPORARILY_UNAVAILABLE';
        lastHealthCheck = Date.now();
        return false;
    }
  } catch (err) {
    mlDetectorState = 'TEMPORARILY_UNAVAILABLE';
    lastHealthCheck = Date.now();
    return false;
  }
}
