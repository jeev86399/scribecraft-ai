import React, { useState, useRef } from 'react';
import { 
  Check, 
  X, 
  HelpCircle, 
  PlusCircle, 
  Sparkles, 
  ArrowRight, 
  ShieldAlert 
} from 'lucide-react';
import { useDocument } from '../../context/DocumentContext.jsx';
import { useAnalysis } from '../../context/AnalysisContext.jsx';
import { StatsBar } from './StatsBar.jsx';
import { api } from '../../services/api.js';

export function RichEditor({ onOpenDictionary }) {
  const { activeDocument, saveActiveDocument } = useDocument();
  const { 
    activeSuggestions, 
    acceptSuggestion, 
    ignoreSuggestion,
    activeIssueId,
    setActiveIssueId
  } = useAnalysis();

  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const [toastMsg, setToastMsg] = useState(null);

  const textareaRef = useRef(null);

  const textContent = activeDocument?.content || '';

  const handleTextChange = (e) => {
    saveActiveDocument({ content: e.target.value });
  };

  const handleIssueClick = (issue, e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setPopoverPos({
      top: rect.bottom + window.scrollY + 8,
      left: Math.min(window.innerWidth - 320, Math.max(16, rect.left + window.scrollX - 40))
    });
    setActiveIssueId(issue.id);
  };

  const handleAddToDictionary = async (word) => {
    try {
      await api.addWord(word);
      showToast(`Added '${word}' to personal dictionary`);
      ignoreSuggestion(activeIssueId);
      setActiveIssueId(null);
    } catch (err) {
      showToast(err.message || 'Failed to add word');
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(textContent);
    showToast('Text copied to clipboard!');
  };

  const handleClearText = () => {
    if (window.confirm('Are you sure you want to clear the editor content?')) {
      saveActiveDocument({ content: '' });
      showToast('Document cleared.');
    }
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Render text with interactive issue highlight spans
  const renderHighlightedText = () => {
    if (!textContent) {
      return (
        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
          Start typing or paste your text here to see real-time AI writing analysis...
        </span>
      );
    }

    if (!activeSuggestions || activeSuggestions.length === 0) {
      return <span>{textContent}</span>;
    }

    const elements = [];
    let lastIndex = 0;

    // Filter valid non-overlapping suggestions sorted by start position
    const sorted = [...activeSuggestions].sort((a, b) => a.startPosition - b.startPosition);

    sorted.forEach((issue) => {
      const { startPosition, endPosition, category, id, originalText } = issue;

      if (startPosition < lastIndex || startPosition > textContent.length || endPosition > textContent.length) {
        return; // skip overlap
      }

      // Add preceding plain text
      if (startPosition > lastIndex) {
        elements.push(
          <span key={`text_${lastIndex}_${startPosition}`}>
            {textContent.slice(lastIndex, startPosition)}
          </span>
        );
      }

      // Add highlighted issue span
      const highlightClass = `issue-highlight issue-${category || 'clarity'}`;
      elements.push(
        <span
          key={`issue_${id}_${startPosition}`}
          className={highlightClass}
          onClick={(e) => handleIssueClick(issue, e)}
          title={`Click to review ${category} suggestion: '${originalText}'`}
        >
          {textContent.slice(startPosition, endPosition)}
        </span>
      );

      lastIndex = endPosition;
    });

    // Add remaining tail text
    if (lastIndex < textContent.length) {
      elements.push(
        <span key={`text_${lastIndex}_end`}>
          {textContent.slice(lastIndex)}
        </span>
      );
    }

    return elements;
  };

  const activeIssue = activeSuggestions.find(s => s.id === activeIssueId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, position: 'relative' }}>
      
      {/* Toast Notification */}
      {toastMsg && (
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          backgroundColor: '#1e1b4b',
          color: '#818cf8',
          padding: '0.6rem 1rem',
          borderRadius: '8px',
          fontSize: '0.85rem',
          fontWeight: 600,
          boxShadow: 'var(--shadow-md)',
          zIndex: 60,
          border: '1px solid #4338ca'
        }}>
          {toastMsg}
        </div>
      )}

      {/* Editor Canvas Card */}
      <div style={{
        flex: 1,
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '16px 16px 0 0',
        border: '1px solid var(--border-color)',
        borderBottom: 'none',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        minHeight: '380px'
      }}>
        {/* Render Layer (Visual Highlights) */}
        <div
          onClick={() => textareaRef.current?.focus()}
          style={{
            padding: '1.75rem 2rem',
            fontSize: '1.05rem',
            lineHeight: 1.75,
            color: 'var(--text-main)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            minHeight: '340px',
            cursor: 'text'
          }}
        >
          {renderHighlightedText()}
        </div>

        {/* Input Textarea Layer (Underneath or overlayed for typing) */}
        <textarea
          ref={textareaRef}
          value={textContent}
          onChange={handleTextChange}
          placeholder="Type or paste your writing here..."
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: 0.01, // Invisible overlay so clicks register & user can type seamlessly
            fontSize: '1.05rem',
            lineHeight: 1.75,
            padding: '1.75rem 2rem',
            border: 'none',
            outline: 'none',
            resize: 'none',
            background: 'transparent',
            color: 'transparent',
            caretColor: 'var(--primary)',
            fontFamily: 'inherit'
          }}
        />
      </div>

      {/* Interactive Issue Popover */}
      {activeIssue && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: popoverPos.top,
            left: popoverPos.left,
            width: '320px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-xl)',
            padding: '1rem',
            zIndex: 90,
            animation: 'scaleUp 0.15s ease-out'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: '0.2rem 0.55rem',
              borderRadius: '9999px',
              backgroundColor: `var(--color-${activeIssue.category || 'clarity'})`,
              color: '#ffffff'
            }}>
              {activeIssue.category}
            </span>

            <button
              onClick={() => setActiveIssueId(null)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Issue Original vs Replacement */}
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span style={{ textDecoration: 'line-through', color: 'var(--color-spelling)', fontWeight: 600 }}>
                {activeIssue.originalText}
              </span>
              <ArrowRight size={14} color="var(--text-muted)" />
              <span style={{ color: 'var(--color-conciseness)', fontWeight: 700, fontSize: '1.05rem' }}>
                {activeIssue.suggestedReplacement}
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              {activeIssue.explanation}
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
            <button
              onClick={() => acceptSuggestion(activeIssue.id)}
              style={{
                flex: 1,
                padding: '0.5rem',
                borderRadius: '8px',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.3rem'
              }}
            >
              <Check size={14} />
              Accept
            </button>

            <button
              onClick={() => ignoreSuggestion(activeIssue.id)}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                backgroundColor: 'transparent',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-color)',
                fontWeight: 500,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              Ignore
            </button>

            {activeIssue.category === 'spelling' && (
              <button
                onClick={() => handleAddToDictionary(activeIssue.originalText)}
                title="Add to personal dictionary"
                style={{
                  padding: '0.5rem',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer'
                }}
              >
                <PlusCircle size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <StatsBar onCopy={handleCopyText} onClear={handleClearText} />
    </div>
  );
}
