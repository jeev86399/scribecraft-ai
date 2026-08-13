import { detectAITextEnsemble } from './server/services/detector/detectorEngine.js';

const categoryA_Human = `
Yesterday morning was absolute chaos at my apartment. My alarm didn't go off because my phone battery died overnight, so I woke up forty minutes late with barely any time to make coffee. I ended up grabbing my coat, running out the door, and sprinting three blocks to catch the 8:15 train. When I finally sat down, I realized I was wearing two completely different socks—one blue and one dark grey. Honestly, I had to laugh at myself. Sometimes mornings just go totally sideways no matter how well you try to plan ahead!
`;

const categoryB_AI_Long = `
In today's rapidly evolving digital landscape, artificial intelligence plays a crucial role in transforming traditional business operations. Furthermore, leveraging automated algorithms allows organizations to streamline workflow processes and optimize data-driven decision making. Moreover, integrating machine learning frameworks fosters a culture of continuous innovation across enterprise teams.

In conclusion, it is important to note that adopting these advanced technologies is essential for maintaining a competitive edge in an increasingly interconnected global economy. Furthermore, by leveraging cloud platforms, businesses can seamlessly scale their digital infrastructure while maintaining optimal efficiency. As technology continues to evolve, organizations must remain adaptable to capitalize on emerging opportunities.
`;

const categoryC_Mixed = `
I've been thinking a lot recently about how technology changes our daily routines. On one hand, I love being able to message my friends instantly or look up recipes in seconds. But on the other hand, artificial intelligence plays a crucial role in shaping how content is delivered to our feeds. Furthermore, it is important to consider how automated recommendation systems influence human attention. Overall, while these tools offer immense convenience, maintaining a personal boundary is vital.
`;

async function runScenarioTests() {
  console.log('====================================================');
  console.log('   SCRIBECRAFT AI DETECTOR - SCENARIO ACCURACY TEST');
  console.log('====================================================\n');

  console.log('--- CATEGORY A: Human Personal Narrative ---');
  const resA = await detectAITextEnsemble(categoryA_Human);
  console.log(`Word Count: ${resA.wordCount}`);
  console.log(`AI Likelihood: ${resA.aiLikelihood}% (${resA.classificationLabel})`);
  console.log(`Confidence: ${resA.confidence}`);
  console.log(`Key Reasons:`, resA.reasons);
  console.log('\n--------------------------------------------\n');

  console.log('--- CATEGORY B: Highly Polished / Multi-Paragraph AI Text ---');
  const resB = await detectAITextEnsemble(categoryB_AI_Long);
  console.log(`Word Count: ${resB.wordCount}`);
  console.log(`AI Likelihood: ${resB.aiLikelihood}% (${resB.classificationLabel})`);
  console.log(`Confidence: ${resB.confidence}`);
  console.log(`Key Reasons:`, resB.reasons);
  console.log('\n--------------------------------------------\n');

  console.log('--- CATEGORY C: Mixed Writing ---');
  const resC = await detectAITextEnsemble(categoryC_Mixed);
  console.log(`Word Count: ${resC.wordCount}`);
  console.log(`AI Likelihood: ${resC.aiLikelihood}% (${resC.classificationLabel})`);
  console.log(`Confidence: ${resC.confidence}`);
  console.log(`Key Reasons:`, resC.reasons);
  console.log('\n====================================================\n');

  // Test Deterministic Stability across 2 consecutive runs
  console.log('--- CONSISTENCY TEST (Deterministic Repeat Run on Cat B) ---');
  const resB_repeat = await detectAITextEnsemble(categoryB_AI_Long);
  console.log(`Run 1 Score: ${resB.aiLikelihood}%, Run 2 Score: ${resB_repeat.aiLikelihood}%`);
  if (resB.aiLikelihood === resB_repeat.aiLikelihood) {
    console.log('✨ Deterministic Consistency PASS: Exact identical output generated!');
  } else {
    console.log('⚠️ Variance detected!');
  }
}

runScenarioTests();
