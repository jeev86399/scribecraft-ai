/**
 * Repetition & Template Pattern Analyzer (Signal 4)
 * Detects repeated sentence openers, phrase templates, n-gram duplicates, and formulaic openings.
 */

export function analyzeRepetition(preprocessed) {
  const { sentences, bigrams, trigrams, cleanWords } = preprocessed;
  if (!sentences || sentences.length < 2) {
    return {
      sentenceOpenerRepetition: 0,
      trigramRepetitionCount: 0,
      detectedTemplates: [],
      signalScore: 15,
      rating: 'Low Repetition',
      explanation: 'Insufficient text to analyze structural repetition.'
    };
  }

  // 1. Sentence Openers Analysis (First 2 words of each sentence)
  const starters = sentences.map(s => {
    const w = s.trim().split(/\s+/).filter(Boolean);
    return w.length >= 2 ? `${w[0].toLowerCase()} ${w[1].toLowerCase()}` : (w[0] ? w[0].toLowerCase() : '');
  }).filter(Boolean);

  const starterCounts = {};
  let duplicateStarters = 0;
  for (const st of starters) {
    starterCounts[st] = (starterCounts[st] || 0) + 1;
    if (starterCounts[st] > 1) duplicateStarters++;
  }

  const openerRepetitionRatio = sentences.length > 0 ? (duplicateStarters / sentences.length) : 0;

  // 2. Trigram Duplication Count (excluding common function word trigrams)
  const trigramCounts = {};
  let duplicateTrigrams = 0;
  const repeatedTrigramsList = [];

  for (const tri of trigrams) {
    trigramCounts[tri] = (trigramCounts[tri] || 0) + 1;
    if (trigramCounts[tri] === 2) {
      duplicateTrigrams++;
      if (repeatedTrigramsList.length < 3) repeatedTrigramsList.push(tri);
    }
  }

  // 3. Score Calculation
  let signalScore = 15;
  if (openerRepetitionRatio > 0.40 || duplicateTrigrams >= 3) {
    signalScore = 80;
  } else if (openerRepetitionRatio > 0.25 || duplicateTrigrams >= 2) {
    signalScore = 60;
  } else if (openerRepetitionRatio > 0.15 || duplicateTrigrams >= 1) {
    signalScore = 40;
  }

  let rating = 'Low Repetition';
  if (signalScore >= 70) rating = 'High Template Repetition';
  else if (signalScore >= 45) rating = 'Moderate Repetition';

  const detectedTemplates = [];
  if (duplicateStarters > 0) {
    detectedTemplates.push(`${duplicateStarters} repeated sentence opening patterns`);
  }
  if (repeatedTrigramsList.length > 0) {
    detectedTemplates.push(`Repeated phrases: "${repeatedTrigramsList.join('", "')}"`);
  }

  let explanation = 'No abnormal phrase template repetition detected.';
  if (signalScore >= 60) {
    explanation = `Detected repeated structural openers (${Math.round(openerRepetitionRatio * 100)}% opener repetition) and formulaic phrase templates.`;
  }

  return {
    sentenceOpenerRepetition: Math.round(openerRepetitionRatio * 100) / 100,
    trigramRepetitionCount: duplicateTrigrams,
    detectedTemplates,
    signalScore,
    rating,
    explanation
  };
}
