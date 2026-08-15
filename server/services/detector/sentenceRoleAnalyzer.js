/**
 * Sentence Role Analyzer
 * Classifies each sentence by its rhetorical role independently of topic.
 */

export function analyzeSentenceRoles(preprocessed) {
  const { sentences } = preprocessed;
  const roles = [];

  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i].toLowerCase();
    
    let role = 'DESCRIPTION';
    
    // DEFINITION / BROAD CLAIM (Usually early)
    if (i === 0 && (s.includes(' is ') || s.includes(' serves as ') || s.includes(' refers to '))) {
      role = 'DEFINITION';
    } else if (i === 0 && (s.includes(' rapidly ') || s.includes(' increasingly '))) {
      role = 'BROAD_CLAIM';
    }
    
    // EXAMPLES
    else if (s.includes('from ') && s.includes(' to ')) {
      role = 'EXAMPLES';
    } else if (s.includes('for example') || s.includes('such as') || s.includes('including')) {
      role = 'EXAMPLES';
    }
    
    // BENEFIT
    else if (s.includes('allows') || s.includes('helps') || s.includes('creating') || s.includes('provides') || s.includes('opportunity') || s.includes('improving') || s.includes('fostering')) {
      role = 'BENEFIT';
    }
    
    // CONTRAST / CAUTION
    else if (s.startsWith('however') || s.startsWith('on the other hand') || s.includes('requires careful') || s.includes('challenge')) {
      role = 'CAUTION';
    }
    
    // CONCLUSION
    else if (i === sentences.length - 1 && (s.startsWith('in conclusion') || s.startsWith('ultimately') || s.startsWith('as ') || s.includes('essential to') || s.includes('must establish') || s.includes('making it'))) {
      role = 'CONCLUSION';
    }

    roles.push(role);
  }

  return roles;
}
