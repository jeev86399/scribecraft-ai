import { detectAITextEnsemble } from '../services/detector/detectorEngine.js';

async function run() {
  const text = "In this paper, we establish a theoretical bound on the error rate of the stochastic gradient descent (SGD) algorithm when applied to non-convex loss surfaces. Following the methodology proposed by Bottou (2010), we isolate the noise variance parameter sigma. Empirical results from our CIFAR-10 experiments demonstrate that while the theoretical bound holds loosely, practical convergence is significantly faster when learning rate decay is aggressively scaled during the first 50 epochs.";
  const res = await detectAITextEnsemble(text, { sensitivityMode: 'Balanced', enableDiagnosticTrace: true });
  console.log(`Final AI Score: ${res.aiLikelihood}%`);
  console.log(`Final Human Score: ${res.humanLikelihood}%`);
  console.log(`Human Evidence Signal: ${res.metrics.humanEvidence.evidenceScore}`);
}
run().catch(console.error);
