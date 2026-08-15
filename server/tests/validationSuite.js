import { detectAITextEnsemble } from '../services/detector/detectorEngine.js';
import { calibrateEnsemble } from '../services/detector/calibrationService.js';
import { BENCHMARK_DATA } from './datasets/benchmarkData.js';

// Dummy chalk to avoid module errors without installing
const chalk = {
  bold: { blue: (s) => s },
  blue: (s) => s,
  red: (s) => s,
  green: (s) => s,
  yellow: (s) => s
};
chalk.bold = Object.assign((s) => s, chalk.bold);
chalk.green.bold = (s) => s;
chalk.yellow.bold = (s) => s;

async function runBenchmark() {
  console.log(chalk.bold.blue('=================================================='));
  console.log(chalk.bold.blue('   SCRIBECRAFT AI - FINAL VALIDATION AUDIT V5     '));
  console.log(chalk.bold.blue('==================================================\n'));

  let fp = 0; // Human scored > 50%
  let fn = 0; // AI scored < 50%
  let totalAI = 0;
  let totalHuman = 0;
  
  console.log(chalk.bold('1. GENERALIZATION & OVERFITTING TEST'));
  console.log('--------------------------------------------------');
  
  for (const item of BENCHMARK_DATA) {
    if (item.label === 'AI') totalAI++;
    if (item.label === 'Human') totalHuman++;
    
    // Pass sensitivityMode Balanced. Ensure no ML cache collision
    const res = await detectAITextEnsemble(item.text, { sensitivityMode: 'Balanced', enableDiagnosticTrace: false });
    
    let color = chalk.white;
    if (item.label === 'AI') {
      if (res.aiLikelihood < 50) { fn++; color = chalk.red; }
      else color = chalk.green;
    } else if (item.label === 'Human') {
      if (res.aiLikelihood > 50) { fp++; color = chalk.red; }
      else color = chalk.green;
    } else {
      color = chalk.yellow;
    }
    
    console.log(`[${item.domain}] (${item.label}) - Score: ${color(res.aiLikelihood + '%')} | Confidence: ${res.confidence}`);
  }

  console.log('\n--------------------------------------------------');
  console.log(chalk.bold('2. MOCK BUG REGRESSION TEST'));
  console.log('--------------------------------------------------');

  // Test: If rule score is 69%, but ML is "offline", it must return 69% exactly.
  // We simulate this by passing mlResults as { fallbackMode: true } directly to calibrationService
  
  const mockSignals = {
    genericness: { signalScore: 20 },
    interchangeability: { signalScore: 10 },
    encyclopedicVoice: { signalScore: 10 },
    topicPattern: { patternMatchScore: 85 }, // driving discourse high
    contentStyle: { styleScore: 10 },
    predictability: { signalScore: 10 },
    authorFingerprint: { signalScore: 80 },
    humanEvidence: { evidenceScore: 10 }
  };
  
  const mlResultsOffline = { fallbackMode: true };
  const mlResultsMockLeak = { 
    results: { 'roberta_base': { calibrated_probability: 0.12 } },
    is_ood: false,
    ood_score: 0.5
  };

  const offlineRes = calibrateEnsemble(mockSignals, 88, null, mlResultsOffline, false, 'Balanced');
  
  console.log('Test A: ML Offline Fallback');
  console.log(`Expected Score: 69%`);
  console.log(`Actual Score: ${offlineRes.aiLikelihood}%`);
  if (offlineRes.aiLikelihood === 69 && !offlineRes.isMlActive) {
    console.log(chalk.green('✓ PASS: Offline gracefully falls back to Rule Engine.'));
  } else {
    console.log(chalk.red('✗ FAIL: Offline fallback did not match expected rule score.'));
  }
  
  // NOTE: If mlResultsMockLeak gets passed in but we have explicitly removed the mock generator
  // from ml-detector-client, that's handled at the client level.
  // We can just verify the client throws or returns fallback mode.
  
  const { detectAIWithML } = await import('../services/ml-detector-client.js');
  const mlClientRes = await detectAIWithML("This is a test text that is long enough to bypass the length check absolutely securely.", ["roberta_base"]);
  
  console.log('\nTest B: Mock Leak Prevention');
  console.log('Expected: fallbackMode: true (since python server is offline locally)');
  if (mlClientRes.fallbackMode === true) {
     console.log(chalk.green('✓ PASS: ml-detector-client correctly failed to fallbackMode without leaking mock values.'));
  } else {
     console.log(chalk.red('✗ FAIL: ml-detector-client returned data when it should have failed (or Python server is actually running!).'));
  }

  console.log('\n--------------------------------------------------');
  console.log(chalk.bold('REPORT METRICS'));
  console.log(`Total AI: ${totalAI} | False Negatives: ${fn}`);
  console.log(`Total Human: ${totalHuman} | False Positives: ${fp}`);
  
  if (fn === 0 && fp === 0) {
    console.log(chalk.green.bold('\nSUCCESS: ZERO FALSE POSITIVES / FALSE NEGATIVES ON VALIDATION SUITE.'));
  } else {
    console.log(chalk.yellow.bold('\nWARNING: VALIDATION SUITE COMPLETED WITH ERRORS.'));
  }
}

runBenchmark().catch(console.error);
