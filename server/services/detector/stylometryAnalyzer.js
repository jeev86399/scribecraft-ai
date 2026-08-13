/**
 * Stylometric Feature Profile Analyzer (Signal 9)
 * Evaluates function word ratio, punctuation, contractions, first-person pronouns,
 * discourse markers, and academic human indicators.
 */

const ACADEMIC_CITATION_MARKERS = [
  'et al', 'figure', 'table', 'hypothesis', 'methodology',
  'statistically', 'statistically significant', 'p <', 'p >', 'empirical',
  'according to', 'as described by', 'data show', 'results indicate'
];

export function analyzeStylometry(preprocessed) {
  const { cleanWords, functionWords, normalizedText, sentences, wordCount } = preprocessed;
  if (!cleanWords || wordCount < 15) {
    return {
      functionWordRatio: 0,
      contractionCount: 0,
      firstPersonCount: 0,
      isAcademicHuman: false,
      signalScore: 25,
      rating: 'Natural Profile',
      explanation: 'Insufficient text for stylometric profiling.'
    };
  }

  const lowerText = normalizedText.toLowerCase();

  // 1. Contractions Detection
  const contractions = (normalizedText.match(/\b[a-z]+'(t|re|ve|ll|d|m|s)\b/gi) || []).length;

  // 2. First-Person Pronouns Detection
  const firstPersonPronouns = (normalizedText.match(/\b(i|me|my|mine|myself|we|us|our|ours)\b/gi) || []).length;
  const firstPersonDensity = wordCount > 0 ? (firstPersonPronouns / (wordCount / 100)) : 0;

  // 3. Academic Human Indicators (prevents false positives on academic prose)
  let academicMarkerCount = 0;
  for (const marker of ACADEMIC_CITATION_MARKERS) {
    if (lowerText.includes(marker)) academicMarkerCount++;
  }
  const isAcademicHuman = academicMarkerCount >= 2;

  // 4. Function Word Ratio & Word Length
  const functionWordRatio = wordCount > 0 ? (functionWords.length / wordCount) : 0;
  const wordLengths = cleanWords.map(w => w.length);
  const avgWordLength = wordCount > 0 ? (wordLengths.reduce((a, b) => a + b, 0) / wordCount) : 0;

  // 5. Score Calculation
  let signalScore = 25;
  
  if (isAcademicHuman) {
    signalScore = 15; // Strongly reduces AI false-positive risk for academic papers!
  } else if (contractions > 0 || firstPersonDensity > 2.0) {
    signalScore = 15; // Natural informal human writing signature
  } else if (functionWordRatio >= 0.46 && functionWordRatio <= 0.56 && avgWordLength >= 4.8 && avgWordLength <= 5.8) {
    signalScore = 55; // Standard disciplined profile
  }

  let rating = 'Natural Human Stylometry';
  if (isAcademicHuman) rating = 'Academic Formal Human Profile';
  else if (signalScore >= 55) rating = 'Disciplined Stylometric Profile';

  let explanation = `Stylometric profile features natural human language signatures (${contractions} contractions, ${firstPersonPronouns} first-person references).`;
  if (isAcademicHuman) {
    explanation = `Contains ${academicMarkerCount} formal academic markers, characteristic of peer-reviewed human research prose.`;
  } else if (signalScore >= 55) {
    explanation = `Stylometric features show controlled function word ratio (${(functionWordRatio * 100).toFixed(0)}%) and average word length (${avgWordLength.toFixed(1)} chars).`;
  }

  return {
    functionWordRatio: Math.round(functionWordRatio * 100) / 100,
    contractionCount: contractions,
    firstPersonCount: firstPersonPronouns,
    firstPersonDensity: Math.round(firstPersonDensity * 10) / 10,
    isAcademicHuman,
    academicMarkerCount,
    signalScore,
    rating,
    explanation
  };
}
