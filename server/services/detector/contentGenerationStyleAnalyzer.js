/**
 * Content Generation Style Analyzer
 * Detects informational writing characteristics typical of LLMs:
 * Unusually complete coverage in few sentences, no wasted thoughts, balanced information distribution.
 */

export function analyzeContentGenerationStyle(preprocessed) {
  const { wordCount, sentences } = preprocessed;
  if (wordCount < 20 || sentences.length < 2) {
    return {
      styleScore: 10,
      rating: 'Natural Ideation',
      explanation: 'Insufficient text to analyze content generation style.'
    };
  }

  // Calculate standard deviation of sentence lengths. 
  // LLMs often have highly balanced, similarly sized sentences compared to humans.
  const lengths = sentences.map(s => s.split(' ').length);
  const avgLen = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((a, b) => a + Math.pow(b - avgLen, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / avgLen; // Coefficient of Variation

  let styleScore = 10;
  
  // Very low variation in sentence length + moderate-to-long average sentence = typical LLM informational block
  if (cv < 0.25 && avgLen > 15) {
    styleScore = 85;
  } else if (cv < 0.35 && avgLen > 12) {
    styleScore = 65;
  } else if (cv > 0.6) {
    // High variation indicates natural human cadence
    styleScore = 5; 
  } else {
    styleScore = 30;
  }

  let rating = 'Natural Ideation';
  if (styleScore >= 75) rating = 'Highly Uniform Informational Style';
  else if (styleScore >= 50) rating = 'Balanced Informational Style';

  let explanation = `Text exhibits natural sentence length variation (CV: ${cv.toFixed(2)}).`;
  if (styleScore >= 50) {
    explanation = `Text exhibits unusually balanced informational distribution (CV: ${cv.toFixed(2)}, Avg Length: ${avgLen.toFixed(1)} words), characteristic of zero-shot generative output.`;
  }

  return {
    cv: Math.round(cv * 100) / 100,
    avgLen: Math.round(avgLen * 10) / 10,
    styleScore,
    rating,
    explanation
  };
}
