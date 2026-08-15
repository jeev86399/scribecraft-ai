/**
 * Semantic Genericness Analyzer (Domain-Independent)
 * Separates "Abstract Genericness" (innovation, paradigm) from 
 * "Contextual Genericness" (broad everyday terms used in slot-filler ways like "lunch, salads, body, friends").
 */

// A broad list of highly abstract words often used as semantic filler across domains
const ABSTRACT_FILLER = new Set([
  'innovation', 'transformation', 'efficiency', 'optimization', 'opportunities', 
  'challenges', 'landscape', 'environment', 'ecosystem', 'framework', 'sustainability',
  'accountability', 'responsibility', 'advancement', 'integration', 'synergy'
]);

// Context-dependent filler words that might refer to any domain (food, health, business, etc.)
// e.g. "vital", "essential", "crucial", "variety", "diverse", "impact", "promote", "overall"
const CONTEXTUAL_FILLER = new Set([
  'vital', 'essential', 'crucial', 'important', 'significant', 'profound',
  'variety', 'diverse', 'multiple', 'various', 'numerous', 'impact', 'influence',
  'promote', 'foster', 'encourage', 'support', 'overall', 'general', 'broad',
  'well-being', 'productivity', 'success', 'growth', 'development', 'connection',
  'satisfying', 'appealing', 'beneficial', 'advantageous', 'fundamental', 'integral',
  'engaging', 'captivating', 'compelling', 'thoughtful', 'genuine', 'authentic',
  'authenticity', 'discoverability', 'resonance', 'meaningful', 'striking', 'blend',
  'showcase', 'elevate', 'seamless', 'tailored', 'unprecedented', 'empower'
]);

export function analyzeSemanticGenericness(preprocessed) {
  const { normalizedText, cleanWords, wordCount } = preprocessed;
  if (!normalizedText || wordCount < 15) {
    return {
      genericnessScore: 0,
      abstractDensity: 0,
      contextualDensity: 0,
      signalScore: 10,
      rating: 'Specific Context',
      explanation: 'Insufficient text to evaluate semantic genericness.'
    };
  }

  let abstractCount = 0;
  let contextualCount = 0;

  for (const word of cleanWords) {
    const w = word.toLowerCase();
    if (ABSTRACT_FILLER.has(w)) abstractCount++;
    if (CONTEXTUAL_FILLER.has(w)) contextualCount++;
  }

  const abstractDensity = wordCount > 0 ? (abstractCount / (wordCount / 100)) : 0;
  const contextualDensity = wordCount > 0 ? (contextualCount / (wordCount / 100)) : 0;

  // A genericness score driven by both abstract words and domain-agnostic filler
  const combinedDensity = abstractDensity + (contextualDensity * 0.75);

  let signalScore = 10;
  if (combinedDensity >= 8.0) {
    signalScore = 90; // Extremely high genericness
  } else if (combinedDensity >= 5.0) {
    signalScore = 75; // High genericness
  } else if (combinedDensity >= 3.0) {
    signalScore = 50; // Moderate genericness
  } else {
    signalScore = 20; // Low genericness
  }

  let rating = 'Specific Context';
  if (signalScore >= 75) {
    rating = abstractDensity > contextualDensity ? 'High Abstract Genericness' : 'High Contextual Genericness';
  } else if (signalScore >= 50) {
    rating = 'Moderate Genericness';
  }

  let explanation = 'Text contains specific, non-generic terminology.';
  if (signalScore >= 75) {
    explanation = `High semantic genericness detected (${abstractDensity.toFixed(1)} abstract/100w, ${contextualDensity.toFixed(1)} contextual/100w). Text relies heavily on broadly applicable filler.`;
  }

  return {
    genericnessScore: signalScore,
    abstractDensity: Math.round(abstractDensity * 10) / 10,
    contextualDensity: Math.round(contextualDensity * 10) / 10,
    combinedDensity: Math.round(combinedDensity * 10) / 10,
    signalScore,
    rating,
    explanation
  };
}
