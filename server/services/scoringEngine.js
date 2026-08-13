/**
 * Writing Quality Scoring Engine
 */

export function calculateWritingScore(text, suggestions = [], stats = {}) {
  const wordCount = stats.words || (text ? text.trim().split(/\s+/).length : 0);
  if (wordCount === 0) {
    return {
      overallScore: 100,
      breakdown: {
        correctness: 100,
        clarity: 100,
        engagement: 100,
        delivery: 100
      },
      readability: {
        fleschReadingEase: 100,
        gradeLevel: 'Grade 5',
        label: 'Very Easy'
      }
    };
  }

  // Count issue categories
  let spellingErrors = 0;
  let grammarErrors = 0;
  let punctuationErrors = 0;
  let clarityIssues = 0;
  let concisenessIssues = 0;
  let wordChoiceIssues = 0;

  for (const s of suggestions) {
    if (s.category === 'spelling') spellingErrors++;
    else if (s.category === 'grammar') grammarErrors++;
    else if (s.category === 'punctuation') punctuationErrors++;
    else if (s.category === 'clarity' || s.category === 'readability') clarityIssues++;
    else if (s.category === 'conciseness') concisenessIssues++;
    else if (s.category === 'word_choice' || s.category === 'style') wordChoiceIssues++;
  }

  // Normalize penalties relative to document length (per 100 words)
  const normFactor = Math.max(1, wordCount / 100);

  // 1. Correctness (Spelling, Grammar, Punctuation)
  const correctnessPenalty = ((spellingErrors * 8) + (grammarErrors * 10) + (punctuationErrors * 4)) / normFactor;
  const correctnessScore = Math.max(0, Math.round(100 - correctnessPenalty));

  // 2. Clarity (Sentence length, passive voice, clarity issues)
  const clarityPenalty = (clarityIssues * 12) / normFactor;
  const clarityScore = Math.max(0, Math.round(100 - clarityPenalty));

  // 3. Engagement (Vocabulary variety, word choice)
  const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  const uniqueWords = new Set(words).size;
  const lexicalDiversity = words.length > 0 ? (uniqueWords / words.length) : 1;
  const engagementBase = Math.min(100, Math.round(lexicalDiversity * 120));
  const engagementPenalty = (wordChoiceIssues * 6) / normFactor;
  const engagementScore = Math.max(30, Math.min(100, Math.round(engagementBase - engagementPenalty)));

  // 4. Delivery (Conciseness, tone, wordiness)
  const deliveryPenalty = (concisenessIssues * 10) / normFactor;
  const deliveryScore = Math.max(0, Math.round(100 - deliveryPenalty));

  // Weighted Overall Score
  const overallScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (correctnessScore * 0.40) +
        (clarityScore * 0.25) +
        (engagementScore * 0.15) +
        (deliveryScore * 0.20)
      )
    )
  );

  // Readability Calculation (Flesch Reading Ease)
  const sentenceCount = Math.max(1, stats.sentences || 1);
  const syllableCount = countSyllablesInText(text);
  const flesch = Math.max(
    0,
    Math.min(
      100,
      Math.round(206.835 - (1.015 * (wordCount / sentenceCount)) - (84.6 * (syllableCount / wordCount)))
    )
  );

  let gradeLevel = 'Grade 8';
  let label = 'Standard';
  if (flesch >= 90) { gradeLevel = 'Grade 5'; label = 'Very Easy'; }
  else if (flesch >= 80) { gradeLevel = 'Grade 6'; label = 'Easy'; }
  else if (flesch >= 70) { gradeLevel = 'Grade 7'; label = 'Fairly Easy'; }
  else if (flesch >= 60) { gradeLevel = 'Grade 8-9'; label = 'Standard'; }
  else if (flesch >= 50) { gradeLevel = 'Grade 10-12'; label = 'Fairly Difficult'; }
  else if (flesch >= 30) { gradeLevel = 'College'; label = 'Difficult'; }
  else { gradeLevel = 'Graduate'; label = 'Very Difficult'; }

  return {
    overallScore,
    breakdown: {
      correctness: correctnessScore,
      clarity: clarityScore,
      engagement: engagementScore,
      delivery: deliveryScore
    },
    readability: {
      fleschReadingEase: flesch,
      gradeLevel,
      label
    }
  };
}

function countSyllablesInWord(word) {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  word = word.replace(/(?:|ed|es|e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

function countSyllablesInText(text) {
  const words = text.match(/\b[a-zA-Z]+\b/g) || [];
  let total = 0;
  for (const w of words) {
    total += countSyllablesInWord(w);
  }
  return Math.max(1, total);
}
