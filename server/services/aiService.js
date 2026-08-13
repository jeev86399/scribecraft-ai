import { analyzeTextWithNLP, analyzeTone } from './nlpEngine.js';
import { calculateWritingScore } from './scoringEngine.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * Perform Text Analysis (Combines local NLP engine + optional Gemini AI enrichment)
 */
export async function analyzeTextService(text, customDictionary = [], enabledCategories = null) {
  // Always run local NLP Engine first for baseline zero-latency results
  const nlpResult = analyzeTextWithNLP(text, customDictionary, enabledCategories);

  // If Gemini API Key is available, we can optionally enhance with AI suggestions
  if (GEMINI_API_KEY && text.trim().length > 20) {
    try {
      const aiSuggestions = await fetchGeminiSuggestions(text, enabledCategories);
      if (aiSuggestions && Array.isArray(aiSuggestions) && aiSuggestions.length > 0) {
        // Merge AI suggestions with local NLP suggestions, preventing exact duplicate overlaps
        const merged = [...nlpResult.suggestions];
        for (const aiSugg of aiSuggestions) {
          const overlap = merged.some(s =>
            Math.abs(s.startPosition - aiSugg.startPosition) < 5 &&
            s.originalText.toLowerCase() === aiSugg.originalText.toLowerCase()
          );
          if (!overlap) {
            merged.push(aiSugg);
          }
        }
        merged.sort((a, b) => a.startPosition - b.startPosition);
        nlpResult.suggestions = merged;
      }
    } catch (err) {
      console.warn('Gemini API call warning (falling back to local NLP engine):', err.message);
    }
  }

  // Calculate scores
  const scoreResult = calculateWritingScore(text, nlpResult.suggestions, nlpResult.stats);

  return {
    suggestions: nlpResult.suggestions,
    score: scoreResult.overallScore,
    scoreBreakdown: scoreResult.breakdown,
    readability: scoreResult.readability,
    stats: nlpResult.stats,
    tone: nlpResult.tone
  };
}

/**
 * Fetch Structured Suggestions from Gemini API
 */
async function fetchGeminiSuggestions(text, enabledCategories) {
  const prompt = `You are a professional writing proofreader and AI writing assistant.
Analyze the following text and return a JSON array of specific writing suggestions (spelling, grammar, punctuation, clarity, conciseness, readability, word_choice, tone, style).

Do not suggest changes for proper nouns, names, URLs, email addresses, or valid code snippets.
Return ONLY valid JSON matching this schema:
[
  {
    "category": "spelling|grammar|punctuation|clarity|conciseness|readability|word_choice|tone|style",
    "severity": "error|warning|suggestion|enhancement",
    "originalText": "exact substring from text",
    "suggestedReplacement": "improved replacement string",
    "startPosition": 0,
    "endPosition": 5,
    "explanation": "clear explanation why",
    "confidence": 0.95,
    "ruleType": "rule_name",
    "autoFixable": true
  }
]

Text to analyze:
"""
${text}
"""`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini HTTP error ${response.status}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) return [];

  const parsed = JSON.parse(rawText);
  if (!Array.isArray(parsed)) return [];

  return parsed.map((item, idx) => ({
    id: `ai_issue_${idx + 1}_${Date.now()}`,
    category: item.category || 'clarity',
    severity: item.severity || 'suggestion',
    originalText: item.originalText || '',
    suggestedReplacement: item.suggestedReplacement || '',
    startPosition: item.startPosition || 0,
    endPosition: item.endPosition || 0,
    explanation: item.explanation || 'AI suggestion',
    confidence: item.confidence || 0.85,
    ruleType: item.ruleType || 'ai_enhancement',
    autoFixable: typeof item.autoFixable === 'boolean' ? item.autoFixable : true
  }));
}

/**
 * AI Text Rewriting & Tone Transformation Service
 */
export async function rewriteTextService(text, instructionType, targetTone = 'Professional') {
  if (!text || text.trim().length === 0) {
    return { rewrittenText: text, explanation: 'No text provided.' };
  }

  // Local rule-based rewrite fallback
  const localRewrite = getLocalRewriteFallback(text, instructionType, targetTone);

  if (GEMINI_API_KEY) {
    try {
      const prompt = `You are an expert editor and AI writing assistant.
Rewrite the following text according to the target goal: "${instructionType}" and target tone: "${targetTone}".
Return a JSON object with two fields:
1. "rewrittenText": the improved text
2. "explanation": a concise 1-sentence explanation of changes made.

Original Text:
"""
${text}
"""`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.3 }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          if (parsed.rewrittenText) {
            return {
              rewrittenText: parsed.rewrittenText,
              explanation: parsed.explanation || `Rewritten for ${instructionType} (${targetTone} tone).`
            };
          }
        }
      }
    } catch (err) {
      console.warn('Gemini rewrite error, using local fallback:', err.message);
    }
  }

  return localRewrite;
}

/**
 * Paraphrasing Service (8 Modes: Standard, Fluency, Formal, Professional, Academic, Simple, Creative, Concise)
 */
