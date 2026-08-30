import React, { useState, useEffect, useRef } from 'react';
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
  Cpu,
  ArrowRight
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();


// Utility for debounce
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

export function AIDetector() {
  const { isAuthenticated } = useAuth();

  const [text, setText] = useState('');
  const debouncedText = useDebounce(text, 800); // 800ms Debounce for real-time detection

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [sensitivityMode, setSensitivityMode] = useState('Balanced');

  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  
  const abortControllerRef = useRef(null);
  const fileInputRef = useRef(null);

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
    if (isAuthenticated) loadHistory();
  }, [isAuthenticated]);

  // Real-time Detection Effect
  useEffect(() => {
    const runRealTimeDetection = async () => {
      if (!debouncedText.trim() || debouncedText.trim().split(/\s+/).filter(Boolean).length < 15) {
        setResult(null); // Clear or ignore if too short
        return;
      }
      
      // Cancel previous stale request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setLoading(true);
      setError(null);

      try {
        const data = await api.detectAI(debouncedText, { sensitivityMode, signal: abortControllerRef.current.signal });
        setResult(data);
        if (isAuthenticated && !data.isTooShort) {
          loadHistory();
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'AI detection failed.');
        }
      } finally {
        setLoading(false);
      }
    };

    runRealTimeDetection();

    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [debouncedText]); // Dependency on debounced text


  const handleCopyReport = () => {
    if (!result) return;
    const resData = result.document || result.result || {};
    const reportText = `ScribeCraft AI v2.0 Content Detection Estimate:
Likelihood: ${resData.aiLikelihood}% (${resData.classification})
Human Pattern Signal: ${100 - resData.aiLikelihood}%
AI Pattern Signal: ${resData.aiLikelihood}%
Reliability: ${resData.reliability}
Confidence: ${resData.confidence}
Uncertainty: ±${resData.uncertainty || 0}%
Evidence Agreement: ${resData.evidenceAgreement || 0}%
Evidence Coverage: ${resData.evidenceCoverage}%

Active Families:
${(resData.activeFamilies || []).map(f => `• ${f}`).join('\n')}

Unavailable Families (Fallback Mode):
${(resData.unavailableFamilies || []).map(f => `• ${f}`).join('\n')}

Disclaimer: ${(result.limitations || []).join(' ')}`;

    navigator.clipboard.writeText(reportText);
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
      await api.deleteAIDetectionHistory(id);
      setHistory(prev => prev.filter(h => h.id !== id));
    } catch (err) {
      console.error('Delete history error:', err);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(' ');
          fullText += pageText + '\n\n';
        }
        setText(fullText.trim());
      } else {
        const textContent = await file.text();
        setText(textContent);
      }
    } catch (err) {
      setError('Failed to extract text from file: ' + err.message);
    } finally {
      setLoading(false);
      // Reset input so the same file can be uploaded again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const resData = result ? (result.document || result.result || {}) : {};

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
              AI Content Detector
            </h2>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Dynamic Multi-Domain Analysis & Live Real-Time Detection
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
      <div style={{ display: 'grid', gridTemplateColumns: result || loading ? '1fr 460px' : '1fr', gap: '1.75rem', transition: 'grid-template-columns 0.3s ease' }}>
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
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {wordCount} words
                {loading && <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />}
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

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".pdf,.txt"
                  style={{ display: 'none' }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
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
                  Upload PDF
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
              placeholder="Start typing or paste text here for real-time analysis (minimum 15-30 words)..."
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

          {/* Sensitivity and Mode Selectors */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Sensitivity Mode */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginRight: '0.25rem' }}>
                Detection Sensitivity:
              </span>
              {['Conservative', 'Balanced', 'Strict'].map(m => (
                <button
                  key={m}
                  onClick={() => {
                    setSensitivityMode(m);
                    setResult(null); // Clear result to force re-detection on mode change
                  }}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '9999px',
                    border: sensitivityMode === m ? '1px solid #6366f1' : '1px solid var(--border-color)',
                    backgroundColor: sensitivityMode === m ? 'rgba(99,102,241,0.12)' : 'var(--bg-surface)',
                    color: sensitivityMode === m ? '#6366f1' : 'var(--text-muted)',
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

          {error && (
            <p style={{ fontSize: '0.85rem', color: 'var(--color-spelling)' }}>
              {error}
            </p>
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
            {!result.success ? (
              <div style={{ padding: '1.5rem', borderRadius: '16px', backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid #f59e0b', color: 'var(--text-main)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b', fontWeight: 700, marginBottom: '0.5rem' }}>
                  <AlertTriangle size={18} />
                  <span>Insufficient Text or Invalid Request</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {result.limitations?.[0] || 'Unable to evaluate.'}
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
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                      AI WRITING PATTERN ESTIMATE
                    </span>

                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {resData.fallbackMode && (
                         <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '9999px',
                          backgroundColor: 'rgba(245,158,11,0.12)',
                          color: '#f59e0b'
                        }}>
                          Graceful Fallback Mode Active
                        </span>
                      )}

                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.55rem',
                        borderRadius: '9999px',
                        backgroundColor: 'rgba(99,102,241,0.12)',
                        color: '#6366f1'
                      }}>
                        Confidence: {resData.confidence}% ±{resData.uncertainty || 0}
                      </span>

                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.55rem',
                        borderRadius: '9999px',
                        backgroundColor: resData.reliability === 'high' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                        color: resData.reliability === 'high' ? '#10b981' : '#f59e0b',
                        textTransform: 'capitalize'
                      }}>
                        Reliability: {resData.reliability}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: resData.aiLikelihood > 50 ? 'var(--color-spelling)' : '#10b981', marginBottom: '0.25rem' }}>
                      {resData.aiLikelihood}% {resData.classification}
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Text analyzed: {result.evidence?.integrity?.preprocessed?.wordCount || 0} words
                    </p>
                  </div>

                  {/* Signal Metrics Progress Bars */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    {/* Human Pattern Signal */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Human-Pattern Signal</span>
                        <span style={{ fontWeight: 700, color: '#10b981' }}>{100 - resData.aiLikelihood}%</span>
                      </div>
                      <div style={{ height: '6px', borderRadius: '3px', backgroundColor: 'var(--border-color)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${100 - resData.aiLikelihood}%`, backgroundColor: '#10b981', transition: 'width 0.5s ease' }} />
                      </div>
                    </div>

                    {/* AI Pattern Signal */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>AI-Pattern Signal</span>
                        <span style={{ fontWeight: 700, color: resData.aiLikelihood > 50 ? 'var(--color-spelling)' : '#f59e0b' }}>{resData.aiLikelihood}%</span>
                      </div>
                      <div style={{ height: '6px', borderRadius: '3px', backgroundColor: 'var(--border-color)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${resData.aiLikelihood}%`, backgroundColor: resData.aiLikelihood > 50 ? 'var(--color-spelling)' : '#f59e0b', transition: 'width 0.5s ease' }} />
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
                  </div>
                </div>

                {/* Sentence Level Breakdown (if available) */}
                {result.sentences && result.sentences.length > 0 && (
                  <div style={{ padding: '1.25rem', borderRadius: '16px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.85rem' }}>
                      Sentence Analysis (V2.0 Highlight)
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
                      {result.sentences.map((s, idx) => (
                        <div key={idx} style={{ 
                          padding: '0.75rem', 
                          borderRadius: '8px', 
                          backgroundColor: 'var(--bg-app)', 
                          borderLeft: `4px solid ${s.aiLikelihood > 75 ? 'var(--color-spelling)' : (s.aiLikelihood > 50 ? '#f59e0b' : '#10b981')}` 
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Sentence {idx + 1}</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: s.aiLikelihood > 75 ? 'var(--color-spelling)' : (s.aiLikelihood > 50 ? '#f59e0b' : '#10b981') }}>
                              {s.aiLikelihood}% AI
                            </span>
                          </div>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.5, margin: 0 }}>
                            {s.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ padding: '1.25rem', borderRadius: '16px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.85rem' }}>
                    Active Evidence Families
                  </h4>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem' }}>
                    {(resData.activeFamilies || []).map((fam, idx) => (
                      <span key={idx} style={{ padding: '0.25rem 0.65rem', borderRadius: '6px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {fam}
                      </span>
                    ))}
                  </div>
                  
                  {resData.unavailableFamilies?.length > 0 && (
                      <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-color)' }}>
                         <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f59e0b', marginBottom: '0.5rem' }}>
                            Unavailable (Fallback Triggered)
                         </h4>
                         <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem' }}>
                            {(resData.unavailableFamilies || []).map((fam, idx) => (
                              <span key={idx} style={{ padding: '0.25rem 0.65rem', borderRadius: '6px', backgroundColor: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', fontSize: '0.8rem', color: '#f59e0b' }}>
                                {fam}
                              </span>
                            ))}
                          </div>
                      </div>
                  )}
                </div>

                <div style={{ padding: '1.25rem', borderRadius: '16px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                    Summary Insights
                  </h4>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>•</span>
                        <span style={{ lineHeight: 1.45 }}>Overall Agreement: {resData.agreementLevel}</span>
                      </li>
                      <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>•</span>
                        <span style={{ lineHeight: 1.45 }}>Evidence Coverage: {resData.evidenceCoverage}%</span>
                      </li>
                      {resData.mixedAuthorship && (
                        <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                          <span style={{ color: '#f59e0b', fontWeight: 700 }}>•</span>
                          <span style={{ lineHeight: 1.45, color: '#f59e0b' }}>Strong indicators of Mixed Authorship (Frankenstein Text).</span>
                        </li>
                      )}
                  </ul>
                </div>
                
                {/* Diagnostic Trace Section (Only shown if diagnostic trace is returned by backend) */}
                {result.diagnosticTrace && (
                  <div style={{ padding: '1rem', borderRadius: '12px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#94a3b8', fontSize: '0.7rem', overflowX: 'auto', whiteSpace: 'pre' }}>
                    <div style={{ fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>DEVELOPMENT DIAGNOSTIC TRACE</div>
                    {result.diagnosticTrace.trim()}
                  </div>
                )}

                {/* Disclaimer Alert */}
                <div style={{ padding: '1rem', borderRadius: '12px', backgroundColor: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                  <Info size={18} color="#6366f1" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {(result.limitations || []).map((lim, idx) => (
                       <p key={idx} style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                         {lim}
                       </p>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
