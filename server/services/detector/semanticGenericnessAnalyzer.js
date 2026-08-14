/**
 * Semantic Genericness & Grounded Detail Analyzer
 * Clearly distinguishes Topical Context (broad industry lists like "healthcare, education, finance")
 * from Author-Specific Grounded Detail (numbers, specific named entities, personal experiences).
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
      topicalContextLevel: 'None',
      authorDetailLevel: 'Low',
      signalScore: 10,
      rating: 'Author-Specific Grounded Detail',
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

  // 2. Separate Topical Context vs Author-Specific Grounded Detail
  const genericSectors = new Set(['healthcare', 'education', 'finance', 'manufacturing', 'retail', 'transportation', 'technology', 'business', 'industry']);
  
  let topicalSectorCount = 0;
  for (const word of cleanWords) {
    if (genericSectors.has(word)) {
      topicalSectorCount++;
    }
  }

  const numbersAndDates = (normalizedText.match(/\b\d+(\.\d+)?(%|\$|st|nd|rd|th)?\b/g) || []).length;
  
  const rawProperNouns = (normalizedText.match(/\b[A-Z][a-z]{2,}\b/g) || []).filter(w => 
    !['The', 'This', 'That', 'These', 'Those', 'In', 'On', 'At', 'For', 'With', 'However', 'Moreover', 'Furthermore', 'Overall', 'Artificial', 'Intelligence', 'Digital', 'Technology'].includes(w) &&
    !genericSectors.has(w.toLowerCase())
  ).length;

  const authorSpecificityScore = numbersAndDates * 1.5 + rawProperNouns * 1.0;
  const specificityDensity = wordCount > 0 ? (authorSpecificityScore / (wordCount / 100)) : 0;

  let topicalContextLevel = 'Low';
  if (topicalSectorCount >= 3) topicalContextLevel = 'High Industry Enumeration';
  else if (topicalSectorCount >= 1) topicalContextLevel = 'Moderate Topical Reference';

  let authorDetailLevel = 'Low';
  if (specificityDensity >= 1.5) authorDetailLevel = 'High Author Grounded Detail';
  else if (specificityDensity >= 0.5) authorDetailLevel = 'Moderate Specific Detail';

  // 3. Compute Genericness Signal Score
  let signalScore = 10;
  if (genericCount >= 3 || (genericCount >= 2 && specificityDensity < 0.5)) {
    signalScore = 90;
  } else if (genericCount >= 2 || (genericCount >= 1 && specificityDensity < 1.0)) {
    signalScore = 75;
  } else if (genericCount >= 1) {
    signalScore = 50;
  }

  let rating = 'Author-Specific Grounded Detail';
  if (signalScore >= 75) {
    rating = topicalSectorCount >= 2 ? 'Broad Industry Enumeration without Personal Detail' : 'Broad Abstract Claims with Low Specificity';
  } else if (signalScore >= 50) {
    rating = 'Moderate Expository Genericness';
  }

  let explanation = 'Text contains specific grounded details and concrete human references.';
  if (signalScore >= 75) {
    explanation = topicalSectorCount >= 2 
      ? `Text enumerates broad sectors (${topicalSectorCount} industry terms) without personal/author-specific grounded detail.`
      : `Text consists of broad abstract claims with low personal/author-specific detail (${specificityDensity.toFixed(1)} specificity density).`;
  }

  return {
    genericnessScore: signalScore,
    detectedGenericPatterns: detectedPatterns,
    specificityDensity: Math.round(specificityDensity * 10) / 10,
    topicalContextLevel,
    authorDetailLevel,
    signalScore,
    rating,
    explanation
  };
}
