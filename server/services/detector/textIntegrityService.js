/**
 * Text Integrity & Normalization Service (Family G)
 * 
 * Pre-processes text safely, detects adversarial noise, zero-width characters, 
 * and homoglyphs before it is passed to the main evidence families.
 */

import { preprocessText } from './textPreprocessor.js';

export function evaluateTextIntegrity(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return {
      available: false,
      reason: 'invalid_input'
    };
  }

  // 1. Original Preservation
  const originalText = rawText;

  // 2. Identify Zero-Width / Invisible Characters
  // Includes ZWSP, ZWNJ, ZWJ, LRM, RLM, BOM, etc.
  const zeroWidthRegex = /[\u200B-\u200D\uFEFF\u200E\u200F]/g;
  const zeroWidthMatches = originalText.match(zeroWidthRegex);
  const zeroWidthCount = zeroWidthMatches ? zeroWidthMatches.length : 0;

  // 3. Identify Suspicious Control Characters (excluding standard \n, \r, \t)
  const controlCharRegex = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
  const controlCharMatches = originalText.match(controlCharRegex);
  const controlCharCount = controlCharMatches ? controlCharMatches.length : 0;

  // 4. Safe Normalization (NFC)
  // Normalizes Unicode sequences to composed characters safely.
  let normalizedText = originalText.normalize('NFC');
  
  // Strip the detected adversarial zero-width characters for analysis
  normalizedText = normalizedText.replace(zeroWidthRegex, '');

  // 5. Homoglyph/Mixed Script Detection (Basic Cyrillic/Greek embedded in Latin)
  // Useful for catching simple bypass attempts.
  const latinCount = (normalizedText.match(/[a-zA-Z]/g) || []).length;
  const cyrillicCount = (normalizedText.match(/[\u0400-\u04FF]/g) || []).length;
  const greekCount = (normalizedText.match(/[\u0370-\u03FF]/g) || []).length;
  
  let mixedScriptWarning = false;
  if (latinCount > 50 && (cyrillicCount > 0 || greekCount > 0)) {
     // If the text is mostly Latin but has sporadic Cyrillic/Greek, it's highly suspicious.
     if ((cyrillicCount + greekCount) / latinCount < 0.1) {
         mixedScriptWarning = true;
     }
  }

  // 6. Leverage existing textPreprocessor for standard NLP tokens
  const preprocessed = preprocessText(normalizedText);

  // 7. Calculate Integrity Score
  // Base 100, penalize for noise.
  let integrityScore = 100;
  let evidence = [];

  if (zeroWidthCount > 0) {
    integrityScore -= Math.min(30, zeroWidthCount * 5);
    evidence.push(`Detected ${zeroWidthCount} invisible/zero-width characters.`);
  }

  if (controlCharCount > 0) {
    integrityScore -= Math.min(20, controlCharCount * 2);
    evidence.push(`Detected ${controlCharCount} suspicious control characters.`);
  }

  if (mixedScriptWarning) {
    integrityScore -= 40;
    evidence.push('Detected suspicious mixed-script characters (potential homoglyph attack).');
  }

  return {
    available: true,
    score: Math.max(0, integrityScore),
    confidence: 95, // Rule-based, high confidence in character counts
    originalTextLength: originalText.length,
    normalizedTextLength: normalizedText.length,
    zeroWidthCount,
    controlCharCount,
    mixedScriptWarning,
    preprocessed, // Expose standard tokens downstream
    evidence
  };
}
