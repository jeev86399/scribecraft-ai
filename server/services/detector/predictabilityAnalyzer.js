/**
 * Phrase Predictability & Transition Regularity Analyzer (Signals 5 & 8)
 * Scans for formulaic clichés, overused LLM transition markers, and predictable connective placement.
 */

const FORMULAIC_AI_PHRASES = [
  'in today\'s rapidly evolving',
  'in today\'s digital landscape',
  'plays a crucial role',
  'play a crucial role',
  'it is important to note',
  'it is important to consider',
  'it should be noted that',
  'by leveraging the power',
  'serves as a testament to',
  'rich tapestry of',
  'fosters a culture of',
  'delve into the',
  'in summary, it is clear',
  'unlock the full potential',
  'seamlessly integrate',
  'paradigm shift',
  'beacon of hope',
  'the rapid advancement of',
  'in an increasingly interconnected'
];

const CONNECTIVE_TRANSITIONS = [
  'however', 'moreover', 'furthermore', 'additionally', 'consequently',
  'therefore', 'in conclusion', 'nonetheless', 'accordingly', 'overall',
  'firstly', 'secondly', 'thirdly', 'finally'
];

export function analyzePredictability(preprocessed) {
  const { normalizedText, sentences, wordCount } = preprocessed;
  if (!normalizedText || wordCount < 15) {
    return {
      formulaicPhraseCount: 0,
      transitionDensity: 0,
      detectedPhrases: [],
      signalScore: 10,
      rating: 'Natural Phrasing',
      explanation: 'Insufficient text to analyze phrase predictability.'
    };
  }

  const lowerText = normalizedText.toLowerCase();

  // 1. Scan for Formulaic AI Phrases
  const detectedPhrases = [];
  let formulaicCount = 0;

  for (const phrase of FORMULAIC_AI_PHRASES) {
    const regex = new RegExp(`\\b${phrase.replace(/'/g, "\\'")}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      formulaicCount += matches.length;
      if (!detectedPhrases.includes(phrase)) {
        detectedPhrases.push(phrase);
      }
    }
  }

  // 2. Transition Placement & Density Analysis
  let transitionCount = 0;
  let sentenceOpenerTransitions = 0;

  for (const s of sentences) {
    const firstWord = s.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '');
    if (CONNECTIVE_TRANSITIONS.includes(firstWord)) {
      transitionCount++;
      sentenceOpenerTransitions++;
    }
  }

  const transitionDensityPer100 = wordCount > 0 ? (transitionCount / (wordCount / 100)) : 0;

  // 3. Score Aggregation (High predictability for heavy AI formulaic usage)
  let signalScore = 10;

  if (formulaicCount >= 3 || (sentenceOpenerTransitions >= 2 && formulaicCount >= 2)) {
    signalScore = 95;
  } else if (formulaicCount >= 2 || (sentenceOpenerTransitions >= 2 && formulaicCount >= 1)) {
    signalScore = 80;
  } else if (formulaicCount === 1 || sentenceOpenerTransitions >= 2) {
    signalScore = 60;
  } else if (transitionCount >= 2) {
    signalScore = 35;
  }

  let rating = 'Natural Phrasing';
  if (signalScore >= 75) rating = 'High Predictable Phrasing';
  else if (signalScore >= 50) rating = 'Moderate Predictability';

  let explanation = 'Transitions and phrasing appear organic and natural.';
  if (formulaicCount > 0) {
    explanation = `Contains ${formulaicCount} formulaic expressions (${detectedPhrases.slice(0, 3).map(p => `"${p}"`).join(', ')}) typical of AI output.`;
  } else if (sentenceOpenerTransitions >= 2) {
    explanation = `Features ${sentenceOpenerTransitions} sentence-initial transition markers (${transitionDensityPer100.toFixed(1)} per 100 words).`;
  }

  return {
    formulaicPhraseCount: formulaicCount,
    transitionDensity: Math.round(transitionDensityPer100 * 10) / 10,
    sentenceOpenerTransitions,
    detectedPhrases,
    signalScore,
    rating,
    explanation
  };
}
