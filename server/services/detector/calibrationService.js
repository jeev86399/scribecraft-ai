/**
 * Calibration & Ensemble Weighting Engine
 * Combines signals into a calibrated AI writing pattern probability estimate.
 * Applies text length confidence constraints and generates user-facing evidence bullet points.
 */

export function calibrateEnsemble(signals, wordCount, semanticAssessment = null) {
  if (wordCount < 30) {
    return {
      isTooShort: true,
      wordCount,
      message: 'Not enough text for a reliable estimate. Please provide at least 30 words.'
    };
  }

  const { sentence, burstiness, lexical, repetition, predictability, structure, stylometry } = signals;

  // Dynamic signal weight setup based on strong indicator presence
  let weights = {
    predictability: predictability.signalScore >= 75 ? 0.35 : 0.20,
    burstiness: 0.20,
    sentence: 0.15,
    repetition: 0.12,
    lexical: 0.10,
    structure: 0.08,
    semantic: 0.0
  };

  let totalWeight = weights.predictability + weights.burstiness + weights.sentence + weights.repetition + weights.lexical + weights.structure;

  let weightedSum = 
    (predictability.signalScore * weights.predictability) +
    (burstiness.signalScore * weights.burstiness) +
    (sentence.signalScore * weights.sentence) +
    (repetition.signalScore * weights.repetition) +
    (lexical.signalScore * weights.lexical) +
    (structure.signalScore * weights.structure);

  if (semanticAssessment && typeof semanticAssessment.aiPatternSignal === 'number') {
    weights.semantic = 0.25;
    totalWeight += 0.25;
    weightedSum += (semanticAssessment.aiPatternSignal * weights.semantic);
  }

  let rawScore = Math.round(weightedSum / totalWeight);

  // Calibrate & bound score
  const aiLikelihood = Math.max(5, Math.min(95, rawScore));
  const humanLikelihood = 100 - aiLikelihood;
  const aiAssistedLikelihood = aiLikelihood > 20 && aiLikelihood < 70 ? aiLikelihood : Math.round(aiLikelihood * 0.7);

  // Calibrated Classification Label
  let classificationLabel = 'Very Low AI-Pattern Signal';
  if (aiLikelihood >= 86) classificationLabel = 'Very High AI-Pattern Signal';
  else if (aiLikelihood >= 71) classificationLabel = 'High AI-Pattern Signal';
  else if (aiLikelihood >= 51) classificationLabel = 'Moderate AI-Pattern Signal';
  else if (aiLikelihood >= 31) classificationLabel = 'Mixed or Uncertain';
  else if (aiLikelihood >= 16) classificationLabel = 'Low AI-Pattern Signal';

  // Text Length Dependent Confidence Bounds
  let confidence = 'Low';
  if (wordCount >= 250) {
    const signalDiff = Math.abs(burstiness.signalScore - predictability.signalScore);
    confidence = signalDiff < 25 ? 'High' : 'Medium';
  } else if (wordCount >= 100) {
    confidence = 'Medium';
  }

  // Generate User-Facing Reasons based on computed signals
  const reasons = [];

  if (predictability.signalScore >= 50) {
    reasons.push(predictability.explanation);
  } else {
    reasons.push('Phrasing and transitions appear organic without overused clichés.');
  }

  if (burstiness.signalScore >= 60) {
    reasons.push(burstiness.explanation);
  } else {
    reasons.push('Sentence length and rhythm vary naturally across adjacent sentences.');
  }

  if (repetition.signalScore >= 50) {
    reasons.push(repetition.explanation);
  }

  if (structure.signalScore >= 60) {
    reasons.push(structure.explanation);
  }

  if (semanticAssessment && semanticAssessment.reasoningSummary) {
    reasons.unshift(semanticAssessment.reasoningSummary);
  }

  // Formatted Key Signals Array
  const keySignals = [
    {
      name: 'Sentence Variation',
      result: sentence.stdDev > 5.5 ? 'High Natural Variation' : 'Moderate Uniformity',
      level: sentence.signalScore > 50 ? 'Uniform' : 'Natural'
    },
    {
      name: 'Burstiness',
      result: burstiness.rating,
      level: burstiness.signalScore > 50 ? 'Low Variation' : 'High Variation'
    },
    {
      name: 'Vocabulary Diversity',
      result: lexical.rating,
      level: lexical.mattr > 0.75 ? 'High Diversity' : 'Controlled'
    },
    {
      name: 'Phrase Predictability',
      result: predictability.rating,
      level: predictability.signalScore > 50 ? 'Formulaic' : 'Natural'
    },
    {
      name: 'Structural Uniformity',
      result: structure.rating,
      level: structure.signalScore > 50 ? 'Symmetrical' : 'Varied'
    },
    {
      name: 'Repetition',
      result: repetition.rating,
      level: repetition.signalScore > 50 ? 'Repeated Openers' : 'Low Repetition'
    }
  ];

  return {
    isTooShort: false,
    wordCount,
    aiLikelihood,
    humanLikelihood,
    aiAssistedLikelihood,
    classificationLabel,
    confidence,
    reasons,
    keySignals,
    disclaimer: 'This is a statistical estimate of writing patterns. It cannot prove whether a person or AI wrote the text and should not be used as the sole basis for high-stakes academic, employment, or disciplinary decisions.',
    timestamp: new Date().toISOString()
  };
}
