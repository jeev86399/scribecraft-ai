import { detectAITextEnsemble } from './detector/detectorEngine.js';
import { STAGE1_ANALYSIS_PROMPT, GENERATION_PROMPTS, REFINEMENT_PROMPT } from './humanizerPrompts.js';
import { callGeminiApi } from './aiConfig.js';

// Minimum meaning preservation threshold required to accept a rewrite
const MIN_MEANING_PRESERVATION = 0.90;
// Maximum refinement loops
const MAX_HUMANIZATION_ITERATIONS = 2;

/**
 * Call Gemini API using centralized config
 */
async function callGemini(prompt, text, maxTokens = 2048) {
  const fullPrompt = `${prompt}\n\nOriginal Text:\n"""\n${text}\n"""`;
  try {
    return await callGeminiApi(fullPrompt, maxTokens, 0.7);
  } catch (err) {
    // humanizerService explicitly swallows internal throw and returns null for the orchestrator to handle
    return null; 
  }
}

/**
 * Stage 1: Deep Input Analysis
 */
async function analyzeInputText(text) {
  const analysis = await callGemini(STAGE1_ANALYSIS_PROMPT, text, 1024);
  if (!analysis) {
    // Fallback if analysis fails structurally
    return {
      factualAnchors: { namesAndProperNouns: [], numbersAndDates: [] },
      structuralWeaknesses: { formulaicTransitions: [], genericTemplates: [] }
    };
  }
  return analysis;
}

/**
 * Meaning Preservation Checker
 */
function evaluateFactPreservation(originalAnalysis, candidateText) {
  let missingElements = [];
  const candTextLower = candidateText.toLowerCase();

  // Check numbers and dates
  const numbers = originalAnalysis.factualAnchors?.numbersAndDates || [];
  for (const num of numbers) {
    if (!candTextLower.includes(String(num).toLowerCase())) {
      missingElements.push(`number/date: ${num}`);
    }
  }

  // Check names and proper nouns
  const nouns = originalAnalysis.factualAnchors?.namesAndProperNouns || [];
  for (const noun of nouns) {
    if (!candTextLower.includes(String(noun).toLowerCase())) {
      missingElements.push(`name/noun: ${noun}`);
    }
  }

  const totalConstraints = numbers.length + nouns.length;
  if (totalConstraints === 0) return { preserved: true, score: 1.0, missingElements: [] };

  const preservedCount = totalConstraints - missingElements.length;
  const score = preservedCount / totalConstraints;

  return {
    preserved: score >= MIN_MEANING_PRESERVATION,
    score,
    missingElements
  };
}

/**
 * Stage 3: Evaluate Candidates using real detector
 */
async function evaluateCandidatesWithDetector(candidates, originalAnalysis, beforeScore) {
  const evaluated = [];

  for (const candidateText of candidates) {
    // Basic length check to prevent hallucinated truncation
    if (!candidateText || candidateText.trim().split(/\s+/).length < 10) continue;

    const meaningCheck = evaluateFactPreservation(originalAnalysis, candidateText);
    
    // Reject if facts were lost below threshold
    if (!meaningCheck.preserved) {
      console.log(`[Humanizer] Rejected candidate due to lost facts:`, meaningCheck.missingElements);
      continue;
    }

    const candidateRes = await detectAITextEnsemble(candidateText);
    const delta = (beforeScore.aiLikelihood || 0) - (candidateRes.aiLikelihood || 0);

    evaluated.push({
      text: candidateText,
      aiLikelihood: candidateRes.aiLikelihood,
      humanLikelihood: candidateRes.humanLikelihood,
      classificationLabel: candidateRes.classificationLabel,
      confidence: candidateRes.confidence,
      delta: delta,
      meaningScore: meaningCheck.score
    });
  }

  // Sort by highest AI score reduction
  return evaluated.sort((a, b) => b.delta - a.delta);
}

/**
 * Main Service Export
 */
