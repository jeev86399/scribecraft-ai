import { detectAITextEnsemble } from './detector/detectorEngine.js';

export async function detectAITextService(text) {
  return await detectAITextEnsemble(text);
}
