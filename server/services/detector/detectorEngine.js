import { evaluateTextIntegrity } from './textIntegrityService.js';
import { analyzePredictability } from './predictabilityAnalyzer.js';
import { analyzeBurstiness } from './burstinessAnalyzer.js';
import { analyzeTokenDistribution } from './tokenDistributionAnalyzer.js';
import { analyzeRobustness } from './robustnessAnalyzer.js';
import { getAISemanticAssessment } from './aiAssessmentService.js';
import { computeEvidenceConvergence } from './evidenceConvergenceEngine.js';
import { detectAIWithML } from '../ml-detector-client.js';

export async function detectAITextEnsemble(rawText, options = {}) {
  // 1. Family G: Text Integrity & Preprocessing
  const integrity = evaluateTextIntegrity(rawText);
  
  if (!integrity.available) {
    return {
      success: false,
      version: '4.0',
      result: {
        aiLikelihood: 0,
        estimatedAIContent: 0,
        confidence: 0,
        reliability: 'low',
        evidenceCoverage: 0,
        classification: 'insufficient_evidence',
        agreementLevel: 'none',
        fallbackMode: false
      },
      evidence: {},
      limitations: ['Invalid input text provided.']
    };
  }

  const preprocessed = integrity.preprocessed;

  // 2. Local Analyzers (Families A, B, C, F)
  const predictability = analyzePredictability(preprocessed);
  const burstiness = analyzeBurstiness(preprocessed);
  const tokenDist = analyzeTokenDistribution(preprocessed);
  const robustness = analyzeRobustness(preprocessed);

  // 3. Remote Services (Families D, E)
  const [mlResults, semanticAssessment] = await Promise.all([
    detectAIWithML(preprocessed.normalizedText),
    getAISemanticAssessment(preprocessed.normalizedText)
  ]);

  // 4. Evidence Convergence (Legacy Fallback Support)
  const families = {
    familyA_Predictability: predictability,
    familyB_Burstiness: burstiness,
    familyC_TokenDist: tokenDist,
    familyD_ML: mlResults,
    familyE_Semantic: semanticAssessment,
    familyF_Robustness: robustness,
    familyG_Integrity: integrity
  };

  const convergence = computeEvidenceConvergence(families);

  // 4b. Sentence-level analysis (V4)
  const sentenceResults = [];
  const spans = [];
  let currentSpan = null;

  preprocessed.sentences.forEach((sentence, index) => {
      let sentenceLikelihood = null;
      let conf = 0;
      let evidence = [];

      if (mlResults?.sentences && mlResults.sentences[index]) {
          sentenceLikelihood = mlResults.sentences[index].probability;
          conf = mlResults.sentences[index].confidence === "HIGH" ? 95 : 60;
          evidence.push("v4_ml_classifier");
      }

      sentenceResults.push({
          index,
          aiLikelihood: sentenceLikelihood,
          confidence: conf,
          evidence: evidence
      });

      if (sentenceLikelihood !== null) {
          if (sentenceLikelihood > 65) {
              if (!currentSpan) {
                  currentSpan = { startSentence: index, endSentence: index, aiLikelihood: sentenceLikelihood, count: 1 };
              } else {
                  currentSpan.endSentence = index;
                  currentSpan.aiLikelihood += sentenceLikelihood;
                  currentSpan.count++;
              }
          } else {
              if (currentSpan) {
                  currentSpan.aiLikelihood = Math.round(currentSpan.aiLikelihood / currentSpan.count);
                  delete currentSpan.count;
                  spans.push(currentSpan);
                  currentSpan = null;
              }
          }
      }
  });
  
  if (currentSpan) {
      currentSpan.aiLikelihood = Math.round(currentSpan.aiLikelihood / currentSpan.count);
      delete currentSpan.count;
      spans.push(currentSpan);
  }

  // 5. Build Final Payload
  let aiLikelihood = convergence.aiLikelihood;
  let estimatedAIContent = convergence.aiLikelihood;
  let classification = convergence.classification;
  let fallbackMode = true;

  if (mlResults && mlResults.available && mlResults.results && mlResults.results.ensemble_v4) {
      const v4Data = mlResults.results.ensemble_v4;
      aiLikelihood = v4Data.probability;
      estimatedAIContent = v4Data.probability;
      classification = v4Data.classification || 'Unknown';
      fallbackMode = false;
  }

  return {
    success: true,
    version: '4.0',
    detectorVersion: '4.0',
    pipelineVersion: '4.0',
    calibrationVersion: 'V4-Isotonic',
    document: {
      aiLikelihood: aiLikelihood,
      estimatedAIContent: estimatedAIContent,
      confidence: fallbackMode ? convergence.confidence : 95,
      uncertainty: fallbackMode ? convergence.uncertainty : 5,
      evidenceAgreement: convergence.evidenceAgreement,
      reliability: fallbackMode ? convergence.reliability : 'high',
      evidenceCoverage: convergence.evidenceCoverage,
      classification: classification,
      agreementLevel: convergence.agreementLevel,
      activeFamilies: fallbackMode ? convergence.activeFamilies : ['V4 Neural Ensemble'],
      unavailableFamilies: fallbackMode ? convergence.unavailableFamilies : [],
      fallbackMode: fallbackMode,
      mixedAuthorship: classification === 'mixed_signals'
    },
    sentences: sentenceResults,
    spans: spans,
    evidence: {
      predictability,
      burstiness,
      tokenDist,
      mlResults,
      semanticAssessment,
      integrity
    },
    limitations: [
      'AI detection is probabilistic and should not be used as the sole basis for high-stakes decisions.',
      ...tokenDist.limitations || [],
      ...robustness.limitations || []
    ]
  };
}
