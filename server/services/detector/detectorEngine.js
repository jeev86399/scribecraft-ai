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
      version: '2.0',
      result: {
        aiLikelihood: 0,
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
  
  // Family F is offline/eval only, but we instantiate it for completeness
  const robustness = analyzeRobustness(preprocessed);

  // 3. Remote Services (Families D, E)
  // Run these concurrently for performance
  const [mlResults, semanticAssessment] = await Promise.all([
    detectAIWithML(preprocessed.normalizedText),
    getAISemanticAssessment(preprocessed.normalizedText)
  ]);

  // 4. Evidence Convergence
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

  // 4b. Sentence-level analysis (V2.1 - Real ML integration)
  const sentenceResults = [];
  const spans = [];
  let currentSpan = null;

  preprocessed.sentences.forEach((sentence, index) => {
      let sentenceLikelihood = null;
      let conf = 0;
      let evidence = [];

      // If ML service provided sentence-level predictions, use them
      if (mlResults?.sentences && mlResults.sentences[index]) {
          sentenceLikelihood = mlResults.sentences[index].probability;
          conf = mlResults.sentences[index].confidence || 80;
          evidence.push("ml_classifier");
      }

      // We no longer fake sentence probabilities with heuristics alone
      sentenceResults.push({
          index,
          aiLikelihood: sentenceLikelihood,
          confidence: conf,
          evidence: evidence
      });

      // Span tracking (only if we have real ML data)
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

  // 5. Standardized V2.0 Response
  return {
    success: true,
    version: '2.0',
    detectorVersion: '2.0',
    pipelineVersion: '2.1',
    calibrationVersion: '1.0',
    document: {
      aiLikelihood: convergence.aiLikelihood,
      confidence: convergence.confidence,
      uncertainty: convergence.uncertainty,
      evidenceAgreement: convergence.evidenceAgreement,
      reliability: convergence.reliability,
      evidenceCoverage: convergence.evidenceCoverage,
      classification: convergence.classification,
      agreementLevel: convergence.agreementLevel,
      activeFamilies: convergence.activeFamilies,
      unavailableFamilies: convergence.unavailableFamilies,
      fallbackMode: convergence.unavailableFamilies.includes('Family D (ML Classification)'),
      mixedAuthorship: convergence.classification === 'mixed_signals'
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
