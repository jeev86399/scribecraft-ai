/**
 * High-Level Generic Exposition & Semantic Interchangeability Analyzer
 * Measures semantic interchangeability index, abstract noun/adjective density,
 * and industry enumeration without grounded context.
 */

const ABSTRACT_EXPOSITORY_WORDS = new Set([
  'innovation', 'innovative', 'efficiency', 'efficient', 'optimization', 'optimize',
  'integration', 'integrate', 'transformation', 'transform', 'transformative',
  'paradigm', 'framework', 'ecosystem', 'landscape', 'opportunities', 'challenges',
  'ethical', 'ethics', 'considerations', 'responsible', 'sustainability', 'sustainable',
  'implementation', 'implement', 'advancement', 'advancements', 'strategic',
  'decision-making', 'productivity', 'streamline', 'streamlining', 'scalability',
  'flexible', 'interconnected', 'proactive', 'holistic', 'synergy', 'potential'
]);

const GENERIC_EXPOSITORY_TEMPLATES = [
  /\b[a-z\s]+ plays? a (crucial|pivotal|key|vital|essential) role in [a-z\s]+\b/gi,
  /\bby leveraging (the power of )?[a-z\s]+, (organizations|businesses|companies|individuals) can\b/gi,
  /\bin (today's|an) (rapidly|increasingly)? (evolving|digital|interconnected) (landscape|world|environment|era)\b/gi,
  /\bas (technology|innovation|ai|automation) continues to (evolve|advance|grow)\b/gi,
  /\bit is (important|essential|crucial|vital) to (note|consider|remember|recognize) that\b/gi,
  /\b(from|across) [a-z]+ to [a-z]+, (and|as well as) [a-z]+\b/gi
];

export function analyzeGenericExposition(preprocessed) {
  const { normalizedText, cleanWords, wordCount, sentences } = preprocessed;
  if (!normalizedText || wordCount < 15) {
    return {
      interchangeabilityIndex: 0,
      abstractDensity: 0,
      industryEnumerationCount: 0,
      signalScore: 10,
      rating: 'Grounded Topic Detail',
      explanation: 'Insufficient text to analyze generic exposition.'
    };
  }

  const lowerText = normalizedText.toLowerCase();

  // 1. Abstract Noun & Generic Adjective Density
  let abstractWordCount = 0;
  for (const w of cleanWords) {
    if (ABSTRACT_EXPOSITORY_WORDS.has(w)) {
      abstractWordCount++;
    }
  }

  const abstractDensityPer100 = wordCount > 0 ? (abstractWordCount / (wordCount / 100)) : 0;

  // 2. Semantic Interchangeability Index (Slot-filler template matching)
  let templateMatchCount = 0;
  for (const regex of GENERIC_EXPOSITORY_TEMPLATES) {
    const matches = lowerText.match(regex);
    if (matches) {
      templateMatchCount += matches.length;
    }
  }

  // 3. Industry Enumeration without Context (e.g., "healthcare, education, finance, and transportation")
  const enumerationRegex = /\b(healthcare|education|finance|manufacturing|retail|transportation|logistics|agriculture|energy|business|technology|government)\s*(,|\s+and|\s+or)\s*(healthcare|education|finance|manufacturing|retail|transportation|logistics|agriculture|energy|business|technology|government)\b/gi;
  const enumerationMatches = (lowerText.match(enumerationRegex) || []).length;

  const interchangeabilityIndex = Math.min(100, Math.round((templateMatchCount * 30) + (enumerationMatches * 25) + (abstractDensityPer100 * 8)));

  // 4. Compute Signal Score
  let signalScore = 10;
  if (interchangeabilityIndex >= 65 || (templateMatchCount >= 2 && abstractDensityPer100 >= 3.5)) {
    signalScore = 90;
  } else if (interchangeabilityIndex >= 45 || templateMatchCount >= 1) {
    signalScore = 75;
  } else if (abstractDensityPer100 >= 2.5) {
    signalScore = 50;
  }

  let rating = 'Grounded Topic Detail';
  if (signalScore >= 75) rating = 'High Semantic Interchangeability';
  else if (signalScore >= 50) rating = 'Moderate Expository Abstraction';

  let explanation = 'Text demonstrates grounded topic-specific detail with low semantic interchangeability.';
  if (signalScore >= 75) {
    explanation = `High semantic interchangeability detected (${abstractDensityPer100.toFixed(1)} abstract terms per 100 words) with generic expository template progression.`;
  }

  return {
    interchangeabilityIndex,
    abstractDensityPer100: Math.round(abstractDensityPer100 * 10) / 10,
    templateMatchCount,
    industryEnumerationCount: enumerationMatches,
    signalScore,
    rating,
    explanation
  };
}
