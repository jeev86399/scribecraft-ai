/**
 * aiConfig.js
 * Centralized Gemini API Configuration & Invocation Service
 * ScribeCraft AI v2.0
 */

export const getGeminiModel = () => {
  return process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
};

export const getGeminiApiKey = () => {
  return process.env.GEMINI_API_KEY;
};

export const isGeminiConfigured = () => {
  return !!getGeminiApiKey();
};

/**
 * A centralized wrapper to call the Gemini API.
 * Handles configuration, URL construction, and error throwing.
 */
export async function callGeminiApi(prompt, maxTokens = 2048, temperature = 0.7, timeoutMs = null) {
  const apiKey = getGeminiApiKey();
  const model = getGeminiModel();

  if (!apiKey) {
    throw new Error('AI service is currently unavailable. (Missing Configuration)');
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

    return JSON.parse(rawText);
  } catch (err) {
    console.error(`[Gemini API Error] ${err.message}`);
    throw new Error(err.message.includes('AI service') ? err.message : 'AI service connection failed.');
  }
}
