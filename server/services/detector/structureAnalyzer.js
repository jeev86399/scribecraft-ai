/**
 * Structural Symmetry & Paragraph Balance Analyzer (Signal 7)
 * Evaluates paragraph length balance, structural symmetry, and clause depth uniformity.
 */

export function analyzeStructure(preprocessed) {
  const { paragraphs, sentences, wordCount } = preprocessed;
  if (!paragraphs || paragraphs.length === 0 || wordCount < 30) {
    return {
      paragraphCount: paragraphs.length,
      paragraphLengthVariance: 0,
      structuralUniformity: 0,
      signalScore: 20,
      rating: 'Natural Structure',
      explanation: 'Insufficient text to measure structural symmetry.'
    };
  }

  const paraWordCounts = paragraphs.map(p => p.trim().split(/\s+/).filter(Boolean).length);
  const paraCount = paraWordCounts.length;

  const sum = paraWordCounts.reduce((a, b) => a + b, 0);
  const meanParaLen = sum / paraCount;

  const variance = paraWordCounts.reduce((acc, len) => acc + Math.pow(len - meanParaLen, 2), 0) / paraCount;
  const stdDev = Math.sqrt(variance);
  const cv = meanParaLen > 0 ? (stdDev / meanParaLen) : 0;

  // AI-generated essays/articles typically display balanced paragraph lengths (CV < 0.25)
  let signalScore = 20;
  if (paraCount >= 2) {
    if (cv < 0.20) signalScore = 80;
    else if (cv < 0.35) signalScore = 60;
    else if (cv < 0.50) signalScore = 40;
    else signalScore = 20;
  }

  let rating = 'Natural Structure';
  if (signalScore >= 70) rating = 'High Structural Uniformity';
  else if (signalScore >= 45) rating = 'Balanced Structure';

  let explanation = 'Paragraph lengths and structural formatting show natural human variation.';
  if (paraCount >= 2 && cv < 0.25) {
    explanation = `Paragraphs exhibit high structural balance across ${paraCount} sections (Paragraph CV = ${cv.toFixed(2)}).`;
  }

  return {
    paragraphCount: paraCount,
    meanParagraphLength: Math.round(meanParaLen),
    paragraphCv: Math.round(cv * 100) / 100,
    signalScore,
    rating,
    explanation
  };
}
