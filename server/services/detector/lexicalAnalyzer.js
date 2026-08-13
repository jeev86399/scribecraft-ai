/**
 * Lexical Diversity & Vocabulary Distribution Analyzer (Signal 3)
 * Calculates Type-Token Ratio (TTR), Moving-Average TTR (MATTR), and lexical density.
 */

export function analyzeLexicalDiversity(preprocessed) {
  const { cleanWords, functionWords, wordCount } = preprocessed;
  if (!cleanWords || wordCount < 10) {
    return {
      ttr: 0,
      mattr: 0,
      lexicalDensity: 0,
      signalScore: 30,
      rating: 'Moderate',
      explanation: 'Insufficient vocabulary sample for lexical diversity analysis.'
    };
  }

  // 1. Overall Type-Token Ratio (TTR)
  const uniqueCount = new Set(cleanWords).size;
  const rawTtr = uniqueCount / wordCount;

  // 2. Moving-Average Type-Token Ratio (MATTR 50-word window)
  const windowSize = Math.min(50, wordCount);
  let mattrSum = 0;
  let windowsCount = 0;

  for (let i = 0; i <= cleanWords.length - windowSize; i++) {
    const window = cleanWords.slice(i, i + windowSize);
    const windowUnique = new Set(window).size;
    mattrSum += (windowUnique / windowSize);
    windowsCount++;
  }

  const mattr = windowsCount > 0 ? (mattrSum / windowsCount) : rawTtr;

  // 3. Lexical Density (Ratio of content words to total words)
  const contentWordsCount = wordCount - functionWords.length;
  const lexicalDensity = wordCount > 0 ? (contentWordsCount / wordCount) : 0;

  // AI-generated text often exhibits a controlled MATTR (0.65 - 0.78) and predictable lexical density
  let signalScore = 30;
  if (mattr >= 0.68 && mattr <= 0.76 && lexicalDensity >= 0.45 && lexicalDensity <= 0.60) {
    signalScore = 65; // Highly controlled lexical density
  } else if (mattr < 0.55) {
    signalScore = 55; // Repetitive vocabulary
  } else if (mattr > 0.82) {
    signalScore = 20; // High organic variety
  }

  let rating = 'Organic Diversity';
  if (signalScore >= 60) rating = 'Controlled Density';
  else if (mattr < 0.55) rating = 'High Repetition';

  let explanation = `Lexical diversity is organic (MATTR = ${mattr.toFixed(2)}, TTR = ${rawTtr.toFixed(2)}).`;
  if (signalScore >= 60) {
    explanation = `Vocabulary displays controlled lexical density (MATTR = ${mattr.toFixed(2)}), typical of structured LLM outputs.`;
  }

  return {
    ttr: Math.round(rawTtr * 100) / 100,
    mattr: Math.round(mattr * 100) / 100,
    lexicalDensity: Math.round(lexicalDensity * 100) / 100,
    uniqueWords: uniqueCount,
    totalWords: wordCount,
    signalScore,
    rating,
    explanation
  };
}
