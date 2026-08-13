import { preprocessText } from './textPreprocessor.js';
import { analyzeSentenceLengths } from './sentenceAnalyzer.js';
import { analyzeBurstiness } from './burstinessAnalyzer.js';
import { analyzeLexicalDiversity } from './lexicalAnalyzer.js';
import { analyzeRepetition } from './repetitionAnalyzer.js';
import { analyzePredictability } from './predictabilityAnalyzer.js';
import { analyzeStructure } from './structureAnalyzer.js';
import { analyzeStylometry } from './stylometryAnalyzer.js';
import { getAISemanticAssessment } from './aiAssessmentService.js';
import { calibrateEnsemble } from './calibrationService.js';

export async function detectAITextEnsemble(rawText) {
  // 1. Preprocess & Extract Structured Features
  const preprocessed = preprocessText(rawText);

  if (preprocessed.wordCount < 30) {
    return {
      isTooShort: true,
      wordCount: preprocessed.wordCount,
      message: 'Not enough text for a reliable estimate. Please provide at least 30 words.'
    };
  }

  // 2. Execute Independent Feature Analyzers
  const sentenceRes = analyzeSentenceLengths(preprocessed);
  const burstinessRes = analyzeBurstiness(preprocessed);
  const lexicalRes = analyzeLexicalDiversity(preprocessed);
  const repetitionRes = analyzeRepetition(preprocessed);
  const predictabilityRes = analyzePredictability(preprocessed);
  const structureRes = analyzeStructure(preprocessed);
  const stylometryRes = analyzeStylometry(preprocessed);

  // 3. Execute Optional Backend Gemini Semantic Assessment
  const semanticRes = await getAISemanticAssessment(rawText);

  // 4. Calibrate Weighted Ensemble Output
  const signals = {
    sentence: sentenceRes,
    burstiness: burstinessRes,
    lexical: lexicalRes,
    repetition: repetitionRes,
    predictability: predictabilityRes,
    structure: structureRes,
    stylometry: stylometryRes
  };

  const calibrated = calibrateEnsemble(signals, preprocessed.wordCount, semanticRes);

  return {
    ...calibrated,
    metrics: {
      sentence: sentenceRes,
      burstiness: burstinessRes,
      lexical: lexicalRes,
      repetition: repetitionRes,
      predictability: predictabilityRes,
      structure: structureRes,
      stylometry: stylometryRes
    }
  };
}
