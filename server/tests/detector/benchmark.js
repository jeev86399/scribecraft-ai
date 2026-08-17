import { detectAITextEnsemble } from '../../services/detector/detectorEngine.js';
import { db, initDb } from '../../config/db.js';

const testCases = [
  {
    name: "Pure Generative (ChatGPT Standard)",
    text: "In today's fast-paced digital world, it is crucial to stay ahead of the curve. Furthermore, prioritizing a healthy work-life balance is essential for long-term success. A variety of tools can help us achieve this, offering a unique opportunity to boost productivity. Ultimately, whether it's a new software or a lifestyle change, adapting is key to thriving.",
    expectedClassification: "likely_ai"
  },
  {
    name: "Pure Human (Casual/Personal)",
    text: "So I went to the store yesterday because I totally forgot to buy milk. It was crazy busy, like everyone decided to go shopping at the exact same time. Anyway, I finally got out of there and drove back. The whole thing took like an hour which was super annoying.",
    expectedClassification: "likely_human"
  },
  {
    name: "Mixed Authorship (Human start, AI end)",
    text: "I remember the first time I tried to ride a bike. It was a red Schwinn and I was terrified of falling off. My dad held the seat while I pedaled down the driveway. However, it is vital to recognize that mastering a new skill requires resilience. Creating a structured environment fosters a sense of accomplishment and promotes overall well-being. Ultimately, consistent practice is a crucial component of personal growth.",
    expectedClassification: "mixed_signals"
  },
  {
    name: "Adversarial Paraphrase (AI generated, tweaked by human)",
    text: "In our modern era, keeping up with trends is important. Also, finding a good work-life balance helps a lot. Many tools let us do this better, giving us chances to get more done. In the end, adapting helps you do well.",
    expectedClassification: "uncertain" // Should not be highly confident
  }
];

async function runBenchmark() {
  console.log('--- ScribeCraft AI v2.0 Robustness Benchmark ---');
  await initDb();
  
  let passed = 0;

  for (const tc of testCases) {
    console.log(`\nTesting: ${tc.name}`);
    const result = await detectAITextEnsemble(tc.text);
    
    console.log(`Expected: ${tc.expectedClassification}`);
    console.log(`Actual:   ${result.document.classification}`);
    console.log(`Score:    ${result.document.aiLikelihood}%`);
    console.log(`Conf:     ${result.document.confidence}%`);
    console.log(`Agree:    ${result.document.evidenceAgreement}%`);
    
    if (result.document.classification === tc.expectedClassification || 
       (tc.expectedClassification === 'uncertain' && result.document.confidence < 50)) {
      console.log('✅ PASS');
      passed++;
    } else {
      console.log('❌ FAIL');
    }
  }

  console.log(`\nResults: ${passed} / ${testCases.length} Passed`);
  process.exit(passed === testCases.length ? 0 : 1);
}

runBenchmark().catch(console.error);
