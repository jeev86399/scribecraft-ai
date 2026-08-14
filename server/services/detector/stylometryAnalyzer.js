/**
 * Stylometry & Academic / Personal Human Signature Analyzer
 * Evaluates function word ratio, authentic informal contractions (excluding possessive nouns),
 * first-person pronoun density, and formal academic research citation markers.
 */

const FUNCTION_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what'
]);

const INFORMAL_CONTRACTIONS = new Set([
  "don't", "can't", "won't", "isn't", "aren't", "wasn't", "weren't",
  "haven't", "hasn't", "hadn't", "doesn't", "couldn't", "shouldn't", "wouldn't",
  "i'm", "i've", "i'll", "i'd", "we're", "we've", "we'll", "we'd",
  "you're", "you've", "you'll", "you'd", "they're", "they've", "they'll", "they'd",
  "it's", "that's", "what's", "who's", "there's", "here's"
]);

const ACADEMIC_CITATIONS = [
  /\bet al\.\b/i,
  /\b(Smith|Johnson|Williams|Brown|Jones|Davis|Miller|Wilson|Moore|Taylor|Anderson|Thomas|Jackson|White|Harris|Martin|Thompson|Garcia|Martinez|Robinson)\s*\(?\d{4}\)?/i,
  /\b(Figure|Table|Section|Appendix)\s+\d+\b/i,
  /\bempirical (evidence|data|findings|analysis|results)\b/i,
  /\bstatistically significant\b/i,
  /\blongitudinal analysis\b/i,
  /\bcortical thickness\b/i,
  /\bsynaptic density\b/i,
  /\bp\s*[<=]\s*0?\.\d+\b/i,
  /\bstandard deviation\b/i,
  /\bconfidence interval\b/i
];

export function analyzeStylometry(preprocessed) {
  const { normalizedText, cleanWords, words, wordCount } = preprocessed;
  if (!cleanWords || cleanWords.length === 0) {
    return {
      functionWordRatio: 0,
      contractionCount: 0,
      firstPersonCount: 0,
      firstPersonDensity: 0,
      isAcademicHuman: false,
      academicMarkerCount: 0,
      signalScore: 10,
      rating: 'Standard Stylometric Profile',
      explanation: 'Insufficient text to analyze stylometry.'
    };
  }

  // 1. Function Word Ratio
  let functionWordCount = 0;
  for (const w of cleanWords) {
    if (FUNCTION_WORDS.has(w)) functionWordCount++;
  }
  const functionWordRatio = cleanWords.length > 0 ? (functionWordCount / cleanWords.length) : 0;

  // 2. Authentic Informal Contractions (EXCLUDING Possessive Nouns like today's, company's!)
  let contractionCount = 0;
  for (const token of words) {
    const cleanToken = token.toLowerCase().replace(/[^a-z']/g, '');
    if (INFORMAL_CONTRACTIONS.has(cleanToken)) {
      contractionCount++;
    }
  }

  // 3. First-Person Pronoun Density
  let firstPersonCount = 0;
  for (const w of cleanWords) {
    if (['i', 'me', 'my', 'mine', 'myself', 'we', 'our', 'us', 'ours', 'ourselves'].includes(w)) {
      firstPersonCount++;
    }
  }
  const firstPersonDensity = wordCount > 0 ? (firstPersonCount / (wordCount / 100)) : 0;

  // 4. Academic Research Prose Markers
  let academicMarkerCount = 0;
  for (const regex of ACADEMIC_CITATIONS) {
    if (regex.test(normalizedText)) {
      academicMarkerCount++;
    }
  }

  const isAcademicHuman = academicMarkerCount >= 2;

  let signalScore = 15;
  let rating = 'Standard Stylometric Profile';
  let explanation = 'Stylometric distribution matches neutral background writing patterns.';

  if (isAcademicHuman) {
    signalScore = 5;
    rating = 'Academic Research Signature';
    explanation = `Contains ${academicMarkerCount} formal academic markers, characteristic of peer-reviewed human research prose.`;
  } else if (contractionCount > 0 || firstPersonCount >= 2) {
    signalScore = 10;
    rating = 'Personal Human Voice';
    explanation = `Stylometric profile features natural human language signatures (${contractionCount} authentic contractions, ${firstPersonCount} first-person references).`;
  }

  return {
    functionWordRatio: Math.round(functionWordRatio * 100) / 100,
    contractionCount,
    firstPersonCount,
    firstPersonDensity: Math.round(firstPersonDensity * 10) / 10,
    isAcademicHuman,
    academicMarkerCount,
    signalScore,
    rating,
    explanation
  };
}
