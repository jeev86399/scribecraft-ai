/**
 * Text Preprocessor Module
 * Extracts structured tokens, sentences, paragraphs, function words, and n-grams.
 */

const FUNCTION_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
  'any', 'are', 'aren\'t', 'as', 'at', 'be', 'because', 'been', 'before', 'being',
  'below', 'between', 'both', 'but', 'by', 'can', 'can\'t', 'cannot', 'could',
  'did', 'do', 'does', 'doing', 'don\'t', 'down', 'during', 'each', 'few', 'for',
  'from', 'further', 'had', 'has', 'have', 'having', 'he', 'he\'d', 'he\'ll',
  'he\'s', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how',
  'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t',
  'it', 'its', 'itself', 'just', 'more', 'most', 'my', 'myself', 'no', 'nor',
  'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our', 'ours',
  'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some',
  'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves',
  'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too',
  'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where',
  'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your',
  'yours', 'yourself', 'yourselves'
]);

export function preprocessText(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return {
      rawText: '',
      normalizedText: '',
      paragraphs: [],
      sentences: [],
      words: [],
      cleanWords: [],
      functionWords: [],
      wordCount: 0,
      charCount: 0,
      bigrams: [],
      trigrams: []
    };
  }

  const normalizedText = rawText.trim().replace(/\r\n/g, '\n');
  const paragraphs = normalizedText.split(/\n\s*\n/).filter(p => p.trim().length > 0);

  // Robust Sentence Splitting
  const sentenceRegex = /[^.!?]+[.!?]+(?=\s+|$)/g;
  let matches = normalizedText.match(sentenceRegex);
  
  if (!matches || matches.length === 0) {
    matches = normalizedText.split('\n').filter(s => s.trim().length > 0);
  }
  const sentences = matches.map(s => s.trim()).filter(s => s.length > 0);

  // Words & Tokens
  const rawWords = normalizedText.split(/\s+/).filter(Boolean);
  const cleanWords = rawWords.map(w => w.toLowerCase().replace(/[^a-z0-9']/gi, '')).filter(Boolean);
  const functionWords = cleanWords.filter(w => FUNCTION_WORDS.has(w));

  // N-Grams
  const bigrams = [];
  for (let i = 0; i < cleanWords.length - 1; i++) {
    bigrams.push(`${cleanWords[i]} ${cleanWords[i + 1]}`);
  }

  const trigrams = [];
  for (let i = 0; i < cleanWords.length - 2; i++) {
    trigrams.push(`${cleanWords[i]} ${cleanWords[i + 1]} ${cleanWords[i + 2]}`);
  }

  return {
    rawText,
    normalizedText,
    paragraphs,
    sentences,
    words: rawWords,
    cleanWords,
    functionWords,
    wordCount: cleanWords.length,
    charCount: normalizedText.length,
    bigrams,
    trigrams
  };
}
