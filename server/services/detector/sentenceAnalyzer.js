/**
 * Sentence Length Distribution Analyzer (Signal 1)
 * Evaluates sentence length variance, standard deviation, and Coefficient of Variation (CV).
 */

export function analyzeSentenceLengths(preprocessed) {
  const { sentences } = preprocessed;
  if (!sentences || sentences.length === 0) {
    return {
      meanLength: 0,
      minLength: 0,
      maxLength: 0,
      variance: 0,
      stdDev: 0,
      cv: 0,
      uniformityScore: 0,
      signalScore: 0,
      explanation: 'Insufficient sentences to analyze distribution.'
    };
  }

  const lengths = sentences.map(s => s.split(/\s+/).filter(Boolean).length);
  const count = lengths.length;

  const sum = lengths.reduce((a, b) => a + b, 0);
  const meanLength = sum / count;
  const minLength = Math.min(...lengths);
  const maxLength = Math.max(...lengths);

  const variance = lengths.reduce((acc, len) => acc + Math.pow(len - meanLength, 2), 0) / count;
  const stdDev = Math.sqrt(variance);

  // Coefficient of Variation (CV = stdDev / mean)
  const cv = meanLength > 0 ? (stdDev / meanLength) : 0;

  // AI-generated text tends to have low CV (< 0.35) due to highly balanced sentence lengths.
  // Human text typically shows higher CV (> 0.50) with short punchy sentences mixed with longer ones.
  let uniformityScore = 0;
  if (cv < 0.25) uniformityScore = 85;
  else if (cv < 0.35) uniformityScore = 70;
  else if (cv < 0.45) uniformityScore = 50;
  else if (cv < 0.60) uniformityScore = 30;
  else uniformityScore = 15;

  let explanation = 'Natural variation in sentence lengths detected.';
  if (cv < 0.30) {
    explanation = `Sentences exhibit unusually uniform length distribution (CV = ${cv.toFixed(2)}, Mean = ${meanLength.toFixed(1)} words).`;
  } else if (cv > 0.55) {
    explanation = `Sentences demonstrate natural human length contrast (ranging from ${minLength} to ${maxLength} words).`;
  }

  return {
    meanLength: Math.round(meanLength * 10) / 10,
    minLength,
    maxLength,
    variance: Math.round(variance * 10) / 10,
    stdDev: Math.round(stdDev * 10) / 10,
    cv: Math.round(cv * 100) / 100,
    uniformityScore,
    signalScore: uniformityScore,
    explanation
  };
}
