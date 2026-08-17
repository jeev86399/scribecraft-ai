import { computeEvidenceConvergence } from '../../services/detector/evidenceConvergenceEngine.js';
import { calibrateProbability } from '../../services/detector/calibrationService.js';

function runUnitTests() {
  console.log('--- ScribeCraft AI v2.0 Unit Tests ---');
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
    }
  }

  // 1. Calibration Service Tests
  console.log('\nTesting Calibration Service...');
  
  // High agreement, long text
  let cal = calibrateProbability(90, 500, 10);
  assert(cal.calibratedProbability > 85, 'Maintains high score for long confident text');
  
  // High agreement, short text
  let calShort = calibrateProbability(90, 30, 10);
  assert(calShort.calibratedProbability < cal.calibratedProbability, 'Temperature scaling pulls short text score closer to 50%');
  
  // High disagreement
  let calDisagree = calibrateProbability(90, 500, 40);
  assert(calDisagree.calibratedProbability < cal.calibratedProbability, 'High standard deviation pulls score down');
  
  // 2. Evidence Convergence Tests
  console.log('\nTesting Evidence Convergence Engine...');
  const mockFamilies = {
    familyA_Predictability: { available: true, clicheScore: 90 },
    familyB_Burstiness: { available: true, signalScore: 85 },
    familyC_TokenDist: { available: true, score: 95 },
    familyD_ML: { available: true, results: { 'roberta': { modelAvailable: true, probability: 92 } } },
    familyE_Semantic: { available: true, aiPatternSignal: 88 },
    familyG_Integrity: { available: true, score: 100, preprocessed: { wordCount: 300 } }
  };
  
  const result = computeEvidenceConvergence(mockFamilies);
  assert(result.aiLikelihood > 85, 'Correctly converges highly agreeable AI signals');
  assert(result.confidence > 80, 'Confidence is high when evidence coverage is full and agreement is high');
  assert(result.classification === 'likely_ai', 'Classifies as likely AI');

  const mockDisagree = {
    ...mockFamilies,
    familyA_Predictability: { available: true, clicheScore: 10 },
    familyB_Burstiness: { available: true, signalScore: 20 },
  };
  
  const disagreeResult = computeEvidenceConvergence(mockDisagree);
  assert(disagreeResult.confidence < result.confidence, 'Confidence drops under high disagreement');
  assert(disagreeResult.classification === 'mixed_signals' || disagreeResult.evidenceAgreement < 60, 'Identifies mixed signals/disagreement');

  console.log(`\nResults: ${passed} / ${total} Passed`);
  process.exit(passed === total ? 0 : 1);
}

runUnitTests();
