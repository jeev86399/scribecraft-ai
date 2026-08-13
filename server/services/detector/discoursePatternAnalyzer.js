/**
 * Discourse & Argument Flow Analyzer
 * Detects overly smooth AI-style conceptual progression:
 * Broad Claim -> Benefit Expansion -> Sector List -> Risk/Ethical Caution -> Responsible Conclusion.
 */

export function analyzeDiscoursePatterns(preprocessed) {
  const { sentences, wordCount } = preprocessed;
  if (!sentences || sentences.length < 3 || wordCount < 30) {
    return {
      discourseConvergenceScore: 0,
      detectedProgression: [],
      signalScore: 15,
      rating: 'Natural Discourse Flow',
      explanation: 'Insufficient sentences to evaluate discourse progression.'
    };
  }

  // Sentence Semantic Role Detection Rules
  let hasBroadClaim = false;
  let hasBenefitExpansion = false;
  let hasSectorList = false;
  let hasBalancedCaution = false;
  let hasResponsibleConclusion = false;

  const detectedProgression = [];

  sentences.forEach((s, index) => {
    const lower = s.toLowerCase();

    // 1. Broad Transformation / Definition Claim (usually 1st or 2nd sentence)
    if (index <= 1 && (lower.includes('rapidly evolving') || lower.includes('plays a crucial role') || lower.includes('transforming') || lower.includes('modern healthcare') || lower.includes('modern business'))) {
      hasBroadClaim = true;
      if (!detectedProgression.includes('Broad Transformation Claim')) {
        detectedProgression.push('Broad Transformation Claim');
      }
    }

    // 2. Benefit / Opportunity Expansion
    if (lower.includes('leveraging') || lower.includes('streamline') || lower.includes('optimize') || lower.includes('fosters a culture') || lower.includes('enhance diagnostic accuracy')) {
      hasBenefitExpansion = true;
      if (!detectedProgression.includes('Benefit Expansion')) {
        detectedProgression.push('Benefit Expansion');
      }
    }

    // 3. Sector / Industry Enumeration
    if (lower.includes('healthcare') || lower.includes('finance') || lower.includes('education') || lower.includes('across enterprise') || lower.includes('global health systems')) {
      hasSectorList = true;
      if (!detectedProgression.includes('Sector Enumeration')) {
        detectedProgression.push('Sector Enumeration');
      }
    }

    // 4. Balanced Contrast / Risk Caveat
    if (lower.includes('however') || lower.includes('important to note that these tools do not replace') || lower.includes('challenges') || lower.includes('on the other hand') || lower.includes('ethical')) {
      hasBalancedCaution = true;
      if (!detectedProgression.includes('Balanced Caution')) {
        detectedProgression.push('Balanced Caution');
      }
    }

    // 5. Responsible / Ethical Solution Conclusion (usually last sentence)
    if (index >= sentences.length - 2 && (lower.includes('in conclusion') || lower.includes('essential for maintaining') || lower.includes('must remain adaptable') || lower.includes('proactive patient care'))) {
      hasResponsibleConclusion = true;
      if (!detectedProgression.includes('Responsible Conclusion')) {
        detectedProgression.push('Responsible Conclusion');
      }
    }
  });

  // Calculate Convergence Score (0-100)
  const roleCount = detectedProgression.length;
  let discourseConvergenceScore = Math.min(100, roleCount * 22);

  // High convergence if 3+ rhetorical roles appear in systematic textbook order
  if (hasBroadClaim && hasBenefitExpansion && (hasBalancedCaution || hasResponsibleConclusion)) {
    discourseConvergenceScore = Math.max(85, discourseConvergenceScore);
  }

  let signalScore = 15;
  if (discourseConvergenceScore >= 80) signalScore = 85;
  else if (discourseConvergenceScore >= 55) signalScore = 65;
  else if (discourseConvergenceScore >= 35) signalScore = 40;

  let rating = 'Natural Discourse Flow';
  if (signalScore >= 75) rating = 'Formulaic Expository Progression';
  else if (signalScore >= 50) rating = 'Moderate Structural Regularity';

  let explanation = 'Sentence progression demonstrates natural human discourse flow.';
  if (signalScore >= 75) {
    explanation = `Expository progression matches textbook AI essay structure (${detectedProgression.join(' -> ')}).`;
  }

  return {
    discourseConvergenceScore,
    detectedProgression,
    signalScore,
    rating,
    explanation
  };
}