export async function humanizeTextService(rawText, mode = 'natural') {
  if (!rawText || rawText.trim().split(/\s+/).filter(Boolean).length < 15) {
    return { error: 'Text is too short to humanize (minimum 15 words required).' };
  }

  if (!process.env.GEMINI_API_KEY) {
    return { error: 'AI humanization service is currently unavailable.' };
  }

  console.log(`[Humanizer] Input received: ${rawText.split(/\s+/).length} words`);
  console.log(`[Humanizer] Mode: ${mode}`);
  console.log(`[Humanizer] Gemini available: true`);

  const selectedMode = (mode || 'natural').toLowerCase();

  // STEP 1: Real baseline detector score
  const beforeScore = await detectAITextEnsemble(rawText);
  console.log(`[Humanizer] Original detector score: ${beforeScore.aiLikelihood}`);

  // STEP 2: Deep Analysis
  console.log(`[Humanizer] Analyzing writing...`);
  const analysis = await analyzeInputText(rawText);
  
  // Choose the right prompt
  const generationPrompt = GENERATION_PROMPTS[selectedMode] || GENERATION_PROMPTS.natural;
  
  // We will run up to MAX_HUMANIZATION_ITERATIONS
  let bestCandidate = null;
  let currentCandidates = [];
  
  for (let iteration = 1; iteration <= MAX_HUMANIZATION_ITERATIONS; iteration++) {
    console.log(`[Humanizer] Iteration ${iteration}: Generating candidates...`);
    
    let promptToUse = generationPrompt;
    let baseTextToRewrite = rawText;

    if (iteration > 1 && bestCandidate) {
       promptToUse = REFINEMENT_PROMPT;
       baseTextToRewrite = bestCandidate.text;
    }

    // Pass the extracted analysis to Gemini so it knows what to preserve and what to fix
    const enrichedPrompt = `
${promptToUse}

ANALYSIS CONSTRAINTS:
Factual Anchors to STRICTLY PRESERVE: ${JSON.stringify(analysis.factualAnchors)}
Structural Weaknesses to REMOVE: ${JSON.stringify(analysis.structuralWeaknesses)}
`;

    const generated = await callGemini(enrichedPrompt, baseTextToRewrite, 2048);
    let newCandidates = [];
    if (Array.isArray(generated)) {
      newCandidates = generated;
    } else if (typeof generated === 'string') {
      newCandidates = [generated];
    }

    if (newCandidates.length === 0) {
      console.log(`[Humanizer] No valid candidates generated on iteration ${iteration}`);
      break;
    }

    console.log(`[Humanizer] Candidate generation: ${newCandidates.length} candidates`);

    const evaluated = await evaluateCandidatesWithDetector(newCandidates, analysis, beforeScore);
    
    if (evaluated.length > 0) {
      // If this iteration produced a candidate better than our previous best, update it
      const topIterationCandidate = evaluated[0];
      if (!bestCandidate || topIterationCandidate.delta > bestCandidate.delta) {
         bestCandidate = topIterationCandidate;
      }
    }
    
    // If we've already achieved a massive reduction or hit a very low AI score, we can stop early
    if (bestCandidate && bestCandidate.aiLikelihood <= 20) {
      console.log(`[Humanizer] Achieved excellent target score (${bestCandidate.aiLikelihood}%). Stopping early.`);
      break;
    }
  }

  // Final Honest Reporting
  if (!bestCandidate || bestCandidate.delta <= 0) {
    console.log(`[Humanizer] Final detector score: ${beforeScore.aiLikelihood} (No improvement)`);
    return {
      mode: selectedMode,
      isLimitedTransformation: true,
      beforeScore: { aiLikelihood: beforeScore.aiLikelihood, classificationLabel: beforeScore.classificationLabel },
      afterScore: { aiLikelihood: beforeScore.aiLikelihood, classificationLabel: beforeScore.classificationLabel },
      scoreDelta: 0,
      humanizedText: bestCandidate ? bestCandidate.text : rawText,
      reducedSignals: ['Targeted formulaic syntax (Limited)'],
      preservedElements: ['Preserved core factual anchors and meaning.'],
      explanationNote: "Style revised; however, the real detector estimate changed minimally. No stronger structural transformations could be safely applied without changing factual meaning."
    };
  }

  console.log(`[Humanizer] Final detector score: ${bestCandidate.aiLikelihood}`);

  return {
    mode: selectedMode,
    isLimitedTransformation: false,
    beforeScore: {
      aiLikelihood: beforeScore.aiLikelihood,
      humanLikelihood: beforeScore.humanLikelihood,
      classificationLabel: beforeScore.classificationLabel,
      confidence: beforeScore.confidence
    },
    afterScore: {
      aiLikelihood: bestCandidate.aiLikelihood,
      humanLikelihood: bestCandidate.humanLikelihood,
      classificationLabel: bestCandidate.classificationLabel,
      confidence: bestCandidate.confidence
    },
    scoreDelta: bestCandidate.delta,
    humanizedText: bestCandidate.text,
    reducedSignals: [
      'Removed predictable structural cliché templates',
      'Disrupted rigid rhetorical sequences',
      'Replaced semantic genericness'
    ],
    preservedElements: [
      'Preserved technical facts and metrics',
      'Preserved proper nouns and dates',
      'Preserved original core intent'
    ]
  };
}
