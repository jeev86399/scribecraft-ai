import { commonWords, typoDictionary, wordReplacements } from '../utils/dictionary.js';

// Helper: Calculate Levenshtein distance for spelling suggestions
function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// Find closest spelling suggestion
function getSpellingSuggestion(word) {
  const lower = word.toLowerCase();
  
  // CRITICAL ACCURACY GUARD: Never flag valid dictionary words (like 'went', 'want', 'bought') as spelling errors!
  if (commonWords.has(lower)) {
    return null;
  }

  if (typoDictionary[lower]) {
    return typoDictionary[lower];
  }
  
  let minDistance = 3;
  let bestMatch = null;

  for (const candidate of commonWords) {
    if (Math.abs(candidate.length - word.length) > 2) continue;
    const dist = levenshtein(lower, candidate);
    if (dist < minDistance && dist < word.length * 0.4) {
      minDistance = dist;
      bestMatch = candidate;
    }
  }

  if (!bestMatch) return null;
  // Match original capitalization
  if (word[0] === word[0].toUpperCase()) {
    return bestMatch.charAt(0).toUpperCase() + bestMatch.slice(1);
  }
  return bestMatch;
}

// Pattern-based rules
const grammarRules = [
  {
    id: 'has_went_verb_tense',
    regex: /\b(has|have|had)\s+(went)\b/gi,
    category: 'grammar',
    severity: 'error',
    explanation: "Verb tense error. Auxiliary verbs (has/have/had) take past participle 'gone', or use 'went' without auxiliary.",
    confidence: 0.95,
    autoFixable: true,
    suggest: (match, aux) => `${aux} gone`
  },
  {
    id: 'irregular_past_tense',
    regex: /\b(buyed|bringed|teached|cought|goed|runned|catched|thinked|falled)\b/gi,
    category: 'grammar',
    severity: 'error',
    explanation: "Irregular verb form error. Use the correct past tense form.",
    confidence: 0.95,
    autoFixable: true,
    suggest: (match, word) => {
      const map = {
        buyed: 'bought', bringed: 'brought', teached: 'taught',
        cought: 'caught', goed: 'went', runned: 'ran',
        catched: 'caught', thinked: 'thought', falled: 'fell'
      };
      const lower = word.toLowerCase();
      const fixed = map[lower] || word;
      return word[0] === word[0].toUpperCase() ? fixed.charAt(0).toUpperCase() + fixed.slice(1) : fixed;
    }
  },
  {
    id: 'plural_quantity_agreement',
    regex: /\b(some|many|several|few|two|three)\s+(apple|car|book|friend|orange|banana|house|table|chair)\b/gi,
    category: 'grammar',
    severity: 'warning',
    explanation: "Plural agreement issue. Quantity modifier requires a plural noun.",
    confidence: 0.90,
    autoFixable: true,
    suggest: (match, qty, noun) => `${qty} ${noun}s`
  },
  {
    id: 'a_an_article',
    regex: /\b(a)\s+([aeiouAEIOU][a-zA-Z]*)\b/g,
    category: 'grammar',
    severity: 'error',
    explanation: "Use 'an' instead of 'a' before words starting with a vowel sound.",
    confidence: 0.95,
    autoFixable: true,
    suggest: (match, a, word) => `an ${word}`
  },
  {
    id: 'an_a_article',
    regex: /\b(an)\s+([bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ][a-zA-Z]*)\b/g,
    category: 'grammar',
    severity: 'error',
    explanation: "Use 'a' instead of 'an' before words starting with a consonant sound.",
    confidence: 0.90,
    autoFixable: true,
    suggest: (match, an, word) => {
      if (/^(hour|honest|honor|heir)/i.test(word)) return match;
      return `a ${word}`;
    }
  },
  {
    id: 'double_words',
    regex: /\b([a-zA-Z]+)\s+\1\b/gi,
    category: 'grammar',
    severity: 'warning',
    explanation: "Repeated word detected. Consider removing one.",
    confidence: 0.92,
    autoFixable: true,
    suggest: (match, word) => word
  },
  {
    id: 'subject_verb_they_is',
    regex: /\b(they|we|you)\s+(is|was)\b/gi,
    category: 'grammar',
    severity: 'error',
    explanation: "Subject-verb agreement error. Use plural verb form.",
    confidence: 0.95,
    autoFixable: true,
    suggest: (match, sub, verb) => `${sub} ${verb.toLowerCase() === 'is' ? 'are' : 'were'}`
  },
  {
    id: 'subject_verb_he_are',
    regex: /\b(he|she|it)\s+(are|were)\b/gi,
    category: 'grammar',
    severity: 'error',
    explanation: "Subject-verb agreement error. Use singular verb form.",
    confidence: 0.95,
    autoFixable: true,
    suggest: (match, sub, verb) => `${sub} ${verb.toLowerCase() === 'are' ? 'is' : 'was'}`
  },
  {
    id: 'i_has',
    regex: /\b(i)\s+(has)\b/gi,
    category: 'grammar',
    severity: 'error',
    explanation: "Subject-verb agreement error. 'I' takes 'have'.",
    confidence: 0.98,
    autoFixable: true,
    suggest: (match, i) => `${i} have`
  },
  {
    id: 'could_of',
    regex: /\b(could|should|would|must)\s+of\b/gi,
    category: 'grammar',
    severity: 'error',
    explanation: "Incorrect usage. Did you mean 'have'?",
    confidence: 0.98,
    autoFixable: true,
    suggest: (match, verb) => `${verb} have`
  },
  {
    id: 'their_there_going',
    regex: /\b(their)\s+(is|are|was|were|going|coming|having)\b/gi,
    category: 'grammar',
    severity: 'warning',
    explanation: "Did you mean 'there' or 'they're'?",
    confidence: 0.85,
    autoFixable: false,
    suggest: (match, wrong, rest) => `there ${rest}`
  },
  {
    id: 'its_a_possessive',
    regex: /\b(its)\s+(a|an|the|very|quite)\b/gi,
    category: 'grammar',
    severity: 'warning',
    explanation: "Did you mean 'it's' (contraction of 'it is')?",
    confidence: 0.88,
    autoFixable: true,
    suggest: (match, its, rest) => `it's ${rest}`
  },
  {
    id: 'space_before_comma_period',
    regex: /(\s+)([,.!?:;])/g,
    category: 'punctuation',
    severity: 'error',
    explanation: "Unexpected space before punctuation.",
    confidence: 0.98,
    autoFixable: true,
    suggest: (match, space, punc) => punc
  },
  {
    id: 'missing_space_after_punc',
    regex: /([,.!?:;])([a-zA-Z])/g,
    category: 'punctuation',
    severity: 'warning',
    explanation: "Missing space after punctuation mark.",
    confidence: 0.90,
    autoFixable: true,
    suggest: (match, punc, char) => `${punc} ${char}`
  },
  {
    id: 'repeated_punctuation',
    regex: /([!?]){2,}/g,
    category: 'punctuation',
    severity: 'suggestion',
    explanation: "Multiple consecutive punctuation marks. Consider using a single mark for formal writing.",
    confidence: 0.80,
    autoFixable: true,
    suggest: (match, punc) => punc
  }
];

