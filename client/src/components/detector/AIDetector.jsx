import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  Copy, 
  Trash2, 
  RotateCcw, 
  AlertTriangle, 
  Loader2, 
  Info,
  History,
  Wand2,
  Cpu,
  ArrowRight
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';

export function AIDetector() {
  const { isAuthenticated } = useAuth();

  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [humanizing, setHumanizing] = useState(false);
  const [result, setResult] = useState(null);
  const [humanizerResult, setHumanizerResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const wordCount = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;

  const loadHistory = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await api.getAIDetectionHistory();
      setHistory(data);
    } catch (err) {
      console.warn('Failed to load detection history:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadHistory();
    }
  }, [isAuthenticated]);

  const handleDetect = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setHumanizerResult(null);
    try {
      const data = await api.detectAI(text);
      setResult(data);
      if (isAuthenticated && !data.isTooShort) {
        loadHistory();
      }
    } catch (err) {
      setError(err.message || 'AI detection failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleHumanize = async () => {
    if (!text.trim()) return;
    setHumanizing(true);
    setError(null);
    try {
      const data = await api.humanizeText(text);
      setHumanizerResult(data);
      setText(data.humanizedText);
      // Automatically update detector result with after score analysis
      setResult(prev => ({
        ...(prev || {}),
        aiLikelihood: data.afterScore.aiLikelihood,
        humanLikelihood: data.afterScore.humanLikelihood,
        classificationLabel: data.afterScore.classificationLabel,
        confidence: data.afterScore.confidence
      }));
    } catch (err) {
      setError(err.message || 'Humanization failed.');
    } finally {
      setHumanizing(false);
    }
  };

  const handleCopyReport = () => {
    if (!result) return;
    const reportText = `ScribeCraft AI Content Detection Estimate:
Likelihood: ${result.aiLikelihood}% (${result.classificationLabel})
Human Pattern Signal: ${result.humanLikelihood}%
AI Pattern Signal: ${result.aiLikelihood}%
Uncertainty: ${result.uncertainty || 'Low'}
Confidence: ${result.confidence}
Words Analyzed: ${result.wordCount}

Signal Summary:
${(result.keySignals || []).map(s => `• ${s.name}: ${s.result} (${s.level})`).join('\n')}

Evidence:
${(result.reasons || []).map(r => `• ${r}`).join('\n')}

Disclaimer: ${result.disclaimer}`;

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleClear = () => {
    setText('');
    setResult(null);
    setHumanizerResult(null);
    setError(null);
  };

  const handleDeleteHistory = async (id) => {
    try {
      await api.deleteAIDetectionHistory(id);
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
              background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(6,182,212,0.3)'
            }}>
              <ShieldCheck size={22} color="#ffffff" />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              AI Content Detector & Humanizer
            </h2>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Multi-signal statistical evidence estimation system & natural writing humanizer.
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

      {/* Main Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 460px' : '1fr', gap: '1.75rem' }}>
        {/* Left Side: Input Canvas */}
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
            {/* Input Header Toolbar */}
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
              <span>{wordCount} words</span>

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

            {/* Input Canvas */}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste or type text here to analyze writing pattern characteristics (minimum 30 words recommended)..."
              style={{
                width: '100%',
                height: '360px',
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

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={handleDetect}
              disabled={loading || humanizing || !text.trim()}
              style={{
                flex: 1,
                padding: '0.85rem 1.5rem',
                borderRadius: '12px',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(79,70,229,0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  Analyzing Multi-Signal Evidence...
                </>
              ) : (
                <>
                  <Cpu size={18} />
                  Detect AI
                </>
              )}
            </button>

            <button
              onClick={handleHumanize}
              disabled={loading || humanizing || !text.trim()}
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
                transition: 'all 0.2s ease'
              }}
            >
              {humanizing ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  Humanizing Writing...
                </>
              ) : (
                <>
                  <Wand2 size={18} />
                  Humanize Writing
                </>
              )}
            </button>
          </div>

          {error && (
            <p style={{ fontSize: '0.85rem', color: 'var(--color-spelling)' }}>
              {error}
            </p>
          )}

          {/* Before / After Humanization Result Card */}
          {humanizerResult && (
            <div style={{ padding: '1.25rem', borderRadius: '16px', backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid #10b981', color: 'var(--text-main)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 700, marginBottom: '0.5rem' }}>
                <Wand2 size={18} />
                <span>Writing Stylistically Humanized</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.75rem 0', fontSize: '0.9rem', fontWeight: 700 }}>
                <span style={{ color: 'var(--color-spelling)' }}>
                  Before: {humanizerResult.beforeScore.aiLikelihood}% AI
                </span>
                <ArrowRight size={16} />
                <span style={{ color: '#10b981' }}>
                  After: {humanizerResult.afterScore.aiLikelihood}% AI
                </span>
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                {(humanizerResult.changedSignals || []).map((sig, idx) => (
                  <li key={idx}>✓ {sig}</li>
                ))}
              </ul>

              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                {humanizerResult.disclaimer}
              </p>
            </div>
          )}

          {/* User History Drawer */}
          {showHistory && isAuthenticated && (
            <div style={{ marginTop: '1rem', padding: '1.25rem', borderRadius: '16px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.85rem' }}>
                Your Detection History ({history.length})
              </h4>
              {history.length === 0 ? (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No detection history recorded yet.</p>
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
                      <div>
                        <span style={{ fontWeight: 700, color: item.ai_likelihood > 50 ? 'var(--color-spelling)' : '#10b981' }}>
                          {item.ai_likelihood}% {item.classification_label}
                        </span>
                        <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                          ({item.word_count} words • {new Date(item.created_at).toLocaleDateString()})
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeleteHistory(item.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-spelling)', cursor: 'pointer' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Calibrated Multi-Signal Results Panel */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {result.isTooShort ? (
              <div style={{ padding: '1.5rem', borderRadius: '16px', backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid #f59e0b', color: 'var(--text-main)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b', fontWeight: 700, marginBottom: '0.5rem' }}>
                  <AlertTriangle size={18} />
                  <span>Not Enough Text</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {result.message}
                </p>
              </div>
            ) : (
              <>
                {/* Main Calibrated Estimate Card */}
                <div style={{
                  padding: '1.5rem',
                  borderRadius: '16px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-md)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                      AI WRITING PATTERN ESTIMATE
                    </span>

                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.55rem',
                        borderRadius: '9999px',
                        backgroundColor: 'rgba(99,102,241,0.12)',
                        color: '#6366f1'
                      }}>
                        Confidence: {result.confidence}
                      </span>

                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.55rem',
                        borderRadius: '9999px',
                        backgroundColor: 'rgba(245,158,11,0.12)',
                        color: '#f59e0b'
                      }}>
                        Uncertainty: {result.uncertainty || 'Low'}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: result.aiLikelihood > 50 ? 'var(--color-spelling)' : '#10b981', marginBottom: '0.25rem' }}>
                      {result.aiLikelihood}% {result.classificationLabel}
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Text analyzed: {result.wordCount} words
                    </p>
                  </div>

                  {/* Signal Metrics Progress Bars */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    {/* Human Pattern Signal */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Human-Pattern Signal</span>
                        <span style={{ fontWeight: 700, color: '#10b981' }}>{result.humanLikelihood}%</span>
                      </div>
                      <div style={{ height: '6px', borderRadius: '3px', backgroundColor: 'var(--border-color)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${result.humanLikelihood}%`, backgroundColor: '#10b981', transition: 'width 0.5s ease' }} />
                      </div>
                    </div>

                    {/* AI Pattern Signal */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>AI-Pattern Signal</span>
                        <span style={{ fontWeight: 700, color: result.aiLikelihood > 50 ? 'var(--color-spelling)' : '#f59e0b' }}>{result.aiLikelihood}%</span>
                      </div>
                      <div style={{ height: '6px', borderRadius: '3px', backgroundColor: 'var(--border-color)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${result.aiLikelihood}%`, backgroundColor: result.aiLikelihood > 50 ? 'var(--color-spelling)' : '#f59e0b', transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                    <button
                      onClick={handleCopyReport}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-app)',
                        color: 'var(--text-main)',
                        border: '1px solid var(--border-color)',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <Copy size={14} />
                      {copied ? 'Copied Summary!' : 'Copy Summary'}
                    </button>

                    <button
                      onClick={handleDetect}
                      style={{
                        padding: '0.5rem 0.85rem',
                        borderRadius: '8px',
                        backgroundColor: 'var(--primary)',
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
                      <RotateCcw size={14} />
                      Re-Analyze
                    </button>
                  </div>
                </div>

                {/* Neutral Signal Breakdown Table */}
                <div style={{ padding: '1.25rem', borderRadius: '16px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.85rem' }}>
                    Signal Breakdown
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                    {(result.keySignals || []).map((sig, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', paddingBottom: '0.4rem', borderBottom: idx < result.keySignals.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                        <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{sig.name}</span>
                        <span style={{ fontWeight: 600, color: sig.level.includes('Formulaic') || sig.level.includes('Generic') || sig.level.includes('Symmetrical') ? 'var(--color-spelling)' : '#10b981' }}>
                          {sig.result}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dynamic "Why this result?" Evidence Section */}
                <div style={{ padding: '1.25rem', borderRadius: '16px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                    Why this result?
                  </h4>

                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {(result.reasons || []).map((reason, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>•</span>
                        <span style={{ lineHeight: 1.45 }}>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Disclaimer Alert */}
                <div style={{ padding: '1rem', borderRadius: '12px', backgroundColor: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                  <Info size={18} color="#6366f1" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                    {result.disclaimer}
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
