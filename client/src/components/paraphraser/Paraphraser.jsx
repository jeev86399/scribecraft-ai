import React, { useState } from 'react';
import { 
  Wand2, 
  Copy, 
  Trash2, 
  RotateCcw, 
  Check, 
  ArrowRight, 
  Loader2, 
  RefreshCw,
  Sparkles,
  FileText,
  Layers,
  Undo,
  Cpu
} from 'lucide-react';
import { api } from '../../services/api.js';

export function Paraphraser() {
  const [originalText, setOriginalText] = useState('Yesterday I went to the market to purchase some fresh ingredients for dinner.');
  const [selectedMode, setSelectedMode] = useState('Standard');
  const [paraphrasedResult, setParaphrasedResult] = useState(null);
  const [historyStack, setHistoryStack] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showDiff, setShowDiff] = useState(true);

  const modes = [
    { id: 'Standard', label: 'Standard', desc: 'Balanced rewording for flow' },
    { id: 'Fluency', label: 'Fluency', desc: 'Fixes awkward phrasing' },
    { id: 'Formal', label: 'Formal', desc: 'Sophisticated & expanded' },
    { id: 'Professional', label: 'Professional', desc: 'Executive business tone' },
    { id: 'Academic', label: 'Academic', desc: 'Research & formal structure' },
    { id: 'Simple', label: 'Simple', desc: 'Easier vocabulary' },
    { id: 'Creative', label: 'Creative', desc: 'Descriptive & expressive' },
    { id: 'Concise', label: 'Concise', desc: 'Shortened & direct' },
    { id: 'Humanize', label: '✨ Humanize AI', desc: 'Transform AI patterns into natural writing' }
  ];

  const origWords = originalText.trim() ? originalText.trim().split(/\s+/).filter(Boolean).length : 0;
  const resultWords = paraphrasedResult?.paraphrasedText
    ? paraphrasedResult.paraphrasedText.trim().split(/\s+/).filter(Boolean).length
    : 0;

  const handleParaphrase = async (overrideMode = null) => {
    if (!originalText.trim()) return;
    const modeToUse = overrideMode || selectedMode;
    setLoading(true);
    setError(null);
    try {
      if (modeToUse === 'Humanize') {
        const humData = await api.humanizeText(originalText);
        setParaphrasedResult({
          paraphrasedText: humData.humanizedText,
          explanation: `Humanized writing (AI score reduced from ${humData.beforeScore.aiLikelihood}% to ${humData.afterScore.aiLikelihood}%).`
        });
      } else {
        const data = await api.paraphrase(originalText, modeToUse);
        setParaphrasedResult(data);
      }
    } catch (err) {
      setError(err.message || 'Paraphrasing failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleModeSelect = (modeId) => {
    setSelectedMode(modeId);
    if (originalText.trim()) {
      handleParaphrase(modeId);
    }
  };

  const handleReplaceOriginal = () => {
    if (!paraphrasedResult?.paraphrasedText) return;
    setHistoryStack(prev => [originalText, ...prev]);
    setOriginalText(paraphrasedResult.paraphrasedText);
  };

  const handleUndoReplace = () => {
    if (historyStack.length === 0) return;
    const prevText = historyStack[0];
    setOriginalText(prevText);
    setHistoryStack(prev => prev.slice(1));
  };

  const handleCopy = () => {
    if (!paraphrasedResult?.paraphrasedText) return;
    navigator.clipboard.writeText(paraphrasedResult.paraphrasedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple Word Diff Renderer
  const renderDiffView = () => {
    if (!originalText || !paraphrasedResult?.paraphrasedText) return null;

    const origTokens = originalText.split(/\s+/);
    const paraTokens = paraphrasedResult.paraphrasedText.split(/\s+/);
    const origSet = new Set(origTokens.map(t => t.toLowerCase().replace(/[^a-z0-9]/gi, '')));

    return (
      <div style={{ fontSize: '1rem', lineHeight: 1.7, color: 'var(--text-main)' }}>
        {paraTokens.map((token, i) => {
          const clean = token.toLowerCase().replace(/[^a-z0-9]/gi, '');
          const isNewWord = clean.length > 2 && !origSet.has(clean);
          return (
            <span
              key={i}
              style={{
                backgroundColor: isNewWord ? 'rgba(16,185,129,0.15)' : 'transparent',
                color: isNewWord ? '#10b981' : 'inherit',
                fontWeight: isNewWord ? 700 : 400,
                borderRadius: '3px',
                padding: isNewWord ? '0 3px' : '0'
              }}
            >
              {token}{' '}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 3rem', backgroundColor: 'var(--bg-app)' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
          }}>
            <Wand2 size={22} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Paraphrasing & AI Humanizer
          </h2>
        </div>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Rephrase sentences, adapt tone modes, and humanize AI writing patterns while preserving original facts.
        </p>
      </div>

      {/* Mode Selector Pills */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto',
        paddingBottom: '0.75rem',
        marginBottom: '1.5rem'
      }}>
        {modes.map(mode => {
          const isActive = selectedMode === mode.id;
          const isHumanize = mode.id === 'Humanize';
          return (
            <button
              key={mode.id}
              onClick={() => handleModeSelect(mode.id)}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: '10px',
                border: isActive 
                  ? (isHumanize ? '1px solid #10b981' : '1px solid var(--primary)') 
                  : '1px solid var(--border-color)',
                backgroundColor: isActive 
                  ? (isHumanize ? '#10b981' : 'var(--primary)') 
                  : 'var(--bg-surface)',
                color: isActive ? '#ffffff' : (isHumanize ? '#10b981' : 'var(--text-main)'),
                fontSize: '0.85rem',
                fontWeight: isActive || isHumanize ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              {mode.label}
            </button>
          );
        })}
      </div>

      {/* Dual Pane Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Left Pane: Original */}
        <div style={{
          borderRadius: '16px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Left Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1.25rem',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-app)',
            fontSize: '0.82rem',
            color: 'var(--text-muted)'
          }}>
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Original Text</span>
            <span>{origWords} words</span>
          </div>

          <textarea
            value={originalText}
            onChange={(e) => setOriginalText(e.target.value)}
            placeholder="Type or paste text to paraphrase or humanize..."
            style={{
              width: '100%',
              height: '320px',
              padding: '1.25rem',
              border: 'none',
              outline: 'none',
              resize: 'none',
              backgroundColor: 'transparent',
              color: 'var(--text-main)',
              fontSize: '1rem',
              lineHeight: 1.7,
              fontFamily: 'inherit'
            }}
          />

          {/* Left Footer Action */}
          <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => setOriginalText('')}
              disabled={!originalText}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-spelling)',
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <Trash2 size={14} />
              Clear
            </button>

            <button
              onClick={() => handleParaphrase()}
              disabled={loading || !originalText.trim()}
              style={{
                padding: '0.55rem 1.25rem',
                borderRadius: '8px',
                backgroundColor: selectedMode === 'Humanize' ? '#10b981' : 'var(--primary)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Processing...
                </>
              ) : selectedMode === 'Humanize' ? (
                <>
                  <Wand2 size={16} />
                  Humanize Text
                </>
              ) : (
                <>
                  <Wand2 size={16} />
                  Paraphrase
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Pane: Paraphrased Result */}
        <div style={{
          borderRadius: '16px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Right Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1.25rem',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-app)',
            fontSize: '0.82rem',
            color: 'var(--text-muted)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 700, color: selectedMode === 'Humanize' ? '#10b981' : 'var(--primary)' }}>
                Result ({selectedMode})
              </span>
            </div>

            {paraphrasedResult && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span>{resultWords} words</span>
                <button
                  onClick={() => setShowDiff(prev => !prev)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {showDiff ? 'Hide Diff' : 'Show Diff'}
                </button>
              </div>
            )}
          </div>

          <div style={{ flex: 1, padding: '1.25rem', height: '320px', overflowY: 'auto' }}>
            {!paraphrasedResult ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                <Sparkles size={32} style={{ marginBottom: '0.5rem', opacity: 0.4 }} />
                <p style={{ fontSize: '0.9rem' }}>Click <strong>{selectedMode === 'Humanize' ? 'Humanize Text' : 'Paraphrase'}</strong> to generate rewrites.</p>
              </div>
            ) : showDiff ? (
              renderDiffView()
            ) : (
              <p style={{ fontSize: '1rem', lineHeight: 1.7, color: 'var(--text-main)' }}>
                {paraphrasedResult.paraphrasedText}
              </p>
            )}
          </div>

          {/* Right Footer Actions */}
          {paraphrasedResult && (
            <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={handleReplaceOriginal}
                  style={{
                    padding: '0.45rem 0.75rem',
                    borderRadius: '8px',
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <ArrowRight size={14} />
                  Replace Original
                </button>

                {historyStack.length > 0 && (
                  <button
                    onClick={handleUndoReplace}
                    style={{
                      padding: '0.45rem 0.75rem',
                      borderRadius: '8px',
                      backgroundColor: 'transparent',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <Undo size={14} />
                    Undo
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleParaphrase()}
                  title="Regenerate output"
                  style={{
                    padding: '0.45rem 0.65rem',
                    borderRadius: '8px',
                    backgroundColor: 'transparent',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  <RefreshCw size={14} />
                </button>

                <button
                  onClick={handleCopy}
                  style={{
                    padding: '0.45rem 0.75rem',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-main)',
                    border: '1px solid var(--border-color)',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <Copy size={14} />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
