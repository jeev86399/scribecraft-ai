/**
 * Position Synchronization & Verification Engine
 * Verifies and recalibrates suggestion offsets against current active document text.
 */
export function synchronizeSuggestions(suggestions, currentText) {
  if (!suggestions || !Array.isArray(suggestions) || !currentText) return [];

  const validSuggestions = [];

  for (const s of suggestions) {
    const { startPosition, endPosition, originalText } = s;

    // 1. Direct offset check
    if (
      startPosition >= 0 &&
      endPosition <= currentText.length &&
      currentText.slice(startPosition, endPosition) === originalText
    ) {
      validSuggestions.push(s);
      continue;
    }

    // 2. Fuzzy search window around expected offset (+/- 50 characters)
    const windowStart = Math.max(0, startPosition - 50);
    const windowEnd = Math.min(currentText.length, endPosition + 50);
    const windowText = currentText.slice(windowStart, windowEnd);

    const foundOffsetInWindow = windowText.indexOf(originalText);
    if (foundOffsetInWindow !== -1) {
      const newStart = windowStart + foundOffsetInWindow;
      const newEnd = newStart + originalText.length;

      validSuggestions.push({
        ...s,
        startPosition: newStart,
        endPosition: newEnd
      });
      continue;
    }

    // 3. Fallback: Search anywhere in document if unique match
    const matches = [];
    let pos = currentText.indexOf(originalText);
    while (pos !== -1) {
      matches.push(pos);
      pos = currentText.indexOf(originalText, pos + 1);
    }

    if (matches.length === 1) {
      const newStart = matches[0];
      const newEnd = newStart + originalText.length;
      validSuggestions.push({
        ...s,
        startPosition: newStart,
        endPosition: newEnd
      });
    }
  }

  return validSuggestions;
}