// Concise & Style Rules
const wordinessRules = [
  { phrase: 'in order to', replacement: 'to', category: 'conciseness', explanation: "'in order to' is verbose. 'to' suffices." },
  { phrase: 'at this point in time', replacement: 'now', category: 'conciseness', explanation: "Use 'now' or 'currently' for brevity." },
  { phrase: 'due to the fact that', replacement: 'because', category: 'conciseness', explanation: "'due to the fact that' can be simplified to 'because'." },
  { phrase: 'for the purpose of', replacement: 'for', category: 'conciseness', explanation: "'for the purpose of' is wordy. Use 'for'." },
  { phrase: 'with regard to', replacement: 'regarding', category: 'conciseness', explanation: "'with regard to' can be simplified to 'regarding' or 'about'." },
  { phrase: 'in spite of the fact that', replacement: 'although', category: 'conciseness', explanation: "Simplify to 'although'." },
  { phrase: 'has the capability of', replacement: 'can', category: 'conciseness', explanation: "Simplify 'has the capability of' to 'can'." },
  { phrase: 'make a decision', replacement: 'decide', category: 'conciseness', explanation: "Use the verb 'decide' instead of 'make a decision'." },
  { phrase: 'reach a conclusion', replacement: 'conclude', category: 'conciseness', explanation: "Use the verb 'conclude'." },
  { phrase: 'basic fundamentals', replacement: 'fundamentals', category: 'conciseness', explanation: "'basic fundamentals' is redundant. Use 'fundamentals'." },
  { phrase: 'repeat again', replacement: 'repeat', category: 'conciseness', explanation: "'repeat again' is redundant. Use 'repeat'." },
  { phrase: 'revert back', replacement: 'revert', category: 'conciseness', explanation: "'revert back' is redundant. Use 'revert'." }
];

