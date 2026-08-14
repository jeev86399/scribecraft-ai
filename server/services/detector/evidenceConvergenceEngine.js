/**
 * Multi-Family AI Evidence Convergence Engine
 * Groups feature analyzers into 5 independent Evidence Families:
 * Family A: Semantic (Genericness, Interchangeability, Abstract Claims)
 * Family B: Discourse (Exposition Templates, Progression, Over-Coherence)
 * Family C: Linguistic (Phrase Predictability, Continuation Patterns)
 * Family D: Stylometric (Author Fingerprint, Personal Voice, Academic Citations)
 * Family E: AI Semantic Assessor (Gemini LLM evaluation)
 */

export function computeEvidenceConvergence(signals, semanticAssessment = null) {
  const {
    genericness,
    genericExposition,
    discourse,
    coherence,
    structure,
    predictability,
    repetition,
    lexical,
    stylometry,
    authorFingerprint,
    humanEvidence
  } = signals;

  // 1. FAMILY A: Semantic AI Evidence Score [0 - 100]
  let semScore = Math.max(genericness?.signalScore || 10, genericExposition?.signalScore || 10);
  if (genericExposition?.interchangeabilityIndex >= 60 || genericness?.genericnessScore >= 75) {
    semScore = Math.max(92, semScore);
  }
  const familyA_Score = semScore;

  // 2. FAMILY B: Discourse AI Evidence Score [0 - 100]
  let discScore = (discourse?.signalScore || 15) * 0.50 + (coherence?.signalScore || 10) * 0.30 + (structure?.signalScore || 10) * 0.20;
  if (discourse?.discourseConvergenceScore >= 50 || genericExposition?.templateMatchCount >= 1) {
    discScore = Math.max(78, discScore);
  }
  const familyB_Score = discScore;

  // 3. FAMILY C: Linguistic AI Evidence Score [0 - 100]
  let lingScore = (predictability?.signalScore || 10) * 0.70 + (repetition?.signalScore || 15) * 0.30;
  if (predictability?.formulaicPhraseCount >= 2 || predictability?.signalScore >= 60) {
    lingScore = Math.max(82, lingScore);
  }
  const familyC_Score = lingScore;

  // 4. FAMILY D: Stylometric AI Evidence Score [0 - 100]
  const sty1 = authorFingerprint?.signalScore || 50; // High when author fingerprint is LOW!
  const sty2 = (100 - (humanEvidence?.humanEvidenceScore || 0));
  const familyD_Score = sty1 * 0.60 + sty2 * 0.40;

  // 5. FAMILY E: AI Semantic Assessor (Optional Gemini) [0 - 100]
  let familyE_Score = null;
  if (semanticAssessment && typeof semanticAssessment.aiPatternSignal === 'number') {
    familyE_Score = semanticAssessment.aiPatternSignal;
  }

  // Count Active High-Value AI Evidence Families (Score >= 55)
  const familyScores = [
    { family: 'Family A (Semantic)', score: familyA_Score, weight: 0.35 },
    { family: 'Family B (Discourse)', score: familyB_Score, weight: 0.30 },
    { family: 'Family C (Linguistic)', score: familyC_Score, weight: 0.20 },
    { family: 'Family D (Stylometric)', score: familyD_Score, weight: 0.15 }
  ];

  if (familyE_Score !== null) {
    familyScores.push({ family: 'Family E (AI Assessor)', score: familyE_Score, weight: 0.25 });
  }

  const agreeingFamilies = familyScores.filter(f => f.score >= 55);
  const agreeingFamilyCount = agreeingFamilies.length;

  // Genericness x Structure Interaction Feature
  let interactionBoost = 0;
  if (familyA_Score >= 65 && familyB_Score >= 60) {
    interactionBoost = 12;
  } else if (familyA_Score >= 55 && familyB_Score >= 55) {
    interactionBoost = 6;
  }

  // Calculate AI Convergence Score
  let baseConvergence = familyA_Score * 0.35 + familyB_Score * 0.30 + familyC_Score * 0.20 + familyD_Score * 0.15;
  if (familyE_Score !== null) {
    baseConvergence = baseConvergence * 0.80 + familyE_Score * 0.20;
  }

  let aiConvergenceScore = baseConvergence + interactionBoost;

  // STRICT HIGH-AI ESCALATION RULE:
  // When 4 independent families agree, escalate to 92-97%!
  // When 3 independent families agree, escalate to 85-92%!
  if (agreeingFamilyCount >= 4) {
    aiConvergenceScore = Math.max(93, aiConvergenceScore + 10);
  } else if (agreeingFamilyCount >= 3) {
    aiConvergenceScore = Math.max(86, aiConvergenceScore + 6);
  }

  aiConvergenceScore = Math.min(97, Math.round(aiConvergenceScore));

  let agreementLevel = 'Mixed Evidence';
  if (agreeingFamilyCount >= 3) agreementLevel = 'Strong Cross-Family Convergence';
  else if (agreeingFamilyCount >= 2) agreementLevel = 'Moderate Convergence';

  return {
    familyA_Score: Math.round(familyA_Score),
    familyB_Score: Math.round(familyB_Score),
    familyC_Score: Math.round(familyC_Score),
    familyD_Score: Math.round(familyD_Score),
    familyE_Score: familyE_Score !== null ? Math.round(familyE_Score) : null,
    agreeingFamilyCount,
    agreementLevel,
    interactionBoost,
    aiConvergenceScore
  };
}
