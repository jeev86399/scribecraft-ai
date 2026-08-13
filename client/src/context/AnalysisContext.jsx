import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api.js';
import { useDocument } from './DocumentContext.jsx';

const AnalysisContext = createContext();

export function AnalysisProvider({ children }) {
  const { activeDocument, saveActiveDocument } = useDocument();

  const [suggestions, setSuggestions] = useState([]);
  const [score, setScore] = useState(100);
  const [scoreBreakdown, setScoreBreakdown] = useState({ correctness: 100, clarity: 100, engagement: 100, delivery: 100 });
  const [readability, setReadability] = useState({ fleschReadingEase: 100, gradeLevel: 'Grade 8', label: 'Standard' });
  const [stats, setStats] = useState({ words: 0, characters: 0, sentences: 0, paragraphs: 0, readingTimeMinutes: 0 });
  const [tone, setTone] = useState({ primary: 'Neutral', confidence: 1.0, breakdown: { Neutral: 100 } });
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [ignoredIds, setIgnoredIds] = useState(new Set());
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [activeIssueId, setActiveIssueId] = useState(null);

  // Rewriting modal state
  const [rewriteModalOpen, setRewriteModalOpen] = useState(false);

  const reqCounterRef = useRef(0);
  const timerRef = useRef(null);

  // Trigger analysis for given text
  const runAnalysis = useCallback(async (textToAnalyze) => {
    if (textToAnalyze === undefined || textToAnalyze === null) return;
    
    const currentReqId = ++reqCounterRef.current;
    setIsAnalyzing(true);

    try {
      const data = await api.analyzeText(textToAnalyze);

      // Verify this is still the latest request (prevents race conditions)
      if (currentReqId === reqCounterRef.current) {
        setSuggestions(data.suggestions || []);
        setScore(data.score !== undefined ? data.score : 100);
        if (data.scoreBreakdown) setScoreBreakdown(data.scoreBreakdown);
        if (data.readability) setReadability(data.readability);
        if (data.stats) setStats(data.stats);
        if (data.tone) setTone(data.tone);
      }
    } catch (err) {
      console.error('Analysis request error:', err);
    } finally {
      if (currentReqId === reqCounterRef.current) {
        setIsAnalyzing(false);
      }
    }
  }, []);

  // Debounced auto-analysis when active document content changes
  useEffect(() => {
    if (!activeDocument) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      runAnalysis(activeDocument.content || '');
    }, 600);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activeDocument?.content, runAnalysis]);

  // Active suggestions after applying ignored set and category filter
  const activeSuggestions = suggestions.filter(s => {
    if (ignoredIds.has(s.id)) return false;
    if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;
    return true;
  });

  // Accept single suggestion
  const acceptSuggestion = (suggestionId, replacementOverride = null) => {
    if (!activeDocument) return;

    const target = suggestions.find(s => s.id === suggestionId);
    if (!target) return;

    const currentText = activeDocument.content || '';
    const { startPosition, endPosition, originalText, suggestedReplacement } = target;
    const replacement = replacementOverride !== null ? replacementOverride : suggestedReplacement;

    // Verify position range
    let newText = currentText;
    if (currentText.slice(startPosition, endPosition) === originalText) {
      newText = currentText.slice(0, startPosition) + replacement + currentText.slice(endPosition);
    } else {
      // Fallback replace first match
      newText = currentText.replace(originalText, replacement);
    }

    saveActiveDocument({ content: newText });
    setIgnoredIds(prev => new Set(prev).add(suggestionId));
    setActiveIssueId(null);
  };

  // Ignore single suggestion
  const ignoreSuggestion = (suggestionId) => {
    setIgnoredIds(prev => new Set(prev).add(suggestionId));
    if (activeIssueId === suggestionId) setActiveIssueId(null);
  };

  // Batch Apply All Compatible Auto-Fixable Suggestions (Back-to-Front)
  const fixAllCompatible = () => {
    if (!activeDocument || activeSuggestions.length === 0) return;

    const fixable = activeSuggestions
      .filter(s => s.autoFixable && s.suggestedReplacement !== s.originalText)
      .sort((a, b) => b.startPosition - a.startPosition); // Right-to-Left sorting!

    let currentText = activeDocument.content || '';
    const appliedIds = new Set();

    for (const issue of fixable) {
      const { startPosition, endPosition, originalText, suggestedReplacement } = issue;
      if (currentText.slice(startPosition, endPosition) === originalText) {
        currentText = currentText.slice(0, startPosition) + suggestedReplacement + currentText.slice(endPosition);
        appliedIds.add(issue.id);
      }
    }

    if (appliedIds.size > 0) {
      saveActiveDocument({ content: currentText });
      setIgnoredIds(prev => {
        const next = new Set(prev);
        appliedIds.forEach(id => next.add(id));
        return next;
      });
    }
  };

  return (
    <AnalysisContext.Provider value={{
      suggestions,
      activeSuggestions,
      score,
      scoreBreakdown,
      readability,
      stats,
      tone,
      isAnalyzing,
      categoryFilter,
      setCategoryFilter,
      activeIssueId,
      setActiveIssueId,
      acceptSuggestion,
      ignoreSuggestion,
      fixAllCompatible,
      rewriteModalOpen,
      setRewriteModalOpen,
      runAnalysis
    }}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  return useContext(AnalysisContext);
}