// Passive Voice Pattern
const passiveVoiceRegex = /\b(am|is|are|was|were|be|been|being)\s+([a-zA-Z]+ed|[a-zA-Z]+en)\s+by\b/gi;

/**
 * Main NLP Text Analyzer
 */
export function analyzeTextWithNLP(text, customDictionary = [], enabledCategories = null) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return {
      suggestions: [],
      score: 100,
      stats: { words: 0, characters: 0, sentences: 0, paragraphs: 0, readingTimeMinutes: 0 },
      tone: { primary: 'Neutral', confidence: 1.0, breakdown: { Neutral: 100 } }
    };
  }

  const userDict = new Set(customDictionary.map(w => w.toLowerCase()));
  const suggestions = [];
  let issueCounter = 1;

  // 1. Run Grammar & Punctuation Pattern Rules
  for (const rule of grammarRules) {
    if (enabledCategories && !enabledCategories.includes(rule.category)) continue;

    rule.regex.lastIndex = 0;
    let match;
    while ((match = rule.regex.exec(text)) !== null) {
      const originalText = match[0];
      const start = match.index;
      const end = start + originalText.length;
      
      const replacement = typeof rule.suggest === 'function' ? rule.suggest(...match) : rule.suggest;
      if (replacement === originalText) continue;

      suggestions.push({
        id: `issue_${issueCounter++}`,
        category: rule.category,
        severity: rule.severity,
        originalText,
        suggestedReplacement: replacement,
        startPosition: start,
        endPosition: end,
        explanation: rule.explanation,
        confidence: rule.confidence,
        ruleType: rule.id,
        autoFixable: rule.autoFixable
      });
    }
  }

  // 2. Run Conciseness & Wordiness Rules
  for (const rule of wordinessRules) {
    if (enabledCategories && !enabledCategories.includes(rule.category)) continue;

    const regex = new RegExp(`\\b${rule.phrase}\\b`, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      const originalText = match[0];
      const start = match.index;
      const end = start + originalText.length;

      // Preserve capitalization of first letter
      let replacement = rule.replacement;
      if (originalText[0] === originalText[0].toUpperCase()) {
        replacement = replacement.charAt(0).toUpperCase() + replacement.slice(1);
      }

      suggestions.push({
        id: `issue_${issueCounter++}`,
        category: rule.category,
        severity: 'suggestion',
        originalText,
        suggestedReplacement: replacement,
        startPosition: start,
        endPosition: end,
        explanation: rule.explanation,
        confidence: 0.88,
        ruleType: 'wordiness',
        autoFixable: true
      });
    }
  }

  // 3. Passive Voice Detection
  if (!enabledCategories || enabledCategories.includes('style') || enabledCategories.includes('clarity')) {
    passiveVoiceRegex.lastIndex = 0;
    let match;
    while ((match = passiveVoiceRegex.exec(text)) !== null) {
      const originalText = match[0];
      const start = match.index;
      const end = start + originalText.length;

      suggestions.push({
        id: `issue_${issueCounter++}`,
        category: 'clarity',
        severity: 'enhancement',
        originalText,
        suggestedReplacement: originalText, // Requires manual active rewrite
        startPosition: start,
        endPosition: end,
        explanation: 'Passive voice construction detected. Consider rewriting using active voice for greater impact.',
        confidence: 0.82,
        ruleType: 'passive_voice',
        autoFixable: false
      });
    }
  }

  // 4. Spelling Check (Word by Word)
  if (!enabledCategories || enabledCategories.includes('spelling')) {
    const wordRegex = /\b([a-zA-Z'\-]+)\b/g;
    let match;
    while ((match = wordRegex.exec(text)) !== null) {
      const word = match[1];
      const start = match.index;
      const end = start + word.length;
      const lower = word.toLowerCase();

      // Skip short words, numbers, proper nouns (if capitalized inside sentence), code, technical terms, URLs, dictionary words
      if (word.length <= 2) continue;
      if (userDict.has(lower)) continue;
      if (commonWords.has(lower)) continue;
      if (/^(http|https|www|api|id|json|html|css|javascript|react|node|sql|express)/i.test(word)) continue;
      
      // Check if word is capitalized and preceded by non-period (likely proper noun)
      const charBefore = text.slice(Math.max(0, start - 3), start).trim();
      const isStartOfSentence = start === 0 || /[.!?]\s*$/.test(charBefore);
      if (word[0] === word[0].toUpperCase() && !isStartOfSentence) {
        // High likelihood of proper noun, preserve unless in typo dictionary
        if (!typoDictionary[lower]) continue;
      }

      const suggestion = getSpellingSuggestion(word);
      if (suggestion && suggestion.toLowerCase() !== lower) {
        // Ensure suggestion doesn't overlap with existing grammar suggestion
        const overlap = suggestions.some(s => 
          (start >= s.startPosition && start < s.endPosition) ||
          (end > s.startPosition && end <= s.endPosition)
        );

        if (!overlap) {
          suggestions.push({
            id: `issue_${issueCounter++}`,
            category: 'spelling',
            severity: 'error',
            originalText: word,
            suggestedReplacement: suggestion,
            startPosition: start,
            endPosition: end,
            explanation: `Possible spelling error. Did you mean '${suggestion}'?`,
            confidence: typoDictionary[lower] ? 0.95 : 0.75,
            ruleType: 'spelling_check',
            autoFixable: true
          });
        }
      }
    }
  }

  // Sort suggestions by start position ascending
  suggestions.sort((a, b) => a.startPosition - b.startPosition);

  // Stats calculation
  const wordsArray = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = wordsArray.length;
  const charCount = text.length;
  const sentenceCount = (text.match(/[^.!?]+[.!?]+/g) || [text]).length;
  const paragraphCount = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length || 1;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // Tone detection
  const toneData = analyzeTone(text);

  return {
    suggestions,
    stats: {
      words: wordCount,
      characters: charCount,
      sentences: sentenceCount,
      paragraphs: paragraphCount,
      readingTimeMinutes
    },
    tone: toneData
  };
}

/**
 * Tone Detection Algorithm
 */
export function analyzeTone(text) {
  const lower = text.toLowerCase();
  
  const indicators = {
    Professional: ['hereby', 'regarding', 'please find', 'attached', 'sincerely', 'furthermore', 'accordingly', 'implement', 'strategy', 'process', 'objective'],
    Formal: ['furthermore', 'moreover', 'consequently', 'nonetheless', 'therefore', 'shall', 'whom', 'hence', 'thus'],
    Friendly: ['thanks', 'happy', 'great', 'awesome', 'excited', 'wonderfully', 'cheers', 'hope you', 'welcome', 'love', 'kindly'],
    Confident: ['definitely', 'certainly', 'undoubtedly', 'guarantee', 'proven', 'clearly', 'achieve', 'exceed', 'will deliver'],
    Academic: ['hypothesis', 'methodology', 'analysis', 'empirical', 'framework', 'literature', 'significant', 'demonstrates', 'correlation'],
    Persuasive: ['crucial', 'essential', 'must', 'transform', 'unlock', 'unmatched', 'immediately', 'opportunity', 'proven', 'boost'],
    Casual: ['hey', 'yeah', 'cool', 'stuff', 'gonna', 'wanna', 'kinda', 'btw', 'fyis'],
    Assertive: ['require', 'expect', 'must be', 'deadline', 'mandatory', 'non-negotiable', 'urgently']
  };

  const scores = {};
  let totalScore = 0;

  for (const [tone, words] of Object.entries(indicators)) {
    let count = 0;
    for (const w of words) {
      const regex = new RegExp(`\\b${w}\\b`, 'gi');
      const matches = lower.match(regex);
      if (matches) count += matches.length;
    }
    if (count > 0) {
      scores[tone] = count;
      totalScore += count;
    }
  }

  if (totalScore === 0) {
    return {
      primary: 'Neutral',
      confidence: 0.90,
      breakdown: { Neutral: 80, Professional: 20 }
    };
  }

  const breakdown = {};
  let maxTone = 'Neutral';
  let maxScore = 0;

  for (const [tone, score] of Object.entries(scores)) {
    const pct = Math.round((score / totalScore) * 100);
    breakdown[tone] = pct;
    if (score > maxScore) {
      maxScore = score;
      maxTone = tone;
    }
  }

  return {
    primary: maxTone,
    confidence: Math.min(0.95, 0.6 + (maxScore / totalScore) * 0.35),
    breakdown
  };
}
