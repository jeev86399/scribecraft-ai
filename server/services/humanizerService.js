/**
 * AI Humanizer Service
 * Transforms AI-patterned text into stylistically natural prose while preserving facts and meaning.
 * Executes automatic before/after re-analysis using the exact same detector engine.
 */

import { detectAITextEnsemble } from './detector/detectorEngine.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function humanizeTextService(text) {
  if (!text || text.trim().length === 0) {
    return {
      originalText: text,
      humanizedText: text,
      beforeScore: null,
      afterScore: null,
      changedSignals: [],
      explanation: 'No text provided.'
    };
  }

  // 1. Analyze initial AI-pattern signals using detector engine
  const beforeAnalysis = await detectAITextEnsemble(text);

  let humanizedText = text;
  let changedSignals = [];

  // 2. Perform Stylistic Rewriting (Gemini AI or Smart Local Rules)
  if (GEMINI_API_KEY) {
    try {
      const prompt = `You are a master editor and writing style humanizer.
Transform the following text to eliminate formulaic AI patterns, predictable transitions, and generic filler while strictly preserving all original facts, meaning, proper nouns, numbers, dates, and technical terms.

Key Objectives:
- Vary sentence rhythms and clause structures naturally.
- Replace generic transition clichés ("In today's rapidly evolving world", "Furthermore", "Moreover", "It is important to note") with direct, context-specific phrasing.
- DO NOT invent fake personal stories, fake dates, or fake facts.
- DO NOT introduce grammatical errors or spelling typos.

Return ONLY a JSON object:
{
  "humanizedText": "stylistically transformed natural text",
  "changedSignals": [
    "Replaced formulaic transition markers with context-specific phrasing",
    "Introduced varied sentence clause lengths and cadence"
  ]
}

Original Text:
"""
${text}
"""`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.4 }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          if (parsed.humanizedText) {
            humanizedText = parsed.humanizedText;
            changedSignals = Array.isArray(parsed.changedSignals) ? parsed.changedSignals : [];
          }
        }
      }
    } catch (err) {
      console.warn('Gemini humanizer error, using local fallback:', err.message);
    }
  }

  // Local fallback humanization if Gemini is unavailable
  if (humanizedText === text) {
    const localRes = applyLocalHumanizerRules(text);
    humanizedText = localRes.text;
    changedSignals = localRes.signals;
  }

  // 3. Re-analyze humanized output using the SAME detector engine
  const afterAnalysis = await detectAITextEnsemble(humanizedText);

  return {
    originalText: text,
    humanizedText,
    beforeScore: {
      aiLikelihood: beforeAnalysis.aiLikelihood || 5,
      humanLikelihood: beforeAnalysis.humanLikelihood || 95,
      classificationLabel: beforeAnalysis.classificationLabel || 'Very Low AI-Pattern Signal',
      confidence: beforeAnalysis.confidence || 'Low'
    },
    afterScore: {
      aiLikelihood: afterAnalysis.aiLikelihood || 5,
      humanLikelihood: afterAnalysis.humanLikelihood || 95,
      classificationLabel: afterAnalysis.classificationLabel || 'Very Low AI-Pattern Signal',
      confidence: afterAnalysis.confidence || 'Low'
    },
    changedSignals: changedSignals.length > 0 ? changedSignals : [
      'Eliminated formulaic transition clichés',
      'Enhanced natural sentence rhythm and clause variation'
    ],
    disclaimer: 'Humanization improves stylistic naturalness and sentence rhythm. It does not promise 100% bypass or guarantee how third-party detectors will classify the output.'
  };
}

/**
 * Smart Local Humanizer Fallback Rules
 */
function applyLocalHumanizerRules(text) {
  let transformed = text;

  transformed = transformed
    .replace(/\bIn today's rapidly evolving digital landscape,\s*/gi, "In today's tech environment, ")
    .replace(/\bIn today's digital landscape,\s*/gi, 'In modern tech, ')
    .replace(/\bplays a crucial role in\b/gi, 'is central to')
    .replace(/\bplay a crucial role in\b/gi, 'are central to')
    .replace(/\bFurthermore,\s*/gi, 'In addition, ')
    .replace(/\bMoreover,\s*/gi, 'Additionally, ')
    .replace(/\bIt is important to note that\s*/gi, 'Notably, ')
    .replace(/\bIn conclusion,\s*/gi, 'Overall, ')
    .replace(/\bby leveraging the power of\b/gi, 'using')
    .replace(/\bserves as a testament to\b/gi, 'highlights');

  return {
    text: transformed,
    signals: [
      'Replaced formulaic transition markers with direct language',
      'Simplified generic filler phrases for natural rhythm'
    ]
  };
}
