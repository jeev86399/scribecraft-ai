import { detectAITextEnsemble } from './server/services/detector/detectorEngine.js';

const BENCHMARK_DATA = [
  // AI-STYLE (Expect High AI Likelihood)
  { domain: 'Technology (AI)', text: 'Artificial intelligence is rapidly transforming industries across the world by improving efficiency, streamlining workflow processes and optimize data-driven decision making. It serves as a vital tool in today\'s rapidly evolving digital landscape, making it essential to adapt to these changes to promote overall success.', expected: 'AI' },
  { domain: 'Technology (Cybersecurity)', text: 'Cybersecurity plays a crucial role in protecting digital assets. Organizations must rapidly adapt to mitigate threats, offering a way to safeguard sensitive information. Ultimately, robust protocols foster a secure environment.', expected: 'AI' },
  { domain: 'Daily Life (Lunch)', text: 'Lunch serves as a vital midday meal, providing an opportunity to refuel and recharge for the remainder of the day. It often includes a variety of options, from light salads to hearty sandwiches, catering to diverse tastes and dietary needs. Taking a break for lunch not only nourishes the body but also offers a chance to socialize, fostering connections with colleagues or friends.', expected: 'AI' },
  { domain: 'Daily Life (Pets)', text: 'Pets offer a chance to experience unconditional love. Caring for a pet provides an opportunity to foster responsibility. A diverse range of animals, from dogs to cats, cater to different lifestyles, promoting overall well-being.', expected: 'AI' },
  { domain: 'Education (Generic)', text: 'Continuous learning plays an essential role in personal development. Education not only expands the mind but also provides the ability to navigate a rapidly evolving digital landscape, making it crucial to embrace lifelong learning.', expected: 'AI' },
  { domain: 'Business (Generic)', text: 'Effective leadership serves as a pivotal factor in organizational success. By fostering a collaborative environment, leaders provide a way to enhance productivity. Furthermore, strategic planning is essential to promote general growth.', expected: 'AI' },
  { domain: 'Health (Generic)', text: 'Regular exercise serves as a key component of a healthy lifestyle. It not only strengthens the cardiovascular system but also promotes overall well-being. Furthermore, a balanced diet provides the necessary nutrients, making it vital to maintain good habits.', expected: 'AI' },
  
  // HUMAN-STYLE (Expect Low AI Likelihood)
  { domain: 'Human Writing (Tech)', text: 'I spent three hours trying to debug this React component yesterday. It turns out I was mutating state directly inside the useEffect hook, which caused an infinite re-render loop. Honestly it\'s exactly what I need to remind myself to read the docs.', expected: 'Human' },
  { domain: 'Human Writing (Food)', text: 'I usually get the super greasy burger down by 4th street on a Friday. Last week they forgot the pickles, but this morning I went back and the owner gave me a free side of fries to make up for it.', expected: 'Human' },
  { domain: 'Human Writing (Travel)', text: 'My favorite part of the trip was definitely the train ride from Kyoto to Osaka. I tried to grab a window seat, but it was completely packed. Still, the view of the mountains earlier today was completely worth the sore legs.', expected: 'Human' },
  { domain: 'Human Writing (Work)', text: 'I finally just told my boss that the Q3 timeline is completely rogue. We can\'t ship the new database migration and the frontend rewrite simultaneously without the staging server catching on fire.', expected: 'Human' }
];

async function runBenchmark() {
  console.log("=========================================");
  console.log(" MULTI-DOMAIN AI DETECTOR BENCHMARK V4");
  console.log("=========================================\n");

  let passed = 0;
  let falsePositives = 0;
  let falseNegatives = 0;

  for (const item of BENCHMARK_DATA) {
    const result = await detectAITextEnsemble(item.text, { enableDiagnosticTrace: false });
    const aiScore = result.aiLikelihood;
    
    // Stricter Evaluation Bounds for V4:
    // AI text MUST score >= 70
    // Human text MUST score <= 30
    let isPass = false;
    if (item.expected === 'AI' && aiScore >= 70) isPass = true;
    if (item.expected === 'Human' && aiScore <= 30) isPass = true;

    if (isPass) {
      passed++;
      console.log(`[PASS] ${item.domain}`);
    } else {
      console.log(`[FAIL] ${item.domain}`);
      if (item.expected === 'Human') falsePositives++;
      else falseNegatives++;
    }
    
    console.log(`Expected: ${item.expected}`);
    console.log(`Score: ${aiScore}% AI Likelihood (${result.classificationLabel})`);
    console.log(`Confidence: ${result.confidence} | Uncertainty: ${result.uncertainty}`);
    if (result.reasons && result.reasons.length > 0) {
      console.log(`Top Reason: ${result.reasons[0]}`);
    }
    console.log("-----------------------------------------");
  }

  console.log(`\nRESULTS: ${passed}/${BENCHMARK_DATA.length} Passed`);
  console.log(`False Positives (Human text flagged as AI): ${falsePositives}`);
  console.log(`False Negatives (AI text flagged as Human): ${falseNegatives}`);
  
  if (passed === BENCHMARK_DATA.length) {
    console.log("SUCCESS: V4 Calibration perfectly generalizes across domains.");
  } else {
    console.log("WARNING: V4 Calibration requires adjustment.");
    process.exit(1);
  }
}

runBenchmark().catch(console.error);
