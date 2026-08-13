/**
 * Burstiness & Rhythm Analyzer (Signal 2)
 * Measures sentence-to-sentence length delta variation, paragraph rhythm, and syntactic burstiness.
 */

export function analyzeBurstiness(preprocessed) {
  const { sentences, paragraphs } = preprocessed;
  if (!sentences || sentences.length < 2) {
    return {
      burstinessIndex: 0,
      adjacentDeltaMean: 0,
      paragraphVariance: 0,
      signalScore: 30,
      rating: 'Moderate',
      explanation: 'Insufficient text to calculate burstiness index.'
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
  const rawBurstiness = (stdDev + meanLen) > 0 ? (stdDev - meanLen) / (stdDev + meanLen) : 0;

  // 2. Paragraph length variation
  const paraLengths = paragraphs.map(p => p.split(/\s+/).filter(Boolean).length);
  let paraStdDev = 0;
  if (paraLengths.length > 1) {
    const paraMean = paraLengths.reduce((a, b) => a + b, 0) / paraLengths.length;
    const paraVar = paraLengths.reduce((acc, l) => acc + Math.pow(l - paraMean, 2), 0) / paraLengths.length;
    paraStdDev = Math.sqrt(paraVar);
  }

  // Low burstiness (monotonous length changes between adjacent sentences) is an AI pattern signal
  let signalScore = 0;
  if (avgDelta < 2.5) signalScore = 80;
  else if (avgDelta < 4.0) signalScore = 65;
  else if (avgDelta < 6.5) signalScore = 40;
  else if (avgDelta < 9.0) signalScore = 20;
  else signalScore = 10;

  let rating = 'High Natural Variation';
  if (signalScore >= 70) rating = 'High Uniformity';
  else if (signalScore >= 45) rating = 'Moderate Variation';

  let explanation = `Adjacent sentence deltas average ${avgDelta.toFixed(1)} words, indicating natural human rhythm.`;
  if (signalScore >= 70) {
    explanation = `Adjacent sentences show low delta variation (avg delta = ${avgDelta.toFixed(1)} words), characteristic of uniform AI generation.`;
  }

  return {
    burstinessIndex: Math.round(rawBurstiness * 100) / 100,
    adjacentDeltaMean: Math.round(avgDelta * 10) / 10,
    paragraphStdDev: Math.round(paraStdDev * 10) / 10,
    signalScore,
    rating,
    explanation
  };
}
