/**
 * Over-Coherence & Semantic Smoothness Analyzer
 * Evaluates whether text is unnaturally optimized for uniform conceptual continuity
 * and absence of spontaneous human detours.
 */

export function analyzeCoherence(preprocessed) {
  const { sentences, words, cleanWords, wordCount } = preprocessed;
  if (!sentences || sentences.length < 2 || wordCount < 25) {
    return {
      coherenceIndex: 0,
      signalScore: 10,
      rating: 'Natural Coherence',
      explanation: 'Insufficient text to analyze over-coherence.'
    };
  }

  // 1. Inter-Sentence Function Word Overlap Ratio
  const sentenceWordSets = sentences.map(s => {
    const tokens = s.toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z0-9]/gi, '')).filter(w => w.length > 3);
    return new Set(tokens);
  });

  let overlapSum = 0;
  let comparisons = 0;

  for (let i = 0; i < sentenceWordSets.length - 1; i++) {
    const s1 = sentenceWordSets[i];
    const s2 = sentenceWordSets[i + 1];

    let shared = 0;
    for (const token of s1) {
      if (s2.has(token)) shared++;
    }

    const minSize = Math.min(s1.size, s2.size);
    if (minSize > 0) {
      overlapSum += (shared / minSize);
      comparisons++;
    }
  }

  const avgOverlap = comparisons > 0 ? (overlapSum / comparisons) : 0;

  // AI-generated text exhibits uniform semantic overlap between adjacent sentences (~0.25 - 0.50)
  let coherenceIndex = Math.min(100, Math.round(avgOverlap * 200));

  let signalScore = 10;
  if (coherenceIndex >= 65) signalScore = 80;
  else if (coherenceIndex >= 45) signalScore = 60;
  else if (coherenceIndex >= 30) signalScore = 35;

  let rating = 'Natural Coherence';
  if (signalScore >= 70) rating = 'High Over-Coherence';
  else if (signalScore >= 45) rating = 'Disciplined Coherence';

  let explanation = 'Sentence transitions demonstrate natural human conceptual flow.';
  if (signalScore >= 70) {
    explanation = `High inter-sentence semantic continuity detected (${(avgOverlap * 100).toFixed(0)}% semantic overlap), characteristic of optimized LLM coherence.`;
  }

  return {
    coherenceIndex,
    avgSemanticOverlap: Math.round(avgOverlap * 100) / 100,
    signalScore,
    rating,
    explanation
  };
}
