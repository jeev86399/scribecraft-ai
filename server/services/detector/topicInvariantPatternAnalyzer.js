import { analyzeSentenceRoles } from './sentenceRoleAnalyzer.js';

/**
 * Topic Invariant Pattern Analyzer
 * Evaluates structural rhetorical sequencing independently of subject matter.
 * Looks for: Broad Claim -> Expansion/Examples -> Benefit -> Conclusion.
 */

export function analyzeTopicInvariantPattern(preprocessed) {
  const roles = analyzeSentenceRoles(preprocessed);
  const sequenceStr = roles.join(' -> ');

  let patternMatchScore = 10;
  let detectedPattern = 'No distinct pattern';

  // Pattern 1: The Classic Informational Arc (Applies to Tech, Lunch, Health, etc.)
  // e.g. DEFINITION -> EXAMPLES -> BENEFIT -> CONCLUSION
  if (
    (roles[0] === 'DEFINITION' || roles[0] === 'BROAD_CLAIM') &&
    (roles.includes('BENEFIT')) &&
    (roles[roles.length - 1] === 'CONCLUSION')
  ) {
    patternMatchScore = 90;
    detectedPattern = 'Complete Expository Arc (Definition -> Benefit -> Conclusion)';
  } 
  else if (
    roles.includes('BENEFIT') && roles.includes('CONCLUSION')
  ) {
    patternMatchScore = 70;
    detectedPattern = 'Partial Expository Arc (Benefit -> Conclusion)';
  }

  let rating = 'Natural Discourse Variation';
  if (patternMatchScore >= 80) rating = 'Highly Formulaic Sequence';
  else if (patternMatchScore >= 60) rating = 'Template-Like Sequence';

  let explanation = 'Text follows a natural, unforced discourse progression.';
  if (patternMatchScore >= 80) {
    explanation = `Text exhibits a highly formulaic topic-invariant sequence: ${detectedPattern}.`;
  }

  return {
    roles,
    sequenceStr,
    patternMatchScore,
    detectedPattern,
    rating,
    explanation
  };
}
