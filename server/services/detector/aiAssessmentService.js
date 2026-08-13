/**
 * Gemini AI Semantic Assessment Service (Signal 10)
 * Evaluates semantic smoothness, balanced explanations, and generic elaboration.
 * Uses temperature 0.0 for stable, deterministic responses.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function getAISemanticAssessment(text) {
  if (!GEMINI_API_KEY || !text || text.trim().length < 40) {
    return null; // Graceful fallback to statistical local ensemble
  }

  try {
    const prompt = `Perform a stylometric and semantic AI writing probability evaluation on the following text.
Assess writing characteristics such as semantic smoothness, overly balanced explanations, repetitive abstraction, and formulaic paragraph progression.

Return ONLY a valid JSON object matching this exact schema:
{
  "aiPatternSignal": 65,
  "humanPatternSignal": 35,
  "confidence": "Medium",
  "signals": ["Semantic smoothness detected", "Overly balanced explanation structure"],
  "reasoningSummary": "Passage demonstrates uniform explanatory progression and generic elaboration."
}

Text to assess:
"""
${text}
"""`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.0 }
      })
    });

    if (!response.ok) {
      console.warn(`Gemini AI Assessment HTTP ${response.status}`);
      return null;
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    const parsed = JSON.parse(rawText);
    if (typeof parsed.aiPatternSignal === 'number') {
      return {
        aiPatternSignal: Math.max(0, Math.min(100, Math.round(parsed.aiPatternSignal))),
        humanPatternSignal: Math.max(0, Math.min(100, Math.round(parsed.humanPatternSignal || (100 - parsed.aiPatternSignal)))),
        confidence: parsed.confidence || 'Medium',
        signals: Array.isArray(parsed.signals) ? parsed.signals : [],
        reasoningSummary: parsed.reasoningSummary || ''
      };
    }
  } catch (err) {
    console.warn('Gemini AI Assessment error:', err.message);
  }

  return null;
}
