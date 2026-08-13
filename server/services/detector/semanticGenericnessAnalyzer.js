/**
 * Semantic Genericness Analyzer
 * Evaluates text for broad claims, interchangeable examples, low personal specificity,
 * and lack of concrete lived experience.
 */

const GENERIC_EXPOSITORY_PATTERNS = [
  'plays a crucial role in',
  'play a crucial role in',
  'is essential for',
  'are essential for',
  'has a profound impact on',
  'have a profound impact on',
  'serves as a foundation for',
  'serve as a foundation for',
  'in an increasingly interconnected',
  'in an increasingly digital',
  'various factors contribute to',
  'it is important to understand',
  'it is crucial to recognize',
  'a wide range of',
  'significant implications for',
  'key aspect of',
  'fundamental element of',
  'integral part of',
  'vital role in'
];

export function analyzeSemanticGenericness(preprocessed) {
  const { normalizedText, words, cleanWords, wordCount } = preprocessed;
  if (!normalizedText || wordCount < 15) {
    return {
      genericnessScore: 0,
      detectedGenericPatterns: [],
      specificDetailsCount: 0,
      signalScore: 10,
      rating: 'Specific Details',
      explanation: 'Insufficient text to evaluate semantic genericness.'
    };
  }

  const lowerText = normalizedText.toLowerCase();

  // 1. Detect Generic Expository Patterns
  const detectedPatterns = [];
  let genericCount = 0;

  for (const pattern of GENERIC_EXPOSITORY_PATTERNS) {
    const regex = new RegExp(`\\b${pattern.replace(/'/g, "\\'")}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      genericCount += matches.length;
      if (!detectedPatterns.includes(pattern)) {
        detectedPatterns.push(pattern);
      }
    }
  }

  // 2. Personal Specificity Markers (Proper nouns, numbers/dates, specific names)
  const numbersAndDates = (normalizedText.match(/\b\d+(\.\d+)?(%|\$|st|nd|rd|th)?\b/g) || []).length;
  const properNouns = (normalizedText.match(/\b[A-Z][a-z]{2,}\b/g) || []).filter(w => !['The', 'This', 'That', 'These', 'Those', 'In', 'On', 'At', 'For', 'With', 'However', 'Moreover', 'Furthermore', 'Overall'].includes(w)).length;

  const specificityScore = numbersAndDates * 1.5 + properNouns * 1.0;
  const specificityDensity = wordCount > 0 ? (specificityScore / (wordCount / 100)) : 0;

  // 3. Compute Genericness Signal Score
  let signalScore = 10;
  if (genericCount >= 3 || (genericCount >= 2 && specificityDensity < 1.0)) {
    signalScore = 85;
  } else if (genericCount >= 2 || (genericCount >= 1 && specificityDensity < 1.5)) {
    signalScore = 65;
  } else if (genericCount >= 1) {
    signalScore = 40;
  }

  let rating = 'Specific Details';
  if (signalScore >= 75) rating = 'High Genericness';
  else if (signalScore >= 50) rating = 'Moderate Genericness';

  let explanation = 'Text contains specific concrete details and lower generic abstraction.';
  if (signalScore >= 65) {
    explanation = `Text contains ${genericCount} generic expository patterns with low personal/concrete specificity (${specificityDensity.toFixed(1)} specificity density).`;
  }

  return {
    genericnessScore: signalScore,
    detectedGenericPatterns: detectedPatterns,
    specificityDensity: Math.round(specificityDensity * 10) / 10,
    signalScore,
    rating,
    explanation
  };
}
