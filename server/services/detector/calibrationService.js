/**
 * Calibration & Multi-Signal Evidence Fusion Engine
 * Implements non-linear evidence aggregation (Noisy-OR combination),
 * uncertainty calculation, text length confidence bounds, and evidence bullet formatting.
 */

export function calibrateEnsemble(signals, wordCount, semanticAssessment = null) {
  if (wordCount < 30) {
    return {
      isTooShort: true,
      wordCount,
      message: 'Not enough text for a reliable estimate. Please provide at least 30 words.'
    };
  }

  const { sentence, burstiness, lexical, repetition, predictability, structure, stylometry, genericness } = signals;

  // 1. Convert Signal Scores into Evidence Probabilities [0.0 - 1.0]
  const pPredictability = (predictability?.signalScore || 10) / 100;
  const pGenericness = (genericness?.signalScore || 10) / 100;
  const pStructure = (structure?.signalScore || 10) / 100;
  const pRepetition = (repetition?.signalScore || 15) / 100;
  const pSentence = (sentence?.signalScore || 15) / 100;
  const pStylometry = (stylometry?.signalScore || 25) / 100;

  // 2. Non-Linear Noisy-OR Evidence Fusion for AI Probability
  // P(AI) = 1 - (1 - w1*s1) * (1 - w2*s2) ...
  let nonAiProb = 
    (1 - 0.50 * pPredictability) *
    (1 - 0.45 * pGenericness) *
    (1 - 0.30 * pStructure) *
    (1 - 0.25 * pRepetition) *
    (1 - 0.25 * pSentence) *
    (1 - 0.20 * pStylometry);

  if (semanticAssessment && typeof semanticAssessment.aiPatternSignal === 'number') {
    const pSemantic = semanticAssessment.aiPatternSignal / 100;
    nonAiProb *= (1 - 0.40 * pSemantic);
  }

  let rawAiProb = 1 - nonAiProb;

  // 3. Human Evidence Gathering (Contractions, first person, high burstiness, academic markers)
  let humanEvidenceCount = 0;
  if (stylometry.contractionCount > 0) humanEvidenceCount += 1.5;
  if (stylometry.firstPersonCount > 0) humanEvidenceCount += 1.5;
  if (burstiness.adjacentDeltaMean > 6.0) humanEvidenceCount += 1.0;
  if (stylometry.isAcademicHuman) humanEvidenceCount += 2.5;

  let rawHumanProb = Math.min(0.95, humanEvidenceCount * 0.22 + (1 - rawAiProb) * 0.4);

  // Informal Human Protection: Dampen AI likelihood if heavy first-person pronouns and contractions present
  if (stylometry.firstPersonCount >= 2 || (stylometry.contractionCount > 0 && stylometry.firstPersonCount > 0)) {
    if (pPredictability < 0.70) {
      rawAiProb *= 0.45;
      rawHumanProb = 0.90;
    }
  }

  // Academic Human Protection: Dampen AI likelihood if academic markers present
  if (stylometry.isAcademicHuman && pPredictability < 0.70) {
    rawAiProb *= 0.30;
    rawHumanProb = 0.90;
  }

  // Final Calibrated Percentages
  let aiLikelihood = Math.round(rawAiProb * 100);
  let humanLikelihood = Math.round(rawHumanProb * 100);

  // Saturation & Bounds
  aiLikelihood = Math.max(5, Math.min(96, aiLikelihood));
  humanLikelihood = Math.max(5, Math.min(96, humanLikelihood));

  // Explicit Uncertainty Calculation
  const certaintyDelta = Math.abs(aiLikelihood - humanLikelihood);
  let uncertainty = 'Low';
  if (certaintyDelta < 20) uncertainty = 'High';
  else if (certaintyDelta < 40) uncertainty = 'Moderate';

  // Calibrated Classification Label
  let classificationLabel = 'Very Low AI-Pattern Signal';
  if (aiLikelihood >= 85) classificationLabel = 'Very High AI-Pattern Signal';
  else if (aiLikelihood >= 70) classificationLabel = 'High AI-Pattern Signal';
  else if (aiLikelihood >= 50) classificationLabel = 'Moderate AI-Pattern Signal';
  else if (aiLikelihood >= 35) classificationLabel = 'Mixed or Uncertain';
  else if (aiLikelihood >= 16) classificationLabel = 'Low AI-Pattern Signal';

  // Text Length Dependent Confidence Bounds
  let confidence = 'Low';
  if (wordCount >= 250) {
    confidence = (predictability.signalScore >= 60 && genericness.signalScore >= 50) ? 'High' : 'Medium';
  } else if (wordCount >= 100) {
    confidence = 'Medium';
  }

  // Generate Neutral User-Facing Evidence Reasons
  const reasons = [];

  if (predictability.signalScore >= 50) {
    reasons.push(predictability.explanation);
  }

  if (genericness && genericness.signalScore >= 50) {
    reasons.push(genericness.explanation);
  }

  if (structure.signalScore >= 60) {
    reasons.push(structure.explanation);
  }

  if (stylometry.isAcademicHuman) {
    reasons.push(stylometry.explanation);
  } else if (stylometry.contractionCount > 0 || stylometry.firstPersonCount > 0) {
    reasons.push(stylometry.explanation);
  }

  if (burstiness.signalScore >= 60) {
    reasons.push(burstiness.explanation);
  } else if (reasons.length < 2) {
    reasons.push('Sentence length and rhythm vary naturally across adjacent sentences.');
  }

  if (semanticAssessment && semanticAssessment.reasoningSummary) {
    reasons.unshift(semanticAssessment.reasoningSummary);
  }

  // Formatted Key Signals Array
  const keySignals = [
    {
      name: 'Phrase Predictability',
      result: predictability.rating,
      level: predictability.signalScore >= 60 ? 'Formulaic' : 'Natural'
    },
    {
      name: 'Semantic Genericness',
      result: genericness ? genericness.rating : 'Specific Details',
      level: genericness && genericness.signalScore >= 60 ? 'Generic Abstraction' : 'Specific'
    },
    {
      name: 'Structural Regularity',
      result: structure.rating,
      level: structure.signalScore >= 60 ? 'Symmetrical' : 'Varied'
    },
    {
      name: 'Sentence Rhythm',
      result: burstiness.rating,
      level: burstiness.signalScore >= 60 ? 'Low Variation' : 'High Variation'
    },
    {
      name: 'Lexical Pattern',
      result: lexical.rating,
      level: lexical.mattr > 0.75 ? 'Diverse' : 'Controlled'
    },
    {
      name: 'Stylometry',
      result: stylometry.rating,
      level: stylometry.isAcademicHuman ? 'Academic Human' : (stylometry.contractionCount > 0 ? 'Personal Human' : 'Standard Profile')
    }
  ];

  return {
    isTooShort: false,
    wordCount,
    aiLikelihood,
    humanLikelihood,
    uncertainty,
    classificationLabel,
    confidence,
    reasons,
    keySignals,
    disclaimer: 'This is a statistical estimate of writing patterns. It cannot prove whether a person or AI wrote the text and should not be used as the sole basis for high-stakes academic, employment, or disciplinary decisions.',
    timestamp: new Date().toISOString()
  };
}
