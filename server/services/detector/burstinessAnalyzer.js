/**
 * Structural Variance & Burstiness Analyzer (Family B)
 * Measures sentence-to-sentence length variation, rhythm, and structural burstiness.
 * V2 Rule: Uniformity does not necessarily mean AI (academic/technical writing is uniform).
 */

export function analyzeBurstiness(preprocessed) {
  const { sentences, paragraphs } = preprocessed;
  if (!sentences || sentences.length < 2) {
    return {
      available: false,
      reason: 'insufficient_sentences',
      burstinessIndex: 0,
      adjacentDeltaMean: 0,
      paragraphVariance: 0,
      cv: 0,
      signalScore: 0,
      rating: 'Uncertain',
      explanation: 'Insufficient text to calculate structural burstiness.'
    };
  }

  const lengths = sentences.map(s => s.split(/\s+/).filter(Boolean).length);

  // 1. Calculate adjacent sentence deltas (|Length_i - Length_{i+1}|)
  const deltas = [];
  for (let i = 0; i < lengths.length - 1; i++) {
    deltas.push(Math.abs(lengths[i] - lengths[i + 1]));
  }

  const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  const meanLen = lengths.reduce((a, b) => a + b, 0) / lengths.length;

  // Normalized Burstiness Index (B = (stdDev - mean) / (stdDev + mean))
  const variance = lengths.reduce((acc, l) => acc + Math.pow(l - meanLen, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);
  
  // Coefficient of Variation (CV = stdDev / meanLen)
  const cv = meanLen > 0 ? (stdDev / meanLen) : 0;
  
  const rawBurstiness = (stdDev + meanLen) > 0 ? (stdDev - meanLen) / (stdDev + meanLen) : 0;

  // 2. Paragraph length variation
  const paraLengths = paragraphs.map(p => p.split(/\s+/).filter(Boolean).length);
  let paraStdDev = 0;
  if (paraLengths.length > 1) {
    const paraMean = paraLengths.reduce((a, b) => a + b, 0) / paraLengths.length;
    const paraVar = paraLengths.reduce((acc, l) => acc + Math.pow(l - paraMean, 2), 0) / paraLengths.length;
    paraStdDev = Math.sqrt(paraVar);
  }

  // V2 Continuous Mapping: Convert CV to probability using logistic decay
  // We expect humans to have CV around 0.45 - 0.70.
  // We expect AI to have CV around 0.15 - 0.35.
  // Logistic function centered at cv=0.35, k=-12
  let signalScore = 100 / (1 + Math.exp(12 * (cv - 0.35)));

  // Length normalization has been removed from this file.
  // It is now strictly handled globally by calibrationService.js.

  let rating = 'High Natural Variation';
  if (signalScore >= 60) rating = 'High Uniformity (Potential Generative Pattern)';
  else if (signalScore >= 40) rating = 'Moderate Structural Uniformity';

  let explanation = `Structural variation is natural (CV = ${cv.toFixed(2)}, avg delta = ${avgDelta.toFixed(1)} words).`;
  if (signalScore >= 60) {
    explanation = `High structural uniformity detected (CV = ${cv.toFixed(2)}). May indicate generative AI or highly constrained technical/academic writing.`;
  }

  return {
    available: true,
    burstinessIndex: Math.round(rawBurstiness * 100) / 100,
    cv: Math.round(cv * 100) / 100,
    adjacentDeltaMean: Math.round(avgDelta * 10) / 10,
    paragraphStdDev: Math.round(paraStdDev * 10) / 10,
    signalScore,
    rating,
    explanation
  };
}
