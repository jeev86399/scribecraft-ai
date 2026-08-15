import React, { useState, useEffect } from 'react';
import { 
  Wand2, 
  Copy, 
  Trash2, 
  Loader2, 
  Info,
  History,
  ArrowRight
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';

export function AIHumanizer() {
  const { isAuthenticated } = useAuth();

  const [text, setText] = useState('');
  const [humanizeMode, setHumanizeMode] = useState('natural');
  const [humanizing, setHumanizing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const wordCount = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;

  const loadHistory = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await api.getAIHumanizationHistory();
      setHistory(data);
    } catch (err) {
      console.warn('Failed to load humanization history:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) loadHistory();
  }, [isAuthenticated]);

  const handleHumanize = async () => {
    if (!text.trim()) return;
    setHumanizing(true);
    setError(null);
    try {
      const data = await api.humanizeText(text, humanizeMode);
      setResult(data);
      if (isAuthenticated && !data.error && data.humanizedText) {
        loadHistory();
      }
    } catch (err) {
      setError(err.message || 'Humanization failed.');
    } finally {
      setHumanizing(false);
    }
  };

  const handleCopyResult = () => {
    if (!result || !result.humanizedText) return;
    navigator.clipboard.writeText(result.humanizedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleClear = () => {
    setText('');
    setResult(null);
    setError(null);
  };

  const handleDeleteHistory = async (id) => {
    try {
      await api.deleteAIHumanizationHistory(id);
      setHistory(prev => prev.filter(h => h.id !== id));
    } catch (err) {
      console.error('Delete history error:', err);
    }
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 3rem', backgroundColor: 'var(--bg-app)' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #14b8a6 0%, #10b981 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(20,184,166,0.3)'
            }}>
              <Wand2 size={22} color="#ffffff" />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              AI Humanizer
            </h2>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Rewrite AI-generated text to bypass detection systems naturally.
          </p>
        </div>

        {isAuthenticated && (
          <button
            onClick={() => setShowHistory(prev => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.55rem 0.9rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <History size={16} />
            History ({history.length})
          </button>
        )}
      </div>

      {/* Main Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: '1.75rem', transition: 'grid-template-columns 0.3s ease' }}>
        
        {/* Left Side: Original Text Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            borderRadius: '16px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
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
              <span style={{ fontWeight: 600 }}>Original Text</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {wordCount} words
              </span>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={async () => {
                    const clip = await navigator.clipboard.readText();
                    if (clip) setText(clip);
                  }}
                  style={{
                    padding: '0.35rem 0.65rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'transparent',
                    color: 'var(--text-muted)',
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  Paste Text
                </button>

                <button
                  onClick={handleClear}
                  disabled={!text}
                  style={{
                    padding: '0.35rem 0.65rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'transparent',
                    color: 'var(--color-spelling)',
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  Clear
                </button>
              </div>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste AI-generated text here (minimum 15 words)..."
              style={{
                width: '100%',
                height: '340px',
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
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginRight: '0.25rem' }}>
                Humanizer Mode:
              </span>
              {['natural', 'professional', 'academic', 'conversational', 'concise'].map(m => (
                <button
                  key={m}
                  onClick={() => setHumanizeMode(m)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '9999px',
                    border: humanizeMode === m ? '1px solid #10b981' : '1px solid var(--border-color)',
                    backgroundColor: humanizeMode === m ? 'rgba(16,185,129,0.12)' : 'var(--bg-surface)',
                    color: humanizeMode === m ? '#10b981' : 'var(--text-muted)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleHumanize}
            disabled={humanizing || !text.trim()}
            style={{
              padding: '0.85rem 1.5rem',
              borderRadius: '12px',
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
              transition: 'all 0.2s ease',
              width: '100%'
            }}
          >
            {humanizing ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                Humanizing...
              </>
            ) : (
              <>
                <Wand2 size={18} />
                Rewrite & Humanize
              </>
            )}
          </button>

          {error && (
            <p style={{ fontSize: '0.85rem', color: 'var(--color-spelling)' }}>
              {error}
            </p>
          )}

          {/* User History Drawer */}
          {showHistory && isAuthenticated && (
            <div style={{ marginTop: '1rem', padding: '1.25rem', borderRadius: '16px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.85rem' }}>
                Your Humanization History ({history.length})
              </h4>
              {history.length === 0 ? (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No history recorded yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '220px', overflowY: 'auto' }}>
                  {history.map(item => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.6rem 0.85rem',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-app)',
                        fontSize: '0.82rem'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          {item.mode.charAt(0).toUpperCase() + item.mode.slice(1)} Mode
                        </span>
                        {item.before_score_likelihood && item.after_score_likelihood && (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            {item.before_score_likelihood}% AI <ArrowRight size={10} style={{ display: 'inline', verticalAlign: 'middle' }}/> {item.after_score_likelihood}% AI
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => {
                            setText(item.original_text);
                            setResult({
                              humanizedText: item.humanized_text,
                              mode: item.mode,
                              beforeScore: { aiLikelihood: item.before_score_likelihood },
                              afterScore: { aiLikelihood: item.after_score_likelihood }
                            });
                          }}
                          style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', fontSize: '0.75rem' }}
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDeleteHistory(item.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--color-spelling)', cursor: 'pointer' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Result Output */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              borderRadius: '16px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              height: '100%',
              minHeight: '400px'
            }}>
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
                <span style={{ fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Wand2 size={14} />
                  Humanized Output
                </span>

                <button
                  onClick={handleCopyResult}
                  style={{
                    padding: '0.35rem 0.65rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'transparent',
                    color: 'var(--text-main)',
                    fontSize: '0.78rem',
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

              <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1, fontSize: '1rem', lineHeight: 1.7, color: 'var(--text-main)' }}>
                {result.humanizedText}
              </div>
            </div>

            {/* Before / After Metrics Card */}
            {result.beforeScore && result.afterScore && (
              <div style={{ 
                padding: '1.25rem', 
                borderRadius: '16px', 
                backgroundColor: result.isLimitedTransformation ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)', 
                border: result.isLimitedTransformation ? '1px solid #f59e0b' : '1px solid #10b981', 
                color: 'var(--text-main)' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: result.isLimitedTransformation ? '#f59e0b' : '#10b981', fontWeight: 700 }}>
                    {result.isLimitedTransformation ? <Info size={18} /> : <Wand2 size={18} />}
                    <span style={{ textTransform: 'capitalize' }}>
                      {result.isLimitedTransformation ? 'Limited Transformation' : `Success (${result.mode})`}
                    </span>
                  </div>
                  <span style={{ 
                    fontSize: '0.78rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '9999px', 
                    backgroundColor: result.isLimitedTransformation ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)', 
                    color: result.isLimitedTransformation ? '#f59e0b' : '#10b981' 
                  }}>
                    {result.scoreDelta === 0 ? '0 pts' : `-${result.scoreDelta} pts`}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.75rem 0', fontSize: '0.9rem', fontWeight: 700 }}>
                  <span style={{ color: 'var(--color-spelling)' }}>
                    Before: {result.beforeScore.aiLikelihood}% AI
                  </span>
                  <ArrowRight size={16} />
                  <span style={{ color: result.isLimitedTransformation ? '#f59e0b' : '#10b981' }}>
                    After: {result.afterScore.aiLikelihood}% AI
                  </span>
                </div>

                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  {(result.reducedSignals || []).map((sig, idx) => (
                    <li key={idx} style={{ display: 'flex', gap: '0.4rem' }}>
                      <span style={{ color: result.isLimitedTransformation ? '#f59e0b' : '#10b981' }}>
                        {result.isLimitedTransformation ? '•' : '✓'}
                      </span>
                      {sig}
                    </li>
                  ))}
                </ul>
                
                {result.explanationNote && (
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.75rem', fontStyle: 'italic' }}>
                    {result.explanationNote}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
