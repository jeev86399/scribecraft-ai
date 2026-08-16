import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { detectAITextEnsemble } from '../server/services/detector/detectorEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runBenchmark() {
  console.log('Running V2.0 Detector Benchmarks...');
  
  const testCases = [
    {
      name: "Short Human Text",
      text: "I went to the store today to buy some milk and eggs. It was raining heavily."
    },
    {
      name: "Longer AI Text",
      text: "The rapid advancements in artificial intelligence have fundamentally reshaped modern society. In conclusion, it is important to remember that these tools are dual-use. On the one hand, they offer unprecedented efficiency. On the other hand, they pose significant ethical challenges. Therefore, we must proceed with caution and implement robust regulatory frameworks to ensure equitable outcomes for all stakeholders."
    },
    {
      name: "Longer Human Text",
      text: "When I was a kid, my dad used to take me fishing every single weekend without fail. I remember one time we caught this massive bass, probably the biggest fish I've ever seen in my life. The line snapped right as we got it to the boat, but I swear it looked like a monster. We still laugh about it to this day because neither of us could believe our eyes."
    },
    {
      name: "Ahrefs AI Paragraph",
      text: "Doomsday often evokes a sense of impending catastrophe, stirring both fear and fascination in people's minds. It represents a time when the world as we know it could face significant upheaval, whether through natural disasters, societal collapse, or other catastrophic events. This concept has been explored in various cultures and religions, each offering unique interpretations and predictions about the end of days. While some view it as a moment of reckoning, others see it as an opportunity for renewal and transformation. Regardless of the perspective, the idea of doomsday prompts us to reflect on our values, our planet, and the legacy we leave behind."
    }
  ];

  for (const tc of testCases) {
    console.log(`\n--- Testing: ${tc.name} ---`);
    const result = await detectAITextEnsemble(tc.text);
    console.log(JSON.stringify(result.result, null, 2));
  }
}

runBenchmark().catch(console.error);
