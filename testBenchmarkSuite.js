import { detectAITextEnsemble } from './server/services/detector/detectorEngine.js';

// Category A: Human Personal Narrative
const sampleA_HumanNarrative = `
Yesterday morning was absolute chaos at my apartment. My alarm didn't go off because my phone battery died overnight, so I woke up forty minutes late with barely any time to make coffee. I ended up grabbing my coat, running out the door, and sprinting three blocks to catch the 8:15 train. When I finally sat down, I realized I was wearing two completely different socks—one blue and one dark grey. Honestly, I had to laugh at myself. Sometimes mornings just go totally sideways no matter how well you try to plan ahead!
`;

// Category B: Strongly AI-Like Generic Polished Expository Writing
const sampleB_GenericAI = `
In today's rapidly evolving digital landscape, artificial intelligence plays a crucial role in transforming traditional business operations. Furthermore, leveraging automated algorithms allows organizations to streamline workflow processes and optimize data-driven decision making. Moreover, integrating machine learning frameworks fosters a culture of continuous innovation across enterprise teams.

In conclusion, it is important to note that adopting these advanced technologies is essential for maintaining a competitive edge in an increasingly interconnected global economy. Furthermore, by leveraging cloud platforms, businesses can seamlessly scale their digital infrastructure while maintaining optimal efficiency. As technology continues to evolve, organizations must remain adaptable to capitalize on emerging opportunities.
`;

// Category C: Mixed Human + AI Edited Writing
const sampleC_MixedWriting = `
I've been thinking a lot recently about how technology changes our daily routines. On one hand, I love being able to message my friends instantly or look up recipes in seconds. But on the other hand, artificial intelligence plays a crucial role in shaping how content is delivered to our feeds. Furthermore, it is important to consider how automated recommendation systems influence human attention. Overall, while these tools offer immense convenience, maintaining a personal boundary is vital.
`;

// Category D: Human Formal Academic Writing (With citations & technical domain terms)
const sampleD_AcademicHuman = `
According to Smith et al. (2021), empirical evidence indicates a statistically significant correlation between neural pathway activation and localized blood oxygenation levels. As described by previous methodology, we performed a longitudinal analysis across 140 participants. Results in Figure 2 demonstrate that cortical thickness varies significantly across age cohorts, suggesting that localized synaptic density may reflect developmental adaptation rather than degeneration.
`;

// Category E: Human Informal Writing With Errors
const sampleE_InformalHuman = `
honestly i don't even know what happened with the internet yesterday it just completely stopped working for like 2 hours. my roommate was trying to submit his assignment and we were both super stressed out trying to reset the router. eventually it came back on thank god.
`;

// Category F: AI Writing With Varied Sentence Lengths
const sampleF_AIVariedSentences = `
Artificial intelligence plays a crucial role in modern healthcare delivery. By leveraging automated diagnostics, medical professionals can analyze complex imaging data faster than ever before. It is important to note that these tools do not replace clinical judgment; rather, they serve as a foundation for enhanced diagnostic accuracy. Furthermore, in an increasingly digital medical environment, integrating predictive analytics fosters a culture of proactive patient care across global health systems.
`;

async function runBenchmarkSuite() {
  console.log('========================================================================================');
  console.log('                       SCRIBECRAFT AI DETECTOR - BENCHMARK SUITE');
  console.log('========================================================================================\n');

  const benchmarkSamples = [
    { id: 'CAT_A', category: 'Category A: Human Personal Narrative', text: sampleA_HumanNarrative, minTarget: 0, maxTarget: 35 },
    { id: 'CAT_B', category: 'Category B: Strongly AI-Like Expository Text', text: sampleB_GenericAI, minTarget: 75, maxTarget: 98 },
    { id: 'CAT_C', category: 'Category C: Mixed Human + AI Writing', text: sampleC_MixedWriting, minTarget: 40, maxTarget: 75 },
    { id: 'CAT_D', category: 'Category D: Human Formal Academic Writing', text: sampleD_AcademicHuman, minTarget: 0, maxTarget: 35 },
    { id: 'CAT_E', category: 'Category E: Human Informal Writing', text: sampleE_InformalHuman, minTarget: 0, maxTarget: 30 },
    { id: 'CAT_F', category: 'Category F: AI Writing With Varied Sentences', text: sampleF_AIVariedSentences, minTarget: 70, maxTarget: 95 }
  ];

  let passedCount = 0;

  for (const sample of benchmarkSamples) {
    const res = await detectAITextEnsemble(sample.text);
    const passed = res.aiLikelihood >= sample.minTarget && res.aiLikelihood <= sample.maxTarget;
    if (passed) passedCount++;

    console.log(`[${sample.id}] ${sample.category}`);
    console.log(`Words: ${res.wordCount} | AI Likelihood: ${res.aiLikelihood}% | Human: ${res.humanLikelihood}% | Uncertainty: ${res.uncertainty}`);
    console.log(`Classification: ${res.classificationLabel} (Confidence: ${res.confidence})`);
    console.log(`Status: ${passed ? '✅ PASS' : '⚠️ TARGET MISMATCH'} (Target: ${sample.minTarget}–${sample.maxTarget}%)`);
    console.log(`Strongest Evidence:`, res.reasons.slice(0, 2));
    console.log('----------------------------------------------------------------------------------------\n');
  }

  // Multi-Run Deterministic Stability Test
  console.log('--- DETERMINISTIC MULTI-RUN CONSISTENCY TEST ---');
  const run1 = await detectAITextEnsemble(sampleB_GenericAI);
  const run2 = await detectAITextEnsemble(sampleB_GenericAI);
  const isConsistent = run1.aiLikelihood === run2.aiLikelihood && run1.humanLikelihood === run2.humanLikelihood;

  console.log(`Run 1 Score: ${run1.aiLikelihood}% | Run 2 Score: ${run2.aiLikelihood}%`);
  console.log(`Deterministic Result: ${isConsistent ? '✅ PERFECT 100% MATCH' : '❌ UNSTABLE'}`);
  console.log(`Overall Benchmark Pass Rate: ${passedCount} / ${benchmarkSamples.length}`);
  console.log('========================================================================================\n');
}

runBenchmarkSuite();
