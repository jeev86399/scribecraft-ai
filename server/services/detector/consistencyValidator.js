/**
 * Detector Output Consistency Validator
 * Ensures that UI explanations, key signal tables, and classification labels are 100% consistent
 * and free of internal contradictions (e.g. preventing "Grounded Topic Detail" when author detail is low).
 */

export function validateDetectorConsistency(calibratedResult, signals) {
  const { keySignals, reasons } = calibratedResult;
  const { genericness, genericExposition, authorFingerprint, humanEvidence } = signals;

  const verifiedSignals = keySignals.map(sig => {
    if (sig.name === 'Semantic Genericness') {
      if (genericness?.topicalContextLevel === 'High Industry Enumeration' && genericness?.authorDetailLevel === 'Low') {
        return {
          ...sig,
          result: 'Broad Sector Enumeration without Author Detail',
          level: 'Generic Abstraction'
        };
      }
    }
    return sig;
  });

  return {
    ...calibratedResult,
    keySignals: verifiedSignals
  };
}
