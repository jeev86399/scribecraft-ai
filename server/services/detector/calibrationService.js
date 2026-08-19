/**
 * Probability Calibration Service (V2.0)
 * Applies Platt scaling (or temperature scaling) to raw dynamic fusion scores.
 * Generates confidence intervals and calibrated likelihoods to prevent overconfident
 * extreme scores for uncertain or short texts.
 */

export function calibrateProbability(rawProbability, textLength, standardDeviation) {
  // 1. Temperature Scaling for text length
  // Shorter text means higher temperature (flatter probability, closer to 50%)
  // Base temperature is 1.0 for ~300+ words.
  let temperature = 1.0;
  if (textLength < 30) {
    temperature = 1.4;
  } else if (textLength < 80) {
    temperature = 1.1 + (80 - textLength) / 200;
  }

  // Convert raw 0-100 to logit
  const epsilon = 0.001; // Avoid divide by zero
  const p = Math.max(epsilon, Math.min(100 - epsilon, rawProbability)) / 100;
  const logit = Math.log(p / (1 - p));
  
  // Apply temperature
  const scaledLogit = logit / temperature;
  
  // Convert back to probability
  let calibratedP = 1 / (1 + Math.exp(-scaledLogit));
  
  // 2. Adjust for Disagreement (Standard Deviation of Evidence)
  // If evidence highly disagrees, pull probability slightly towards 50%
  if (standardDeviation > 25) {
      const disagreementPull = Math.min(0.4, (standardDeviation - 25) / 100); 
      calibratedP = (calibratedP * (1 - disagreementPull)) + (0.5 * disagreementPull);
  }

  // Calculate Uncertainty Bound (+/- %)
  let uncertainty = 5; 
  if (textLength < 100) uncertainty += 15;
  else if (textLength < 250) uncertainty += 5;
  
  uncertainty += standardDeviation * 0.5;
  uncertainty = Math.min(35, Math.round(uncertainty));
  
  return {
    calibratedProbability: Math.round(calibratedP * 100),
    uncertainty: uncertainty,
    temperatureUsed: temperature
  };
}
