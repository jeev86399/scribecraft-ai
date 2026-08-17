/**
 * Multi-Family AI Evidence Convergence Engine (V2.0)
 * 
 * Orchestrates independent evidence families, dynamically calculates weights based on 
 * availability, and resolves cross-family disagreement to produce calibrated probabilities.
 */

import { calibrateProbability } from './calibrationService.js';

export function computeEvidenceConvergence(families) {
  const {
    familyA_Predictability,
    familyB_Burstiness,
    familyC_TokenDist,
    familyD_ML,
    familyE_Semantic,
    familyG_Integrity
  } = families;

  const activeFamilies = [];
  const unavailableFamilies = [];
  let evidenceCoverage = 0;
  
  // 1. Gather Available Families and Assign Base Weights
  if (familyA_Predictability?.available) {
    activeFamilies.push({ id: 'A', name: 'Predictability', score: familyA_Predictability.clicheScore, weight: 0.25 });
    evidenceCoverage += 20;
  } else {
    unavailableFamilies.push('Family A (Predictability)');
  }

  if (familyB_Burstiness?.available) {
    activeFamilies.push({ id: 'B', name: 'Burstiness', score: familyB_Burstiness.signalScore, weight: 0.20 });
    evidenceCoverage += 20;
  } else {
    unavailableFamilies.push('Family B (Burstiness)');
  }

  if (familyC_TokenDist?.available) {
    activeFamilies.push({ id: 'C', name: 'Token Distribution', score: familyC_TokenDist.score, weight: 0.15 });
    evidenceCoverage += 15;
  } else {
    unavailableFamilies.push('Family C (Token Distribution)');
  }

  if (familyD_ML?.available && familyD_ML.results) {
    // Average the available ML models if calibrated
    let mlTotal = 0;
    let mlCount = 0;
    for (const [modelName, data] of Object.entries(familyD_ML.results)) {
       if (data.modelAvailable) {
           mlTotal += data.probability;
           mlCount++;
       }
    }
    const mlScore = mlCount > 0 ? (mlTotal / mlCount) : 0; 

    if (mlCount > 0) {
        activeFamilies.push({ id: 'D', name: 'ML Classification', score: mlScore, weight: 0.35 });
        evidenceCoverage += 35;
    } else {
        unavailableFamilies.push('Family D (ML Classification)');
    }
  } else {
    unavailableFamilies.push('Family D (ML Classification)');
  }

  if (familyE_Semantic?.available) {
    activeFamilies.push({ id: 'E', name: 'Semantic Assessment', score: familyE_Semantic.aiPatternSignal, weight: 0.15 });
    evidenceCoverage += 10;
  } else {
    unavailableFamilies.push('Family E (Semantic Assessment)');
  }

  // 2. Dynamic Weight Renormalization
  let totalWeight = activeFamilies.reduce((sum, f) => sum + f.weight, 0);
  
  if (totalWeight === 0) {
      return {
          aiLikelihood: 0,
          confidence: 0,
          reliability: 'low',
          evidenceCoverage: 0,
          classification: 'insufficient_evidence',
          agreementLevel: 'none',
          activeFamilies: [],
          unavailableFamilies
      };
  }

  // Renormalize weights so they sum to 1.0
  activeFamilies.forEach(f => {
      f.normalizedWeight = f.weight / totalWeight;
  });

  // 3. Calculate Base Convergence (Weighted Average)
  let baseConvergence = activeFamilies.reduce((sum, f) => sum + (f.score * f.normalizedWeight), 0);

  // 4. Measure Disagreement (Standard Deviation of weighted scores)
  let variance = 0;
  if (activeFamilies.length > 1) {
      variance = activeFamilies.reduce((acc, f) => acc + Math.pow(f.score - baseConvergence, 2), 0) / activeFamilies.length;
  }
  const stdDev = Math.sqrt(variance);

  // 5. Calibration Layer (V2.0)
  // Retrieve word count from family G if available, else guess ~200
  const wordCount = familyG_Integrity?.preprocessed?.wordCount || 200;
  
  const calibration = calibrateProbability(baseConvergence, wordCount, stdDev);
  const calibratedScore = calibration.calibratedProbability;
  
  // Calculate Confidence based on evidence coverage and uncertainty
  let confidence = evidenceCoverage - calibration.uncertainty;

  // Penalize for poor text integrity (Family G)
  if (familyG_Integrity?.available && familyG_Integrity.score < 80) {
      confidence -= (100 - familyG_Integrity.score) / 2;
  }

  confidence = Math.max(0, Math.min(100, Math.round(confidence)));

  let reliability = 'high';
  if (confidence < 40) reliability = 'low';
  else if (confidence < 70) reliability = 'moderate';

  let agreementLevel = 'high';
  if (stdDev > 25) agreementLevel = 'low (strong disagreement)';
  else if (stdDev > 15) agreementLevel = 'moderate (mixed evidence)';
  
  // Evidence Agreement (0-100 score, inverse of standard deviation)
  const evidenceAgreement = Math.max(0, Math.min(100, 100 - (stdDev * 1.5)));

  // 6. Classification Output
  let classification = 'uncertain';
  if (confidence >= 35) {
      if (stdDev > 30) classification = 'mixed_signals'; // Very high disagreement -> possible mixed authorship
      else if (calibratedScore > 75) classification = 'likely_ai';
      else if (calibratedScore > 60) classification = 'mixed_signals';
      else if (calibratedScore < 40) classification = 'likely_human';
      else classification = 'uncertain';
  } else {
      classification = 'insufficient_evidence';
  }

  return {
      aiLikelihood: calibratedScore,
      confidence,
      uncertainty: calibration.uncertainty,
      evidenceAgreement: Math.round(evidenceAgreement),
      reliability,
      evidenceCoverage: Math.round(evidenceCoverage),
      classification,
      agreementLevel,
      activeFamilies: activeFamilies.map(f => f.name),
      unavailableFamilies
  };
}
