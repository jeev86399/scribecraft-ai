/**
 * Semantic Interchangeability Analyzer (Family B)
 * Measures how easily the core topic could be swapped out without altering
 * the rhetorical structure of the paragraph. Generative AI often uses
 * highly interchangeable "Mad Libs" structures for broad topics.
 */

export function analyzeSemanticInterchangeability(preprocessed) {
  const { normalizedText, sentences, wordCount } = preprocessed;
  
  if (!normalizedText || wordCount < 20) {
    return {
      signalScore: 10,
      rating: 'Context-Dependent',
      explanation: 'Text too short to evaluate semantic interchangeability.'
    };
  }

  const lowerText = normalizedText.toLowerCase();

  // Interchangeability markers: verbs and phrases that apply to almost any subject
  const interchangeableMarkers = [
    /plays a (crucial|vital|key|essential) role/g,
    /is (rapidly|increasingly) transforming/g,
    /provides an opportunity to/g,
    /serves as a (vital|crucial|essential)/g,
    /catering to diverse/g,
    /making it (essential|crucial|important) to/g,
    /not only [\w\s]+ but also/g,
    /a variety of/g,
    /from [\w\s]+ to [\w\s]+/g,
    /ultimately/g,
    /fostering/g,
    /promoting (overall|general)/g,
    /enhancing/g,
    /streamlining/g
  ];

  let markerCount = 0;
  for (const regex of interchangeableMarkers) {
    const matches = lowerText.match(regex);
    if (matches) markerCount += matches.length;
  }

  const density = wordCount > 0 ? (markerCount / (wordCount / 100)) : 0;
  const sentenceRatio = sentences.length > 0 ? (markerCount / sentences.length) : 0;

  let signalScore = 10;
  if (density >= 3.5 || sentenceRatio >= 0.8) {
    signalScore = 95;
  } else if (density >= 2.0 || sentenceRatio >= 0.5) {
    signalScore = 75;
  } else if (density >= 1.0) {
    signalScore = 50;
  }

  let rating = 'Context-Dependent';
  if (signalScore >= 75) rating = 'Highly Interchangeable Structure';
  else if (signalScore >= 50) rating = 'Moderately Interchangeable';

  let explanation = 'Text relies on specific, non-interchangeable relationships.';
  if (signalScore >= 75) {
    explanation = `High semantic interchangeability detected (${density.toFixed(1)} broad markers/100w). The underlying rhetorical structure could apply to almost any topic.`;
  }

  return {
    density: Math.round(density * 10) / 10,
    sentenceRatio: Math.round(sentenceRatio * 100) / 100,
    signalScore,
    rating,
    explanation
  };
}
