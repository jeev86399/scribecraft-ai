/**
 * Semantic Genericness Analyzer
 * Strictly distinguishes true concrete human details (personal experiences, specific dates, concrete locations)
 * from generic example listings ("healthcare, education, finance") and abstract expository claims.
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
      specificityDensity: 0,
      signalScore: 10,
      rating: 'Grounded Topic Detail',
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

  // 2. TRUE Concrete Human Detail vs Broad Industry Listings
  // Exclude generic sector enumeration words from proper noun count
  const genericSectors = new Set(['healthcare', 'education', 'finance', 'manufacturing', 'retail', 'transportation', 'technology', 'business', 'industry']);
  
  const numbersAndDates = (normalizedText.match(/\b\d+(\.\d+)?(%|\$|st|nd|rd|th)?\b/g) || []).length;
  
  const rawProperNouns = (normalizedText.match(/\b[A-Z][a-z]{2,}\b/g) || []).filter(w => 
    !['The', 'This', 'That', 'These', 'Those', 'In', 'On', 'At', 'For', 'With', 'However', 'Moreover', 'Furthermore', 'Overall', 'Artificial', 'Intelligence', 'Digital', 'Technology'].includes(w) &&
    !genericSectors.has(w.toLowerCase())
  ).length;

  // True specificity requires numbers, specific named entities, or personal lived detail
  const specificityScore = numbersAndDates * 1.5 + rawProperNouns * 1.0;
  const specificityDensity = wordCount > 0 ? (specificityScore / (wordCount / 100)) : 0;

  // 3. Compute Genericness Signal Score
  let signalScore = 10;
  if (genericCount >= 3 || (genericCount >= 2 && specificityDensity < 0.5)) {
    signalScore = 90;
  } else if (genericCount >= 2 || (genericCount >= 1 && specificityDensity < 1.0)) {
    signalScore = 75;
  } else if (genericCount >= 1) {
    signalScore = 50;
  }

  let rating = 'Grounded Topic Detail';
  if (signalScore >= 75) rating = 'Broad Abstract Claims with Low Specificity';
  else if (signalScore >= 50) rating = 'Moderate Expository Genericness';

  let explanation = 'Text contains specific grounded details and concrete human references.';
  if (signalScore >= 75) {
    explanation = `Text consists of broad abstract claims with low personal/concrete specificity (${specificityDensity.toFixed(1)} specificity density).`;
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
