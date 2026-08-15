import crypto from 'crypto';

// Basic cache for ML inference results to avoid hammering the Python service
const inferenceCache = new Map();

function generateHash(text, models) {
  return crypto.createHash('sha256').update(text + models.join(',')).digest('hex');
}

export async function detectAIWithML(text, models = ['roberta_base']) {
  if (!text || text.trim().split(/\s+/).length < 15) {
    return { isTooShort: true };
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

    inferenceCache.set(hash, data);
    
    // keep cache small
    if (inferenceCache.size > 100) {
      const firstKey = inferenceCache.keys().next().value;
      inferenceCache.delete(firstKey);
    }
    
    return data;
  } catch (error) {
    console.error(`ML Inference Failed (${error.name}: ${error.message}). Falling back to rule engine.`);
    return { fallbackMode: true };
  }
}

/**
 * Ping the ML Detector to see if it is online.
 */
export async function pingMLDetector() {
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
    return response.ok;
  } catch (err) {
    return false;
  }
}

