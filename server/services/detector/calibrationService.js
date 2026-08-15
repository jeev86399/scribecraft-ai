export function calibrateEnsemble(signals, wordCount, semanticRes, mlResults, enableDiagnosticTrace = false, sensitivityMode = 'Balanced') {
  const { 
    genericness, 
    interchangeability,
    encyclopedicVoice, 
    topicPattern, 
    contentStyle, 
    predictability,
    authorFingerprint,
    humanEvidence 
  } = signals;

  // 1. Rule-Based Explainable Engine (V4 Logic)
  const semanticFamily = genericness.signalScore;
  const interchangeabilityFamily = interchangeability?.signalScore || 0;
  const discourseFamily = Math.max(
    encyclopedicVoice?.signalScore || 0,
    topicPattern?.patternMatchScore || 0,
    contentStyle?.styleScore || 0
  );
  const linguisticFamily = predictability.signalScore;
  const stylometricFamily = authorFingerprint.signalScore;

  const rawFamilies = [
    { name: 'Semantic', score: semanticFamily },
    { name: 'Interchangeability', score: interchangeabilityFamily },
    { name: 'Discourse', score: discourseFamily },
    { name: 'Linguistic', score: linguisticFamily },
    { name: 'Stylometric', score: stylometricFamily }
  ];

  const strongFamilies = rawFamilies.filter(f => f.score >= 55);
  const familyAgreement = strongFamilies.length;

  let ruleConvergenceScore = 0;
  if (familyAgreement >= 3) {
    const baseAvg = strongFamilies.reduce((a, b) => a + b.score, 0) / familyAgreement;
    let interactionBoost = familyAgreement === 5 ? 15 : (familyAgreement === 4 ? 10 : 5);
    ruleConvergenceScore = Math.min(99, baseAvg + interactionBoost);
  } else if (familyAgreement === 2) {
    const baseAvg = strongFamilies.reduce((a, b) => a + b.score, 0) / 2;
    ruleConvergenceScore = Math.min(69, baseAvg + 5);
  } else if (familyAgreement === 1) {
    ruleConvergenceScore = Math.min(29, strongFamilies[0].score * 0.45);
  } else {
    const maxIsolated = Math.max(...rawFamilies.map(f => f.score));
    ruleConvergenceScore = Math.min(15, maxIsolated * 0.25);
  }

  // 2. ML Detector Extraction (V5 Logic)
  let mlScore = 0;
  let isMlActive = false;
  let isOod = false;
  
  if (mlResults && !mlResults.fallbackMode && mlResults.results) {
    isMlActive = true;
    isOod = mlResults.is_ood || false;
    
    // For V5, we expect multiple models in the results dictionary
    const modelScores = Object.values(mlResults.results).map(m => (m.calibrated_probability || 0) * 100);
    // Simple average for now if multiple models exist, but usually we just requested roberta_base
    mlScore = modelScores.reduce((a, b) => a + b, 0) / (modelScores.length || 1);
  } else {
    // If ML failed, fallback entirely to rules
    mlScore = ruleConvergenceScore;
  }

  // 3. Hybrid Ensemble Fusion
  let calibratedAiScore = 0;
  if (isMlActive) {
    // Fusion logic: We trust ML more if it agrees with rules.
    // If they strongly disagree, it drives uncertainty up.
    if (Math.abs(mlScore - ruleConvergenceScore) < 25) {
      // They agree roughly. Average them.
      calibratedAiScore = (mlScore + ruleConvergenceScore) / 2;
    } else {
      // They disagree. 
      // If OOD is true, we trust the rule engine more because ML might be failing on a domain shift.
      if (isOod) {
        calibratedAiScore = (ruleConvergenceScore * 0.7) + (mlScore * 0.3);
      } else {
        calibratedAiScore = (mlScore * 0.7) + (ruleConvergenceScore * 0.3);
      }
    }
  } else {
    calibratedAiScore = ruleConvergenceScore;
  }

  // 4. Sensitivity Threshold Adjustments
  // Conservative: prioritize low false positives (dampen score slightly)
  // Balanced: no change
  // Strict: prioritize low false negatives (boost score slightly if borderline)
  if (sensitivityMode === 'Conservative') {
    calibratedAiScore *= 0.9;
  } else if (sensitivityMode === 'Strict' && calibratedAiScore >= 40) {
    // Boost borderline scores upward in Strict mode
    calibratedAiScore = Math.min(99, calibratedAiScore * 1.15);
  }

  // 5. Human Evidence Dampening
  let humanScore = humanEvidence.evidenceScore;
  if (humanScore >= 75) {
    calibratedAiScore = Math.min(25, calibratedAiScore * 0.3);
  } else if (humanScore >= 50 && calibratedAiScore < 90) {
    calibratedAiScore = calibratedAiScore * 0.7;
  }

  // Final Bounds
  calibratedAiScore = Math.max(0, Math.min(100, Math.round(calibratedAiScore)));
  humanScore = Math.max(0, Math.min(100, Math.round(humanScore)));

  // 6. Uncertainty & Confidence Modeling
  let confidence = 'Medium';
  let uncertainty = 'Low';
  
  if (wordCount < 25) {
    confidence = 'Low';
    uncertainty = 'High';
  } else if (wordCount >= 50 && familyAgreement >= 3 && (!isMlActive || Math.abs(mlScore - ruleConvergenceScore) < 20)) {
    confidence = 'High';
    uncertainty = 'Low';
  } else if (isMlActive && Math.abs(mlScore - ruleConvergenceScore) > 40) {
    // Huge disagreement between explainable engine and ML
    confidence = 'Low';
    uncertainty = 'High';
  } else if (isOod) {
    confidence = 'Low';
    uncertainty = 'Moderate';
  }

  // 7. V5 Strict Classification Labels
  let label = 'Mixed or Uncertain';
  if (calibratedAiScore >= 95) label = 'Extremely High AI-Pattern Signal';
  else if (calibratedAiScore >= 85) label = 'Very High AI-Pattern Signal';
  else if (calibratedAiScore >= 70) label = 'High AI-Pattern Signal';
  else if (calibratedAiScore >= 50) label = 'Moderate AI-Pattern Signal';
  else if (calibratedAiScore >= 31) label = 'Some AI-Pattern Signal';
  else if (calibratedAiScore >= 16) label = 'Low AI-Pattern Signal';
  else label = 'Very Low AI-Pattern Signal';

  const diagnosticTrace = enableDiagnosticTrace ? `
TEXT INPUT (${wordCount} words) | SENSITIVITY: ${sensitivityMode}
↓
EXPLAINABLE SIGNAL ENGINE:
- Semantic Genericness: ${semanticFamily}
- Semantic Interchangeability: ${interchangeabilityFamily}
- Discourse/Rhetorical Structure: ${discourseFamily}
- Predictability (Adversarial): ${linguisticFamily}
- Author Fingerprint: ${stylometricFamily}
- Lived Contextual Detail (Human): ${humanScore}
  => RULE CONVERGENCE SCORE: ${Math.round(ruleConvergenceScore)}%
↓
TRAINED ML DETECTOR ENGINE:
- Active: ${isMlActive}
- Out of Distribution (OOD): ${isOod}
  => ML CALIBRATED SCORE: ${Math.round(mlScore)}%
↓
CALIBRATED ENSEMBLE FUSION:
- Final Score: ${calibratedAiScore}%
- Uncertainty: ${uncertainty}
- Confidence: ${confidence}
-------------------------------------------` : null;

  // Build Reasons (Driven strictly by explainable rule engine)
  const reasons = [];
  if (semanticFamily >= 75) reasons.push(genericness.explanation);
  if (interchangeabilityFamily >= 75) reasons.push(interchangeability.explanation);
  if (discourseFamily >= 75) {
    if (topicPattern.patternMatchScore >= 80) reasons.push(topicPattern.explanation);
    else if (encyclopedicVoice.signalScore >= 75) reasons.push(encyclopedicVoice.explanation);
    else if (contentStyle.styleScore >= 75) reasons.push(contentStyle.explanation);
  }
  if (linguisticFamily >= 75) reasons.push(predictability.explanation);
  if (humanScore >= 50) reasons.push(humanEvidence.explanation);
  if (isOod) reasons.push("Warning: Text falls outside standard training distributions, reducing detection confidence.");
  
  if (reasons.length === 0) {
    if (calibratedAiScore <= 30) reasons.push("Text exhibits natural variation and lacks generative signatures.");
    else reasons.push("Text exhibits mixed patterns without a single dominant generative or human signature.");
  }

  const keySignals = [
    { name: 'Semantic Genericness', result: genericness.rating, level: genericness.signalScore >= 75 ? 'AI-Pattern' : 'Neutral' },
    { name: 'Semantic Interchangeability', result: interchangeability?.rating || 'Neutral', level: interchangeabilityFamily >= 75 ? 'AI-Pattern' : 'Neutral' },
    { name: 'Rhetorical Structure', result: topicPattern.rating, level: topicPattern.patternMatchScore >= 80 ? 'AI-Pattern' : 'Neutral' },
    { name: 'Syntactic Templates', result: predictability.rating, level: predictability.signalScore >= 75 ? 'AI-Pattern' : 'Neutral' }
  ];

  return {
    aiLikelihood: calibratedAiScore,
    humanLikelihood: humanScore,
    classificationLabel: label,
    confidence,
    uncertainty,
    wordCount,
    keySignals,
    reasons,
    diagnosticTrace,
    isMlActive,
    isOod,
    sensitivityMode,
    disclaimer: "AI detection is a hybrid estimate using both linguistic analysis and ML probabilities. It is not definitive proof."
  };
}
