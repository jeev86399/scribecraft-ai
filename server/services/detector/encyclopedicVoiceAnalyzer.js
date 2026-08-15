/**
 * Encyclopedic Voice Analyzer (Domain-Independent)
 * Detects an anonymous educational voice, broad factual explanations,
 * and lack of author ownership/idiosyncrasy.
 */

export function analyzeEncyclopedicVoice(preprocessed) {
  const { normalizedText, wordCount } = preprocessed;
  if (!normalizedText || wordCount < 15) {
    return {
      encyclopedicScore: 10,
      signalScore: 10,
      rating: 'Personal/Idiosyncratic',
      explanation: 'Insufficient text to analyze encyclopedic voice.'
    };
  }

  const lowerText = normalizedText.toLowerCase();

  // Markers of encyclopedic / textbook tone
  const markers = [
    /\b(is considered|are considered|is widely|are widely|is generally|are generally)\b/g,
    /\b(often includes|typically involves|generally consists of)\b/g,
    /\b(serves as|acts as|functions as)\b/g,
    /\b(can be defined as|refers to)\b/g,
    /\b(it is important to|it is essential to|making it essential to)\b/g,
    /\b(a variety of|a range of|diverse)\b/g,
    /\b(not only [\w\s]+ but also)\b/g,
    /\b(can significantly|may significantly)\b/g
  ];

  let markerCount = 0;
  for (const regex of markers) {
    const matches = lowerText.match(regex);
    if (matches) {
      markerCount += matches.length;
    }
  }

  // A high marker count relative to length indicates strong textbook/encyclopedic voice
  const density = wordCount > 0 ? (markerCount / (wordCount / 100)) : 0;

  let signalScore = 10;
  if (density >= 2.5) {
    signalScore = 90;
  } else if (density >= 1.5) {
    signalScore = 75;
  } else if (density >= 0.8) {
    signalScore = 50;
  }

  let rating = 'Personal/Idiosyncratic';
  if (signalScore >= 75) rating = 'High Encyclopedic Voice';
  else if (signalScore >= 50) rating = 'Moderate Informational Tone';

  let explanation = 'Text does not strongly exhibit an anonymous encyclopedic voice.';
  if (signalScore >= 75) {
    explanation = `High encyclopedic voice detected (${density.toFixed(1)} markers/100w). The text exhibits anonymous educational tone and broad generalized claims.`;
  }

  return {
    density: Math.round(density * 10) / 10,
    markerCount,
    signalScore,
    rating,
    explanation
  };
}
