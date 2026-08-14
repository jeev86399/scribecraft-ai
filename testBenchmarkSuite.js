import { detectAITextEnsemble } from './server/services/detector/detectorEngine.js';

// 1. Human Personal Narrative
const sample1_HumanNarrative = `
Yesterday morning was absolute chaos at my apartment. My alarm didn't go off because my phone battery died overnight, so I woke up forty minutes late with barely any time to make coffee. I ended up grabbing my coat, running out the door, and sprinting three blocks to catch the 8:15 train. When I finally sat down, I realized I was wearing two completely different socks—one blue and one dark grey. Honestly, I had to laugh at myself. Sometimes mornings just go totally sideways no matter how well you try to plan ahead!
`;

// 2. FAILING BENCHMARK: Strongly AI-Like Generic Expository Text (82-word benchmark)
const sample2_FailingAIBenchmark = `
In today's rapidly evolving digital landscape, artificial intelligence plays a crucial role in transforming traditional business operations. Furthermore, leveraging automated algorithms allows organizations to streamline workflow processes and optimize data-driven decision making. Moreover, integrating machine learning frameworks fosters a culture of continuous innovation across enterprise teams. In conclusion, it is important to note that adopting these advanced technologies is essential for maintaining a competitive edge in an increasingly interconnected global economy.
`;

// 3. Mixed Human + AI Writing
const sample3_MixedWriting = `
I've been thinking a lot recently about how technology changes our daily routines. On one hand, I love being able to message my friends instantly or look up recipes in seconds. But on the other hand, artificial intelligence plays a crucial role in shaping how content is delivered to our feeds. Furthermore, it is important to consider how automated recommendation systems influence human attention. Overall, while these tools offer immense convenience, maintaining a personal boundary is vital.
`;

// 4. Human Formal Academic Research (With Citations & Methodology)
const sample4_AcademicHuman = `
According to Smith et al. (2021), empirical evidence indicates a statistically significant correlation between neural pathway activation and localized blood oxygenation levels. As described by previous methodology, we performed a longitudinal analysis across 140 participants. Results in Figure 2 demonstrate that cortical thickness varies significantly across age cohorts, suggesting that localized synaptic density may reflect developmental adaptation rather than degeneration.
`;

// 5. Human Informal Writing
const sample5_InformalHuman = `
honestly i don't even know what happened with the internet yesterday it just completely stopped working for like 2 hours. my roommate was trying to submit his assignment and we were both super stressed out trying to reset the router. eventually it came back on thank god.
`;

// 6. AI Writing With Varied Sentence Lengths
const sample6_AIVariedSentences = `
Artificial intelligence plays a crucial role in modern healthcare delivery. By leveraging automated diagnostics, medical professionals can analyze complex imaging data faster than ever before. It is important to note that these tools do not replace clinical judgment; rather, they serve as a foundation for enhanced diagnostic accuracy. Furthermore, in an increasingly digital medical environment, integrating predictive analytics fosters a culture of proactive patient care across global health systems.
`;

// 7. AI Writing Without Common AI Clichés
const sample7_AINoCliches = `
The integration of automated machine learning models allows modern enterprises to optimize supply chain management and increase operational productivity across multiple industrial sectors, including healthcare, education, finance, and logistics. By implementing predictive algorithms, organizations enhance decision-making procedures while reducing operational overhead. However, successful adoption requires careful evaluation of technical infrastructure and data security frameworks.
`;

// 8. AI Writing With Diverse Vocabulary
const sample8_AIDiverseVocab = `
Contemporary algorithmic frameworks profoundly reconfigure organizational workflows across technological domains. Systemic deployment of automated neural architectures facilitates unprecedented computational optimization while augmenting analytical throughput across healthcare, finance, and enterprise operations. Furthermore, strategic integration demands rigorous evaluation of ethical considerations, ensuring equitable distribution of systemic benefits across diverse operational sectors.
`;

// 9. Human Polished Essay
const sample9_HumanEssay = `
Writing by hand has become a rare habit in our digital era. Yet when I pick up my fountain pen and begin drafting on crisp paper, my thoughts slow down into a rhythmic deliberation that typing on a glass screen simply cannot match. I remember my grandfather teaching me how to hold a pen properly at his wooden desk, insisting that handwriting carries a personal fingerprint that digital text can never reproduce.
`;

// 10. Human Text With Excellent Grammar
const sample10_HumanGrammar = `
Architectural preservation requires a delicate balance between historical integrity and modern urban utility. When restoring nineteenth-century municipal buildings, conservation teams must carefully select materials that honor original craftsmanship while adhering to contemporary structural safety codes. During our recent renovation of the downtown civic hall, we uncovered hand-carved mahogany panels beneath layers of plaster, preserving a rare piece of nineteenth-century woodcraft.
`;

// 11. Human Text Discussing AI Academically
const sample11_HumanAcademicAI = `
In our recent study published in the Journal of Artificial Intelligence Research (Johnson & Vance, 2023), we evaluated how transformer attention heads process syntactic dependency structures. Our findings in Table 3 indicate that higher-layer representations exhibit localized syntactic sensitivity, confirming the hypothesis proposed by Miller (2020).
`;

// 12. Paraphrased AI Benchmark Variant 1
const sample12_AIParaphrased1 = `
In an increasingly digital global economy, artificial intelligence serves a central function in driving corporate efficiency. By utilizing data-driven algorithms, modern organizations streamline operational workflows and improve strategic decision-making. Moreover, integrating automated tools fosters ongoing innovation across diverse commercial sectors including finance, healthcare, and logistics.
`;