export async function paraphraseTextService(text, mode = 'Standard') {
  if (!text || text.trim().length === 0) {
    return { paraphrasedText: text, mode, explanation: 'No text provided.' };
  }

  // Local fallback paraphraser
  const localParaphrase = getLocalParaphraseFallback(text, mode);

  if (GEMINI_API_KEY) {
    try {
      const prompt = `You are a professional editor and paraphrasing engine.
Paraphrase the following text in "${mode}" mode while strictly preserving the original meaning, facts, numbers, dates, proper nouns, and URLs.
Do NOT introduce grammatical errors.

Return ONLY a JSON object:
{
  "paraphrasedText": "rewritten text",
  "explanation": "concise 1-sentence summary of changes"
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
          generationConfig: { responseMimeType: 'application/json', temperature: 0.3 }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          if (parsed.paraphrasedText) {
            return {
              paraphrasedText: parsed.paraphrasedText,
              mode,
              explanation: parsed.explanation || `Paraphrased in ${mode} mode.`
            };
          }
        }
      }
    } catch (err) {
      console.warn('Gemini paraphrase error, using local fallback:', err.message);
    }
  }

  return {
    paraphrasedText: localParaphrase.rewrittenText,
    mode,
    explanation: localParaphrase.explanation
  };
}

/**
 * Local Paraphrase Fallback
 */
function getLocalParaphraseFallback(text, mode) {
  const m = mode.toLowerCase();
  if (m === 'fluency' || m === 'standard') {
    return getLocalRewriteFallback(text, 'Improve clarity', 'Neutral');
  } else if (m === 'formal') {
    return getLocalRewriteFallback(text, 'Make more formal', 'Formal');
  } else if (m === 'professional') {
    return getLocalRewriteFallback(text, 'Make more professional', 'Professional');
  } else if (m === 'academic') {
    return getLocalRewriteFallback(text, 'Rewrite for academic writing', 'Academic');
  } else if (m === 'simple') {
    return {
      rewrittenText: text.replace(/\butilize\b/gi, 'use').replace(/\bcommence\b/gi, 'start').replace(/\bterminate\b/gi, 'end'),
      explanation: 'Simplified complex words for easier reading.'
    };
  } else if (m === 'creative') {
    return {
      rewrittenText: text.replace(/\bgood\b/gi, 'exceptional').replace(/\bgreat\b/gi, 'remarkable').replace(/\bbig\b/gi, 'substantial'),
      explanation: 'Enhanced vocabulary with creative descriptive phrasing.'
    };
  } else if (m === 'concise') {
    return getLocalRewriteFallback(text, 'Make more concise', 'Neutral');
  }
  return getLocalRewriteFallback(text, mode, 'Neutral');
}

/**
 * Smart Local Fallback Rewriter
 */
function getLocalRewriteFallback(text, instructionType, targetTone) {
  let rewritten = text;
  let explanation = '';

  const lowerGoal = (instructionType || '').toLowerCase();

  if (lowerGoal.includes('concise')) {
    rewritten = rewritten
      .replace(/\bin order to\b/gi, 'to')
      .replace(/\bat this point in time\b/gi, 'now')
      .replace(/\bdue to the fact that\b/gi, 'because')
      .replace(/\bfor the purpose of\b/gi, 'for')
      .replace(/\bwith regard to\b/gi, 'regarding')
      .replace(/\bmake a decision\b/gi, 'decide');
    explanation = 'Simplified verbose phrases and wordy expressions for conciseness.';
  } else if (lowerGoal.includes('professional') || targetTone === 'Professional') {
    rewritten = rewritten
      .replace(/\bthanks\b/gi, 'Thank you')
      .replace(/\bhey\b/gi, 'Dear')
      .replace(/\bcool\b/gi, 'excellent')
      .replace(/\bstuff\b/gi, 'matters')
      .replace(/\bgonna\b/gi, 'going to')
      .replace(/\bwanna\b/gi, 'want to');
    explanation = 'Replaced casual vocabulary with professional business phrasing.';
  } else if (lowerGoal.includes('formal') || targetTone === 'Formal') {
    rewritten = rewritten
      .replace(/\bcan't\b/gi, 'cannot')
      .replace(/\bdon't\b/gi, 'do not')
      .replace(/\bwon't\b/gi, 'will not')
      .replace(/\bit's\b/gi, 'it is')
      .replace(/\bthat's\b/gi, 'that is');
    explanation = 'Expanded contractions and enhanced formal sentence structure.';
  } else if (lowerGoal.includes('confident') || targetTone === 'Confident') {
    rewritten = rewritten
      .replace(/\bI think that\b/gi, 'I am confident that')
      .replace(/\bmaybe we could\b/gi, 'we will')
      .replace(/\bprobably\b/gi, 'definitely')
      .replace(/\bseems to be\b/gi, 'is');
    explanation = 'Strengthened weak hedges with assertive, confident phrasing.';
  } else if (lowerGoal.includes('friendly') || targetTone === 'Friendly') {
    rewritten = rewritten
      .replace(/\bPlease find attached\b/gi, "I've attached")
      .replace(/\bSincerely\b/gi, 'Warmly')
      .replace(/\bRegards\b/gi, 'Best wishes');
    explanation = 'Warmed up formal phrasing for a friendly, approachable tone.';
  } else {
    rewritten = rewritten
      .replace(/\butilize\b/gi, 'use')
      .replace(/\bcommence\b/gi, 'start')
      .replace(/\bterminate\b/gi, 'end')
      .replace(/\bin order to\b/gi, 'to');
    explanation = `Enhanced sentence flow and clarity for ${targetTone} tone.`;
  }

  return { rewrittenText: rewritten, explanation };
}
