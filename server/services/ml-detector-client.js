import crypto from 'crypto';

// Basic cache for ML inference results to avoid hammering the Python service
const inferenceCache = new Map();

// V2 State Management
let mlDetectorState = 'ACTIVE';
let lastHealthCheck = 0;
const HEALTH_CACHE_TTL = 30000; // 30 seconds

function generateHash(text, models) {
  return crypto.createHash('sha256').update(text + models.join(',')).digest('hex');
}

export async function detectAIWithML(text, models = ['roberta_base']) {
  if (!text || text.trim().split(/\s+/).length < 15) {
    return { available: false, reason: 'insufficient_text' };
  }

  // V2 Fast Fail if known down
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
    const ML_URL = process.env.ML_DETECTOR_URL || 'http://127.0.0.1:8000';
    const endpoint = `${ML_URL.replace(/\/$/, '')}/detect`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    let data;
    const response = await fetch(ML_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, models }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) throw new Error('ML API error');
    data = await response.json();

    // Strict validation: Reject any malformed data that could be interpreted as a mock
    if (data && data.results) {
      for (const model of models) {
        if (data.results[model] && typeof data.results[model].calibrated_probability !== 'number') {
           throw new Error('Invalid probability received from ML service');
        }
      }
    } else {
       throw new Error('Malformed response from ML service');
    }

    // V2: Add calibration state metadata to output
    const processedResults = {};
    for (const model of models) {
        processedResults[model] = {
            probability: data.results[model].calibrated_probability, // NOT confidence
            confidence: data.results[model].confidence || 50,
            calibrationStatus: 'calibrated',
            modelAvailable: true
        };
    }

    const resultData = {
        available: true,
        state: 'ACTIVE',
        results: processedResults
    };

    inferenceCache.set(hash, resultData);
    
    // keep cache small
    if (inferenceCache.size > 100) {
      const firstKey = inferenceCache.keys().next().value;
      inferenceCache.delete(firstKey);
    }
    
    mlDetectorState = 'ACTIVE';
    lastHealthCheck = Date.now();
    return resultData;
  } catch (error) {
    console.error(`ML Inference Failed (${error.name}: ${error.message}). Marking as unavailable.`);
    mlDetectorState = 'TEMPORARILY_UNAVAILABLE';
    lastHealthCheck = Date.now();
    return { available: false, state: mlDetectorState, fallbackMode: true, reason: error.message };
  }
}

/**
 * Ping the ML Detector to see if it is online.
 */
export async function pingMLDetector() {
  if (Date.now() - lastHealthCheck < HEALTH_CACHE_TTL && mlDetectorState === 'ACTIVE') {
      return true;
  }

  try {
    const ML_URL = process.env.ML_DETECTOR_URL || 'http://127.0.0.1:8000';
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
