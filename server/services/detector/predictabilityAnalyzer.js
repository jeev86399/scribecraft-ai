/**
 * Predictability & Cliché Analyzer (Family E)
 * Detects structural templates that are highly predictable in generative AI text.
 * Built for Adversarial Paraphrase Robustness: Looks for abstract rhetorical constructs
 * rather than just exact phrases (e.g. "offers a chance to", "provides an opportunity to").
 */

export function analyzePredictability(preprocessed) {
  const { normalizedText, wordCount } = preprocessed;
  if (!normalizedText || wordCount < 15) {
    return {
      clicheScore: 0,
      structuralTemplateCount: 0,
      signalScore: 10,
      rating: 'Natural Phrasing',
      explanation: 'Insufficient text to analyze predictability.'
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
    /\ba blend of (.*?) and (.*?)\b/g
  ];

  let templateMatchCount = 0;
  for (const regex of STRUCTURAL_TEMPLATES) {
    const matches = lowerText.match(regex);
    if (matches) {
      templateMatchCount += matches.length;
    }
  }

  const density = wordCount > 0 ? (templateMatchCount / (wordCount / 100)) : 0;

  let signalScore = 10;
  if (density >= 2.0) {
    signalScore = 95;
  } else if (density >= 1.0) {
    signalScore = 75;
  } else if (density >= 0.5) {
    signalScore = 45;
  }

  let rating = 'Natural Phrasing';
  if (signalScore >= 75) rating = 'Highly Predictable Structural Templates';
  else if (signalScore >= 45) rating = 'Moderate Structural Predictability';

  let explanation = 'Text uses natural, unpredictable phrasing.';
  if (signalScore >= 75) {
    explanation = `High density of generative structural templates detected (${density.toFixed(1)} templates/100w). Text is highly predictable even if paraphrased.`;
  }

  return {
    clicheScore: signalScore,
    structuralTemplateCount: templateMatchCount,
    density: Math.round(density * 10) / 10,
    signalScore,
    rating,
    explanation
  };
}
