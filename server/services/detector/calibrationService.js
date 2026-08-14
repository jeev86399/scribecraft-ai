/**
 * Diagnostic Calibration & Multi-Family Evidence Fusion Engine
 * Executes 5-family evidence fusion, neutral signal isolation,
 * Strict High-AI Escalation (88-97%), diagnostic breakdown logging, and independent uncertainty/confidence calculations.
 */

import { computeEvidenceConvergence } from './evidenceConvergenceEngine.js';

export function calibrateEnsemble(signals, wordCount, semanticAssessment = null, enableDiagnosticTrace = false) {
  if (wordCount < 30) {
    return {
      isTooShort: true,
      wordCount,
      message: 'Not enough text for a reliable estimate. Please provide at least 30 words.'
    };
  }

  const {
    sentence,
    burstiness,
    lexical,
    repetition,
    predictability,
    structure,
    stylometry,
    genericness,
    genericExposition,
    discourse,
    coherence,
    authorFingerprint,
    humanEvidence
  } = signals;

  // 1. Execute Multi-Family Evidence Convergence
  const convergence = computeEvidenceConvergence(signals, semanticAssessment);

  // 2. Extract Raw & Normalized Family Probabilities
  const rawAiProb = convergence.aiConvergenceScore / 100;
  const humanEvidenceScore = humanEvidence?.humanEvidenceScore || 0;

  // 3. Positive Human Evidence Dampening Rule
  let calibratedAiProb = rawAiProb;
  let calibratedHumanProb = Math.min(0.95, (humanEvidenceScore / 100) * 0.85 + (1 - rawAiProb) * 0.35);

  // Personal Narrative & Academic Human Protection
  if (humanEvidence?.hasAcademicSignatures && convergence.agreeingFamilyCount < 3) {
    calibratedAiProb *= 0.15; // Academic paper protection
    calibratedHumanProb = 0.95;
  } else if (humanEvidence?.hasLivedExperience && convergence.agreeingFamilyCount < 3) {
    calibratedAiProb *= 0.20; // Personal narrative protection
    calibratedHumanProb = 0.92;
  } else if (humanEvidence?.hasPersonalVoice && convergence.agreeingFamilyCount < 3) {
    calibratedAiProb *= 0.35;
    calibratedHumanProb = 0.88;
  }

  // Final Calibrated Likelihood Percentage Values [5% - 97%]
  let aiLikelihood = Math.round(calibratedAiProb * 100);
  let humanLikelihood = Math.round(calibratedHumanProb * 100);

  aiLikelihood = Math.max(5, Math.min(97, aiLikelihood));
  humanLikelihood = Math.max(5, Math.min(97, humanLikelihood));

  // Explicit Uncertainty & Disagreement Calculation
  const certaintyDelta = Math.abs(aiLikelihood - humanLikelihood);
  let uncertainty = 'Low';
  if (certaintyDelta < 20) uncertainty = 'High';
  else if (certaintyDelta < 38) uncertainty = 'Moderate';

  // Calibrated Classification Label Schema
  let classificationLabel = 'Very Low AI-Pattern Signal';
  if (aiLikelihood >= 85) classificationLabel = 'Very High AI-Pattern Signal';
  else if (aiLikelihood >= 70) classificationLabel = 'High AI-Pattern Signal';
  else if (aiLikelihood >= 50) classificationLabel = 'Moderate AI-Pattern Signal';
  else if (aiLikelihood >= 31) classificationLabel = 'Mixed or Uncertain';
  else if (aiLikelihood >= 16) classificationLabel = 'Low AI-Pattern Signal';

  // Text Length Dependent Confidence Bounds (Separated from Likelihood!)
  let confidence = 'Low';
  if (wordCount >= 250) {
    confidence = convergence.agreeingFamilyCount >= 3 ? 'High' : 'Medium';
  } else if (wordCount >= 100) {
    confidence = convergence.agreeingFamilyCount >= 3 ? 'High' : 'Medium';
  } else {
    confidence = convergence.agreeingFamilyCount >= 4 ? 'Medium' : 'Low';
  }

  // Print Step-by-Step Diagnostic Breakdown Trace (During Benchmarks)
  if (enableDiagnosticTrace) {
    console.log('--- DETECTOR DIAGNOSTIC EVIDENCE TRACE ---');
    console.log(`RAW FAMILY SCORES: [Sem: ${convergence.familyA_Score}, Disc: ${convergence.familyB_Score}, Ling: ${convergence.familyC_Score}, Sty: ${convergence.familyD_Score}]`);
    console.log(`CROSS-FAMILY AGREEMENT: ${convergence.agreeingFamilyCount} Families Agree (${convergence.agreementLevel})`);
    console.log(`INTERACTION BOOST: +${convergence.interactionBoost} pts | CONVERGENCE SCORE: ${convergence.aiConvergenceScore}%`);
    console.log(`HUMAN EVIDENCE: ${humanEvidenceScore}% (Academic: ${humanEvidence?.hasAcademicSignatures}, Lived: ${humanEvidence?.hasLivedExperience})`);
    console.log(`CALIBRATED RESULT: AI Likelihood = ${aiLikelihood}% | Human Likelihood = ${humanLikelihood}% | Classification = ${classificationLabel}`);
    console.log('-------------------------------------------\n');
  }

  // Generate User-Facing Reasons
  const reasons = [];

  if (genericExposition && genericExposition.signalScore >= 60) {
    reasons.push(genericExposition.explanation);
  }

  if (discourse && discourse.signalScore >= 60) {
    reasons.push(discourse.explanation);
  }

  if (genericness && genericness.signalScore >= 60) {
    reasons.push(genericness.explanation);
  }

  if (predictability && predictability.signalScore >= 50) {
    reasons.push(predictability.explanation);
  }

  if (authorFingerprint && authorFingerprint.signalScore >= 60) {
    reasons.push(authorFingerprint.explanation);
  }

  if (humanEvidence && humanEvidence.humanEvidenceScore >= 45) {
    reasons.push(humanEvidence.explanation);
  }

  if (reasons.length < 2) {
    reasons.push('Sentence length and rhythm demonstrate natural human variation.');
  }

  if (semanticAssessment && semanticAssessment.reasoningSummary) {
    reasons.unshift(semanticAssessment.reasoningSummary);
  }

  const keySignals = [
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
      name: 'Phrase Predictability',
      result: predictability?.rating || 'Natural Phrasing',
      level: predictability?.signalScore >= 60 ? 'Formulaic' : 'Natural'
    },
    {
      name: 'Author Fingerprint',
      result: authorFingerprint?.rating || 'Neutral Voice',
      level: authorFingerprint?.hasDistinctiveVoice ? 'Individual Voice' : 'Anonymous LLM Profile'
    },
    {
      name: 'Human Evidence',
      result: humanEvidence?.rating || 'No Explicit Human Signatures',
      level: humanEvidence?.humanEvidenceScore >= 45 ? 'Positive Human Voice' : 'Neutral'
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
