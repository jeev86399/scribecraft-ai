import { config } from 'dotenv';
config();

import { humanizeTextService } from './services/humanizerService.js';

const benchmarks = [
  {
    name: "AI Generic Expository",
    text: "Artificial intelligence is rapidly transforming industries across the world by improving efficiency, streamlining workflow processes, and optimizing data-driven decision making. In today's rapidly evolving digital landscape, it is essential to leverage these synergies to stay competitive."
  },
  {
    name: "AI Social Media",
    text: "Creating an engaging Instagram post requires a blend of captivating visuals and compelling text. Begin by selecting a striking image that resonates with your audience. Taking a break to foster connections with followers is a vital component of brand success."
  },
  {
    name: "Human Technical Writing with Dates and Numbers",
    text: "The Apollo 11 mission landed on the Moon on July 20, 1969. Commander Neil Armstrong and lunar module pilot Buzz Aldrin formed the American crew that landed the Apollo Lunar Module Eagle. They spent about 21 hours and 36 minutes on the lunar surface before lifting off to rejoin Michael Collins in the Columbia command module."
  }
];

async function runTests() {
  console.log("Starting Humanizer Generalization Test Suite...");
  for (let i = 0; i < benchmarks.length; i++) {
    console.log(`\n========================================`);
    console.log(`TEST ${i + 1}: ${benchmarks[i].name}`);
    console.log(`========================================`);
    console.log(`ORIGINAL: ${benchmarks[i].text}\n`);
    
    try {
      const result = await humanizeTextService(benchmarks[i].text, 'natural');
      
      if (result.error) {
        console.error("ERROR:", result.error);
        continue;
      }
      
      console.log(`\nHUMANIZED: ${result.humanizedText}`);
      console.log(`\nBEFORE: ${result.beforeScore.aiLikelihood}% AI`);
      console.log(`AFTER:  ${result.afterScore.aiLikelihood}% AI`);
      console.log(`DELTA:  ${result.scoreDelta} points`);
      console.log(`LIMITED: ${result.isLimitedTransformation}`);
    } catch (e) {
      console.error("Failed to run test:", e);
    }
  }
}

runTests();
