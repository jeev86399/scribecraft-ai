/**
 * Predictability & Cliché Analyzer (Family A)
 * Detects structural templates that are highly predictable in generative AI text.
 * Built for Adversarial Paraphrase Robustness: Looks for abstract rhetorical constructs
 * rather than just exact phrases. Calibrates scores based on text length.
 */

export function analyzePredictability(preprocessed) {
  const { normalizedText, wordCount } = preprocessed;
  if (!normalizedText || wordCount < 30) {
    return {
      available: false,
      reason: 'insufficient_text',
      clicheScore: 0,
      structuralTemplateCount: 0,
      signalScore: 0, // In V2, unavailable is ignored by convergence engine
      rating: 'Uncertain',
      explanation: 'Insufficient text to statistically analyze predictability.'
    };
  }

  const lowerText = normalizedText.toLowerCase();
  
  // Abstract Syntactic Templates (Robust against synonym replacement)
  const STRUCTURAL_TEMPLATES = [
    // The "Action + Vital/Crucial/Important + Noun" pattern
    /\b(serves as|acts as|functions as|plays a|is a) (vital|crucial|essential|key|important|significant|pivotal) (role|tool|meal|aspect|component|part|factor)\b/g,
    
    // The "Action + Opportunity/Chance/Ability + To" pattern
    /\b(providing|offering|creating|giving|presenting) (an opportunity|a chance|the ability|a way) to\b/g,
    
    // The "Not only X but also Y"
    /\bnot only (.*?) but also\b/g,
    
    // The "Making it Adjective to"
    /\b(making it|thus it is) (essential|crucial|important|vital|necessary|critical) to\b/g,
    
    // The "Diverse/Variety" pattern
    /\b(a variety of|a diverse range of|a wide array of|a multitude of|a diverse set of)\b/g,
    
    // The "Catering to" pattern
    /\b(catering to|meeting|addressing) (diverse|various|different) (needs|tastes|preferences|requirements)\b/g,
    
    // The "Profoundly influence" pattern
    /\b(significantly impact|profoundly influence|greatly affect|positively influence)\b/g,
    
    // Abstract connective transitions
    /\b(furthermore|moreover|additionally), \b/g,
    /\b(ultimately|in conclusion|in summary|to summarize), \b/g,
    
    // The "Promote/Support General" pattern
    /\b(promote|encourage|support|foster) (overall|general) (well-being|health|success|growth)\b/g,

    // The "Whether it's X, Y, or Z" AI generative list pattern
    /\bwhether it(')?s a (.*?), a (.*?), or a (.*?)\b/g,

    // The generative marketing/engagement patterns
    /\b(resonate|connect) with your audience\b/g,
    /\b(foster|build|create|cultivate) a (sense of community|genuine connection|lasting relationship)\b/g,
    /\b(remember, |ultimately, |crucially, |importantly, )(.*?) is key\b/g,
    /\ba blend of (.*?) and (.*?)\b/g,

    // NEW V2.0 Generic AI Connectives and Framing
    /\b(evokes a sense of|creates a sense of|brings a sense of)\b/g,
    /\b(while some view it as|while some may|while it is true that)(.*?), others (see it as|argue|believe)\b/g,
    /\b(regardless of the perspective|regardless of your|irrespective of)\b/g,
    /\b(prompts us to reflect on|forces us to reflect on|makes us reconsider)\b/g,
    /\b(has been explored in various|is often seen in various|can be found across)\b/g,
    /\b(stirring both|causing both|bringing both) (.*?) and (.*?)\b/g,
    /\b(represents a time when|symbolizes a moment when)\b/g,
    /\b(each offering unique|each providing unique|all bringing unique)\b/g,
    /\b(a moment of reckoning|a turning point|a pivotal moment)\b/g,
    /\b(an opportunity for renewal|a chance for growth|an avenue for change)\b/g
  ];

  let templateMatchCount = 0;
  for (const regex of STRUCTURAL_TEMPLATES) {
    const matches = lowerText.match(regex);
    if (matches) {
      templateMatchCount += matches.length;
    }
  }

  const density = wordCount > 0 ? (templateMatchCount / (wordCount / 100)) : 0;

  // V2 Continuous Mapping: Convert density to probability using a logistic curve
  // A density of 0.0 -> score ~10
  // A density of 0.8 -> score ~70
  // A density of 1.5+ -> score ~90+
  // Logistic function: 100 / (1 + Math.exp(-4 * (density - 0.6)))
  let signalScore = 100 / (1 + Math.exp(-4 * (density - 0.6)));
  signalScore = Math.max(10, Math.min(99, signalScore)); // Floor at 10

  // V2 length calibration has been removed from this file.
  // It is now strictly handled globally by calibrationService.js.

  let rating = 'Natural Phrasing';
  if (signalScore >= 70) rating = 'Highly Predictable Structural Templates';
  else if (signalScore >= 40) rating = 'Moderate Structural Predictability';

  let explanation = 'Text uses natural, unpredictable phrasing.';
  if (signalScore >= 70) {
    explanation = `High density of generative structural templates detected (${density.toFixed(1)} templates/100w). Text is highly predictable.`;
  }

  return {
    available: true,
    clicheScore: signalScore,
    structuralTemplateCount: templateMatchCount,
    density: Math.round(density * 10) / 10,
    signalScore,
    rating,
    explanation
  };
}
