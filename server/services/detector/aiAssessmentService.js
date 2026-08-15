/**
 * Gemini AI Semantic Assessment Service (Signal 10)
 * Evaluates semantic smoothness, balanced explanations, and generic elaboration.
 * Uses temperature 0.0 for stable, deterministic responses.
 */

import { callGeminiApi, isGeminiConfigured } from '../aiConfig.js';

export async function getAISemanticAssessment(text) {
  if (!isGeminiConfigured() || !text || text.trim().length < 40) {
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

    // Timeout is 2500ms
    const parsed = await callGeminiApi(prompt, 2048, 0.0, 2500);

    if (parsed && typeof parsed.aiPatternSignal === 'number') {
      return {
        aiPatternSignal: Math.max(0, Math.min(100, Math.round(parsed.aiPatternSignal))),
        humanPatternSignal: Math.max(0, Math.min(100, Math.round(parsed.humanPatternSignal || (100 - parsed.aiPatternSignal)))),
        confidence: parsed.confidence || 'Medium',
        signals: Array.isArray(parsed.signals) ? parsed.signals : [],
        reasoningSummary: parsed.reasoningSummary || ''
      };
    }
  } catch (err) {
    // Silent fallback to local ensemble
  }

  return null;
}
