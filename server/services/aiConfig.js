/**
 * aiConfig.js
 * Centralized Gemini API Configuration & Invocation Service
 * ScribeCraft AI v2.0
 */

export const getGeminiModel = () => {
  return process.env.GEMINI_MODEL || 'gemini-3.7-flash';
};

export const getGeminiApiKey = () => {
  return process.env.GEMINI_API_KEY;
};

// Circuit Breaker State
let geminiFailCount = 0;
let geminiNextRetryTime = 0;
const MAX_FAILURES = 3;
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

export const isGeminiConfigured = () => {
  return !!getGeminiApiKey();
};

export const isGeminiAvailable = () => {
  if (Date.now() < geminiNextRetryTime) {
    return false; // Circuit is open (unavailable)
  }
  return true; // Circuit is closed (available)
};

/**
 * A centralized wrapper to call the Gemini API.
 * Handles configuration, URL construction, circuit breaking, and error throwing.
 */
export async function callGeminiApi(prompt, maxTokens = 2048, temperature = 0.7, timeoutMs = null) {
  const apiKey = getGeminiApiKey();
  const model = getGeminiModel();

  if (!apiKey) {
    throw new Error('AI service is currently unavailable. (Missing Configuration)');
  }

  if (!isGeminiAvailable()) {
    throw new Error('AI service is temporarily unavailable (Circuit Breaker Open).');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const fetchOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { 
        responseMimeType: 'application/json', 
        temperature: temperature,
        maxOutputTokens: maxTokens
      }
    })
  };

  if (timeoutMs) {
    fetchOptions.signal = AbortSignal.timeout(timeoutMs);
  }

  try {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Model not found or invalid endpoint (${model}).`);
      }
      if (response.status === 429) {
        throw new Error('AI service rate limit exceeded. Please try again later.');
      }
      throw new Error(`AI service returned HTTP ${response.status}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!rawText) {
      throw new Error('AI service returned an empty response.');
    }

    // Success - close circuit
    geminiFailCount = 0;
    
    return JSON.parse(rawText);
  } catch (err) {
    console.error(`[Gemini API Error] ${err.message}`);
    
    // Increment fail count on error
    geminiFailCount++;
    if (geminiFailCount >= MAX_FAILURES) {
      console.warn(`[Gemini API] Max failures reached (${MAX_FAILURES}). Opening circuit breaker for ${COOLDOWN_MS / 1000}s.`);
      geminiNextRetryTime = Date.now() + COOLDOWN_MS;
      geminiFailCount = 0; // Reset count so it checks again after cooldown
    }
    
    throw new Error(err.message.includes('AI service') ? err.message : 'AI service connection failed.');
  }
}