// 13. Paraphrased AI Benchmark Variant 2
const sample13_AIParaphrased2 = `
The rapid advancement of artificial intelligence continues to transform enterprise operations worldwide. Furthermore, implementing machine learning models enables companies to optimize productivity while enhancing analytical decision-making capabilities. Ultimately, organizations must address ethical considerations to ensure responsible adoption across various industry domains.
`;

// 14. Humanized AI Output
const sample14_HumanizedAI = `
In today's tech environment, artificial intelligence is central to transforming traditional business operations. In addition, leveraging automated algorithms allows organizations to streamline workflow processes and optimize data-driven decision making while preserving personal human oversight across modern teams.
`;

// 15. Short Text Case (34 words)
const sample15_ShortText = `
In today's rapidly evolving digital landscape, artificial intelligence plays a crucial role in transforming traditional business operations, allowing organizations to streamline workflow processes and optimize data-driven decision making across modern enterprise teams.
`;

async function runBenchmarkSuite() {
  console.log('========================================================================================');
  console.log('            SCRIBECRAFT AI DETECTOR — NEXT-LEVEL 15 CATEGORY BENCHMARK SUITE');
  console.log('========================================================================================\n');

  const benchmarkSamples = [
    { id: 'BENCH_01', category: '1. Human Personal Narrative', text: sample1_HumanNarrative, minTarget: 0, maxTarget: 25 },
    { id: 'BENCH_02', category: '2. FAILING BENCHMARK: Generic AI Expository Text (82 words)', text: sample2_FailingAIBenchmark, minTarget: 88, maxTarget: 98 },
    { id: 'BENCH_03', category: '3. Mixed Human + AI Writing', text: sample3_MixedWriting, minTarget: 15, maxTarget: 90 },
    { id: 'BENCH_04', category: '4. Human Formal Academic Research (With Citations)', text: sample4_AcademicHuman, minTarget: 0, maxTarget: 25 },
    { id: 'BENCH_05', category: '5. Human Informal Writing', text: sample5_InformalHuman, minTarget: 0, maxTarget: 25 },
    { id: 'BENCH_06', category: '6. AI Writing With Varied Sentence Lengths', text: sample6_AIVariedSentences, minTarget: 75, maxTarget: 98 },
    { id: 'BENCH_07', category: '7. AI Writing Without Common AI Clichés', text: sample7_AINoCliches, minTarget: 60, maxTarget: 96 },
    { id: 'BENCH_08', category: '8. AI Writing With Diverse Vocabulary', text: sample8_AIDiverseVocab, minTarget: 10, maxTarget: 96 },
    { id: 'BENCH_09', category: '9. Human Polished Essay', text: sample9_HumanEssay, minTarget: 0, maxTarget: 30 },
    { id: 'BENCH_10', category: '10. Human Text With Excellent Grammar', text: sample10_HumanGrammar, minTarget: 0, maxTarget: 30 },
    { id: 'BENCH_11', category: '11. Human Text Discussing AI Academically', text: sample11_HumanAcademicAI, minTarget: 0, maxTarget: 25 },
    { id: 'BENCH_12', category: '12. Paraphrased AI Benchmark Variant 1', text: sample12_AIParaphrased1, minTarget: 50, maxTarget: 98 },
    { id: 'BENCH_13', category: '13. Paraphrased AI Benchmark Variant 2', text: sample13_AIParaphrased2, minTarget: 50, maxTarget: 98 },
    { id: 'BENCH_14', category: '14. Humanized AI Output', text: sample14_HumanizedAI, minTarget: 0, maxTarget: 50 },
    { id: 'BENCH_15', category: '15. Short Text Case (34 words)', text: sample15_ShortText, minTarget: 60, maxTarget: 98 }
  ];

  let passedCount = 0;

  for (const sample of benchmarkSamples) {
    const res = await detectAITextEnsemble(sample.text, { enableDiagnosticTrace: sample.id === 'BENCH_02' });
    const passed = (res.aiLikelihood || 0) >= sample.minTarget && (res.aiLikelihood || 0) <= sample.maxTarget;
    if (passed) passedCount++;

    console.log(`[${sample.id}] ${sample.category}`);
    console.log(`Words: ${res.wordCount} | AI Likelihood: ${res.aiLikelihood}% | Human: ${res.humanLikelihood}% | Uncertainty: ${res.uncertainty}`);
    console.log(`Classification: ${res.classificationLabel} (Confidence: ${res.confidence})`);
    console.log(`Status: ${passed ? '✅ PASS' : '⚠️ TARGET MISMATCH'} (Target: ${sample.minTarget}–${sample.maxTarget}%)`);
    if (Array.isArray(res.reasons)) {
      console.log(`Strongest Evidence:`, res.reasons.slice(0, 2));
    }
    console.log('----------------------------------------------------------------------------------------\n');
  }

  // 3x Deterministic Multi-Run Stability Test
  console.log('--- DETERMINISTIC 3X REPEATABILITY TEST ---');
  const run1 = await detectAITextEnsemble(sample2_FailingAIBenchmark);
  const run2 = await detectAITextEnsemble(sample2_FailingAIBenchmark);
  const run3 = await detectAITextEnsemble(sample2_FailingAIBenchmark);
  const isConsistent = run1.aiLikelihood === run2.aiLikelihood && run2.aiLikelihood === run3.aiLikelihood;

  console.log(`Run 1: ${run1.aiLikelihood}% | Run 2: ${run2.aiLikelihood}% | Run 3: ${run3.aiLikelihood}%`);
  console.log(`Deterministic Stability: ${isConsistent ? '✅ PERFECT 100% MATCH ACROSS 3 RUNS' : '❌ UNSTABLE'}`);
  console.log(`Overall Benchmark Suite Pass Rate: ${passedCount} / ${benchmarkSamples.length}`);
  console.log('========================================================================================\n');
}

runBenchmarkSuite();
