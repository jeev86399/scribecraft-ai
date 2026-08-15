import { preprocessText } from './textPreprocessor.js';
import { analyzeSentenceLengths } from './sentenceAnalyzer.js';
import { analyzeBurstiness } from './burstinessAnalyzer.js';
import { analyzeLexicalDiversity } from './lexicalAnalyzer.js';
import { analyzeRepetition } from './repetitionAnalyzer.js';
import { analyzePredictability } from './predictabilityAnalyzer.js';
import { analyzeStructure } from './structureAnalyzer.js';
import { analyzeStylometry } from './stylometryAnalyzer.js';
import { analyzeSemanticGenericness } from './semanticGenericnessAnalyzer.js';
import { analyzeSemanticInterchangeability } from './semanticInterchangeabilityAnalyzer.js';
import { analyzeEncyclopedicVoice } from './encyclopedicVoiceAnalyzer.js';
import { analyzeTopicInvariantPattern } from './topicInvariantPatternAnalyzer.js';
import { analyzeContentGenerationStyle } from './contentGenerationStyleAnalyzer.js';
import { analyzeDiscoursePatterns } from './discoursePatternAnalyzer.js';
import { analyzeCoherence } from './coherenceAnalyzer.js';
import { analyzeHumanEvidence } from './humanEvidenceAnalyzer.js';
import { analyzeAuthorFingerprint } from './authorFingerprintAnalyzer.js';
import { getAISemanticAssessment } from './aiAssessmentService.js';
import { calibrateEnsemble } from './calibrationService.js';
import { validateDetectorConsistency } from './consistencyValidator.js';
import { detectAIWithML } from '../ml-detector-client.js';

function extractSignals(text) {
  const preprocessed = preprocessText(text);

  if (preprocessed.wordCount < 15) {
    return { isTooShort: true, wordCount: preprocessed.wordCount };
  }

  const genericnessRes = analyzeSemanticGenericness(preprocessed);
  const interchangeabilityRes = analyzeSemanticInterchangeability(preprocessed);
  const contentStyleRes = analyzeContentGenerationStyle(preprocessed);
  const topicPatternRes = analyzeTopicInvariantPattern(preprocessed);
  const predictabilityRes = analyzePredictability(preprocessed);
  const encyclopedicVoiceRes = analyzeEncyclopedicVoice(preprocessed);
  const stylometryRes = analyzeStylometry(preprocessed);
  const humanEvidenceRes = analyzeHumanEvidence(preprocessed, stylometryRes);
  const authorFingerprintRes = analyzeAuthorFingerprint(preprocessed, genericnessRes, humanEvidenceRes);
  
  return {
    isTooShort: false,
    preprocessed,
    signals: {
      sentence: analyzeSentenceLengths(preprocessed),
      burstiness: analyzeBurstiness(preprocessed),
      lexical: analyzeLexicalDiversity(preprocessed),
      repetition: analyzeRepetition(preprocessed),
      structure: analyzeStructure(preprocessed),
      discourse: analyzeDiscoursePatterns(preprocessed),
      coherence: analyzeCoherence(preprocessed),
      genericness: genericnessRes,
      interchangeability: interchangeabilityRes,
      contentStyle: contentStyleRes,
      topicPattern: topicPatternRes,
      predictability: predictabilityRes,
      encyclopedicVoice: encyclopedicVoiceRes,
      stylometry: stylometryRes,
      humanEvidence: humanEvidenceRes,
      authorFingerprint: authorFingerprintRes
    }
  };
}

export async function detectAITextEnsemble(rawText, options = {}) {
  // 1. Multi-Level Processing (Document vs Paragraph)
  const documentLevel = extractSignals(rawText);
  if (documentLevel.isTooShort) {
    return {
      isTooShort: true,
      wordCount: documentLevel.wordCount,
      message: 'Not enough text for a reliable estimate. Please provide at least 15-30 words.'
    };
  }

  // 2. Fetch ML Backend Results (V5 Hybrid Addition)
  const mlResults = await detectAIWithML(rawText);

  // 3. Execute Optional Backend Gemini Semantic Assessment (Legacy Family E)
  const semanticRes = await getAISemanticAssessment(rawText);

  // 4. Calibrate Hybrid Multi-Family Evidence Convergence Ensemble Output
  const sensitivityMode = options.sensitivityMode || 'Balanced';
  const calibrated = calibrateEnsemble(
    documentLevel.signals, 
    documentLevel.preprocessed.wordCount, 
    semanticRes, 
    mlResults,
    options.enableDiagnosticTrace || true,
    sensitivityMode
  );

  // 5. Validate Detector Output Consistency
  const validated = validateDetectorConsistency(calibrated, documentLevel.signals);

  return {
    ...validated,
    metrics: documentLevel.signals
  };
}
