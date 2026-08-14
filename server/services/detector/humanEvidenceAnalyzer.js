/**
 * True Human-Evidence Layer
 * Isolates authentic human signatures (lived experience, specific events, personal voice, academic research citations)
 * from neutral stylistic features (good grammar, varied sentence length, TTR).
 */

const HUMAN_NARRATIVE_MARKERS = [
  /\b(yesterday|last week|this morning|last night|a few days ago|when I was|back in|my (roommate|friend|brother|sister|mom|dad|family|husband|wife|boss|colleague))\b/i,
  /\b(woke up|alarm|coffee|socks|router|train|bus|car|apartment|house|kitchen|desk)\b/i,
  /\b(honestly|to be honest|frankly|in my experience|at least for me|if I recall|I'm not sure|I think|I felt|I noticed)\b/i,
  /\b(laughed|cried|stuck|frustrated|scared|surprised|confused|weird|funny|crazy|sideways)\b/i
];

export function analyzeHumanEvidence(preprocessed, stylometryRes) {
  const { normalizedText, wordCount } = preprocessed;
  if (!normalizedText || wordCount < 15) {
    return {
      humanEvidenceScore: 0,
      hasLivedExperience: false,
      hasPersonalVoice: false,
      hasAcademicSignatures: false,
      signalScore: 0,
      rating: 'No Explicit Human Signatures',
      explanation: 'Insufficient text to evaluate human evidence.'
    };
  }

  // 1. Narrative & Lived Experience Markers
  let narrativeMarkerCount = 0;
  for (const regex of HUMAN_NARRATIVE_MARKERS) {
    if (regex.test(normalizedText)) {
      narrativeMarkerCount++;
    }
  }

  const hasLivedExperience = narrativeMarkerCount >= 2 || (stylometryRes?.firstPersonCount >= 3 && narrativeMarkerCount >= 1);

  // 2. Personal Voice & Authentic Contractions (excluding possessive nouns)
  const authenticContractionCount = stylometryRes?.contractionCount || 0;
  const firstPersonCount = stylometryRes?.firstPersonCount || 0;

  const hasPersonalVoice = authenticContractionCount >= 1 && firstPersonCount >= 1;

  // 3. Academic Research Signatures
  const hasAcademicSignatures = stylometryRes?.isAcademicHuman || false;

  // Compute Positive Human Evidence Score [0 - 100]
  let humanEvidenceScore = 0;
  if (hasAcademicSignatures) {
    humanEvidenceScore = 90;
  } else if (hasLivedExperience && hasPersonalVoice) {
    humanEvidenceScore = 95;
  } else if (hasLivedExperience) {
    humanEvidenceScore = 80;
  } else if (hasPersonalVoice) {
    humanEvidenceScore = 65;
  } else if (authenticContractionCount >= 1 || firstPersonCount >= 2) {
    humanEvidenceScore = 45;
  }

  let rating = 'No Explicit Human Signatures';
  if (humanEvidenceScore >= 80) rating = 'Strong Positive Human Evidence';
  else if (humanEvidenceScore >= 45) rating = 'Moderate Personal Voice';

  let explanation = 'Text contains no explicit personal lived experience or academic research signatures.';
  if (hasAcademicSignatures) {
    explanation = 'Contains formal peer-reviewed academic citations, figures, and methodology signatures.';
  } else if (hasLivedExperience) {
    explanation = 'Contains concrete lived personal experience, specific event continuity, and authentic narrative voice.';
  } else if (hasPersonalVoice) {
    explanation = 'Features authentic personal voice with informal contractions and first-person perspective.';
  }

  return {
    humanEvidenceScore,
    narrativeMarkerCount,
    hasLivedExperience,
    hasPersonalVoice,
    hasAcademicSignatures,
    signalScore: humanEvidenceScore,
    rating,
    explanation
  };
}
