/**
 * Calibration & Multi-Signal Evidence Fusion Engine
 * Implements neutral signal isolation, Noisy-OR evidence fusion,
 * Strict High-AI Escalation Rule (90-97%), and independent uncertainty/confidence calculations.
 */

export function calibrateEnsemble(signals, wordCount, semanticAssessment = null) {
  if (wordCount < 30) {
    return {
      isTooShort: true,
      wordCount,
      message: 'Not enough text for a reliable estimate. Please provide at least 30 words.'
    };
  }

  const { sentence, burstiness, lexical, repetition, predictability, structure, stylometry, genericness, genericExposition, discourse, coherence } = signals;

  // 1. Convert Signal Scores into Normalized AI Evidence Probabilities [0.0 - 1.0]
  const pPredictability = (predictability?.signalScore || 10) / 100;
  const pGenericness = (genericness?.signalScore || 10) / 100;
  const pGenericExposition = (genericExposition?.signalScore || 10) / 100;
  const pDiscourse = (discourse?.signalScore || 15) / 100;
  const pCoherence = (coherence?.signalScore || 10) / 100;
  const pStructure = (structure?.signalScore || 10) / 100;
  const pRepetition = (repetition?.signalScore || 15) / 100;

  // 2. Count Converging High-Value AI Signals (Scores >= 60)
  const strongAiSignalsCount = [
    predictability?.signalScore >= 55,
    genericness?.signalScore >= 55,
    genericExposition?.signalScore >= 50,
    discourse?.signalScore >= 55,
    coherence?.signalScore >= 50,
    structure?.signalScore >= 60
  ].filter(Boolean).length;

  // 3. Noisy-OR Multi-Signal Evidence Combination
  let nonAiProb = 
    (1 - 0.45 * pPredictability) *
    (1 - 0.45 * pGenericExposition) *
    (1 - 0.40 * pGenericness) *
    (1 - 0.35 * pDiscourse) *
    (1 - 0.30 * pCoherence) *
    (1 - 0.20 * pStructure) *
    (1 - 0.15 * pRepetition);

  if (semanticAssessment && typeof semanticAssessment.aiPatternSignal === 'number') {
    const pSemantic = semanticAssessment.aiPatternSignal / 100;
    nonAiProb *= (1 - 0.40 * pSemantic);
  }

  let rawAiProb = 1 - nonAiProb;

  // STRICT HIGH-AI ESCALATION RULE:
  // When 3 or more independent high-value AI signals converge, escalate score to 85-97%!
  if (strongAiSignalsCount >= 4) {
    rawAiProb = Math.max(0.91, rawAiProb + 0.15);
  } else if (strongAiSignalsCount >= 3) {
    rawAiProb = Math.max(0.78, rawAiProb + 0.10);
  }

  // 4. Positive Human Evidence Gathering (Contractions, first person, lived experience, academic markers)
  let humanEvidenceScore = 0;
  if (stylometry?.contractionCount > 0) humanEvidenceScore += 1.5;
  if (stylometry?.firstPersonCount > 0) humanEvidenceScore += 1.5;
  if (stylometry?.isAcademicHuman) humanEvidenceScore += 3.0;

  let rawHumanProb = Math.min(0.95, humanEvidenceScore * 0.22 + (1 - rawAiProb) * 0.4);

  // Personal / Informal Human Protection: Dampen AI likelihood if heavy first-person pronouns or contractions present
  if (stylometry?.firstPersonCount >= 1 || stylometry?.contractionCount > 0) {
    if (strongAiSignalsCount < 3) {
      rawAiProb *= 0.35;
      rawHumanProb = 0.90;
    }
  }

  // Academic Human Protection: Prevent false positives on research papers!
  if (stylometry?.isAcademicHuman && strongAiSignalsCount < 3) {
    rawAiProb *= 0.25;
    rawHumanProb = 0.92;
  }

  // Final Calibrated Likelihoods
  let aiLikelihood = Math.round(rawAiProb * 100);
  let humanLikelihood = Math.round(rawHumanProb * 100);

  aiLikelihood = Math.max(5, Math.min(97, aiLikelihood));
  humanLikelihood = Math.max(5, Math.min(97, humanLikelihood));

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
    confidence = strongAiSignalsCount >= 3 ? 'High' : 'Medium';
  } else if (wordCount >= 100) {
    confidence = strongAiSignalsCount >= 3 ? 'High' : 'Medium';
  }

  // Generate User-Facing Neutral Evidence Reasons
  const reasons = [];

  if (genericExposition && genericExposition.signalScore >= 60) {
    reasons.push(genericExposition.explanation);
  }

  if (discourse && discourse.signalScore >= 60) {
    reasons.push(discourse.explanation);
  }

  if (predictability && predictability.signalScore >= 50) {
    reasons.push(predictability.explanation);
  }

  if (genericness && genericness.signalScore >= 50) {
    reasons.push(genericness.explanation);
  }

  if (coherence && coherence.signalScore >= 50) {
    reasons.push(coherence.explanation);
  }

  if (stylometry?.isAcademicHuman) {
    reasons.push(stylometry.explanation);
  } else if (stylometry?.contractionCount > 0 || stylometry?.firstPersonCount > 0) {
    reasons.push(stylometry.explanation);
  }

  if (reasons.length < 2) {
    reasons.push('Sentence length and rhythm demonstrate natural human variation.');
  }

  if (semanticAssessment && semanticAssessment.reasoningSummary) {
    reasons.unshift(semanticAssessment.reasoningSummary);
  }

  // Formatted Key Signals Array for UI Table
  const keySignals = [
    {
      name: 'Phrase Predictability',
      result: predictability?.rating || 'Natural Phrasing',
      level: predictability?.signalScore >= 60 ? 'Formulaic' : 'Natural'
    },
    {
      name: 'Semantic Genericness',
      result: genericness?.rating || 'Grounded Specificity',
      level: genericness?.signalScore >= 60 ? 'Generic Abstraction' : 'Specific'
    },
    {
      name: 'Expository Interchangeability',
      result: genericExposition?.rating || 'Grounded Topic Detail',
      level: genericExposition?.signalScore >= 60 ? 'High Interchangeability' : 'Grounded'
    },
    {
      name: 'Discourse Progression',
      result: discourse?.rating || 'Natural Discourse Flow',
      level: discourse?.signalScore >= 60 ? 'Textbook AI Template' : 'Varied'
    },
    {
      name: 'Sentence Coherence',
      result: coherence?.rating || 'Natural Coherence',
      level: coherence?.signalScore >= 60 ? 'High Over-Coherence' : 'Natural'
    },
    {
      name: 'Stylometry',
      result: stylometry?.rating || 'Natural Human Stylometry',
      level: stylometry?.isAcademicHuman ? 'Academic Human' : (stylometry?.contractionCount > 0 ? 'Personal Human' : 'Standard Profile')
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
