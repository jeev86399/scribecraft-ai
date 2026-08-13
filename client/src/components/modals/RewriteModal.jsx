import React, { useState } from 'react';
import { Wand2, X, Check, Loader2, RefreshCw, ArrowRight } from 'lucide-react';
import { api } from '../../services/api.js';
import { useDocument } from '../../context/DocumentContext.jsx';

export function RewriteModal({ isOpen, onClose }) {
  const { activeDocument, saveActiveDocument } = useDocument();

  const [goal, setGoal] = useState('Improve clarity');
  const [tone, setTone] = useState('Professional');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const originalText = activeDocument?.content || '';

  const goals = [
    'Improve clarity',
    'Make more concise',
    'Make more professional',
    'Make more formal',
    'Make friendlier',
    'Make more confident',
    'Simplify language',
    'Rewrite for academic writing'
  ];

  const tones = ['Professional', 'Formal', 'Friendly', 'Confident', 'Casual', 'Academic', 'Persuasive'];

  const handleGenerateRewrite = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.rewriteText(originalText, goal, tone);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to rewrite text');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRewrite = () => {
    if (result && result.rewrittenText) {
      saveActiveDocument({ content: result.rewrittenText });
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Wand2 size={18} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                AI Rewrite Assistant
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Transform your writing style, tone, or conciseness instantly.
              </p>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Goal & Tone Selectors */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
              Transformation Goal
            </label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-main)',
                fontSize: '0.85rem'
              }}
            >
              {goals.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
              Target Tone
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-main)',
                fontSize: '0.85rem'
              }}
            >
              {tones.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleGenerateRewrite}
          disabled={loading || !originalText.trim()}
          style={{
            width: '100%',
            padding: '0.65rem',
            borderRadius: '8px',
            backgroundColor: 'var(--primary)',
            color: '#ffffff',
            border: 'none',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            marginBottom: '1.25rem'
          }}
        >
          {loading ? (
            <>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Generating AI Rewrite...</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>Generate Proposed Rewrite</span>
            </>
          )}
        </button>

        {error && (
          <p style={{ fontSize: '0.85rem', color: 'var(--color-spelling)', marginBottom: '1rem' }}>
            {error}
          </p>
        )}

        {/* Side by Side Diff Preview */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Original */}
              <div style={{ padding: '0.85rem', borderRadius: '10px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Original Text</span>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', marginTop: '0.35rem', lineHeight: 1.5, maxHeight: '200px', overflowY: 'auto' }}>
                  {originalText}
                </p>
              </div>

              {/* Proposed Rewrite */}
              <div style={{ padding: '0.85rem', borderRadius: '10px', backgroundColor: 'rgba(16,185,129,0.06)', border: '1px solid #10b981' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>Proposed Rewrite</span>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', marginTop: '0.35rem', lineHeight: 1.5, maxHeight: '200px', overflowY: 'auto' }}>
                  {result.rewrittenText}
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              💡 {result.explanation}
            </p>

            {/* Accept / Reject Footer */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                onClick={handleAcceptRewrite}
                style={{
                  flex: 1,
                  padding: '0.65rem',
                  borderRadius: '8px',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <Check size={18} />
                Accept & Replace Document
              </button>

              <button
                onClick={() => setResult(null)}
                style={{
                  padding: '0.65rem 1.25rem',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-color)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Discard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
