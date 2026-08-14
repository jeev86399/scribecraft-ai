/**
 * Author Fingerprint Analyzer
 * Measures whether writing contains unique, distinctive individual author characteristics
 * versus an anonymous, generic LLM expository voice.
 */

export function analyzeAuthorFingerprint(preprocessed, genericnessRes, humanEvidenceRes) {
  const { sentences, words, wordCount } = preprocessed;
  if (!sentences || wordCount < 15) {
    return {
      fingerprintScore: 50,
      hasDistinctiveVoice: false,
      signalScore: 50,
      rating: 'Neutral Voice',
      explanation: 'Insufficient text to analyze author fingerprint.'
    };
  }

  // 1. Evaluate Personal Lived Detail & Specificity Density
  const specificityDensity = genericnessRes?.specificityDensity || 0;
  const hasHumanEvidence = humanEvidenceRes?.humanEvidenceScore >= 45;

  // 2. Evaluate Sentence Length Asymmetry (Natural Human Irregularity vs AI Uniformity)
  const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
  let lengthAsymmetry = 0;
  if (sentenceLengths.length >= 2) {
    let deltas = 0;
    for (let i = 0; i < sentenceLengths.length - 1; i++) {
      deltas += Math.abs(sentenceLengths[i] - sentenceLengths[i + 1]);
    }
    lengthAsymmetry = deltas / (sentenceLengths.length - 1);
  }

  // 3. Compute Author Fingerprint Score [0 - 100]
  // 100 = Highly distinctive individual human voice
  // 0 = Completely generic, anonymous LLM expository voice
  let fingerprintScore = 20;

  if (hasHumanEvidence) {
    fingerprintScore += 45;
  }

  if (specificityDensity >= 1.5) {
    fingerprintScore += 25;
  } else if (specificityDensity >= 0.5) {
    fingerprintScore += 10;
  }

  if (lengthAsymmetry >= 8.0) {
    fingerprintScore += 15;
  }

  fingerprintScore = Math.min(100, Math.max(0, fingerprintScore));

  const hasDistinctiveVoice = fingerprintScore >= 60;

  let rating = 'Generic LLM Expository Voice';
  if (fingerprintScore >= 75) rating = 'Strong Individual Author Fingerprint';
  else if (fingerprintScore >= 45) rating = 'Moderate Author Voice';

  let explanation = 'Text lacks a distinctive individual author fingerprint and exhibits an anonymous expository profile.';
  if (fingerprintScore >= 75) {
    explanation = 'Text displays a strong individual author fingerprint with distinctive personal voice and grounded details.';
  }

  return {
    fingerprintScore,
    lengthAsymmetry: Math.round(lengthAsymmetry * 10) / 10,
    hasDistinctiveVoice,
    signalScore: 100 - fingerprintScore, // High AI signal when author fingerprint is LOW!
    rating,
    explanation
  };
}
