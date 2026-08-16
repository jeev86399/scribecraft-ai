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

  // 5. Standardized V2.0 Response
  return {
    success: true,
    version: '2.0',
    result: {
      aiLikelihood: convergence.aiLikelihood,
      confidence: convergence.confidence,
      reliability: convergence.reliability,
      evidenceCoverage: convergence.evidenceCoverage,
      classification: convergence.classification,
      agreementLevel: convergence.agreementLevel,
      activeFamilies: convergence.activeFamilies,
      unavailableFamilies: convergence.unavailableFamilies,
      fallbackMode: convergence.unavailableFamilies.includes('Family D (ML Classification)')
    },
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
