/**
 * Stylometric Feature Profile Analyzer (Signal 9)
 * Evaluates function word distribution, punctuation ratios, and word length variance.
 */

export function analyzeStylometry(preprocessed) {
  const { cleanWords, functionWords, normalizedText, sentences, wordCount } = preprocessed;
  if (!cleanWords || wordCount < 15) {
    return {
      functionWordRatio: 0,
      punctuationPerSentence: 0,
      avgWordLength: 0,
      signalScore: 25,
      rating: 'Natural Profile',
      explanation: 'Insufficient text for stylometric profiling.'
    };
  }

  // 1. Function Word Ratio
  const functionWordRatio = wordCount > 0 ? (functionWords.length / wordCount) : 0;

  // 2. Punctuation Ratios (commas, semicolons, colons, dashes)
  const commas = (normalizedText.match(/,/g) || []).length;
  const semicolons = (normalizedText.match(/;/g) || []).length;
  const dashes = (normalizedText.match(/—|-/g) || []).length;
  const totalPunctuation = commas + semicolons + dashes;
  
  const puncPerSentence = sentences.length > 0 ? (totalPunctuation / sentences.length) : 0;

  // 3. Average Word Length & Variance
  const wordLengths = cleanWords.map(w => w.length);
  const avgWordLength = wordLengths.reduce((a, b) => a + b, 0) / wordCount;

  // AI-generated text often shows a tight function word ratio (~0.45 - 0.55) and disciplined comma usage
  let signalScore = 25;
  if (functionWordRatio >= 0.46 && functionWordRatio <= 0.56 && avgWordLength >= 4.8 && avgWordLength <= 5.8) {
    signalScore = 60;
  } else if (functionWordRatio < 0.40 || functionWordRatio > 0.65) {
    signalScore = 20; // Human writing varies widely
  }

  let rating = 'Natural Profile';
  if (signalScore >= 55) rating = 'Disciplined Stylometric Profile';

  let explanation = `Stylometric profile displays standard function word distribution (${(functionWordRatio * 100).toFixed(0)}%) and punctuation density.`;
  if (signalScore >= 55) {
    explanation = `Stylometric features show controlled function word ratio (${(functionWordRatio * 100).toFixed(0)}%) and average word length (${avgWordLength.toFixed(1)} chars).`;
  }

  return {
    functionWordRatio: Math.round(functionWordRatio * 100) / 100,
    punctuationPerSentence: Math.round(puncPerSentence * 10) / 10,
    avgWordLength: Math.round(avgWordLength * 10) / 10,
    signalScore,
    rating,
    explanation
  };
}
