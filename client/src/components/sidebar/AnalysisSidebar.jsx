import React from 'react';
import { Check, X, CheckCheck, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { useAnalysis } from '../../context/AnalysisContext.jsx';
import { WritingScoreCard } from './WritingScoreCard.jsx';
import { ToneCard } from './ToneCard.jsx';

export function AnalysisSidebar() {
  const {
    activeSuggestions,
    score,
    scoreBreakdown,
    readability,
    tone,
    categoryFilter,
    setCategoryFilter,
    acceptSuggestion,
    ignoreSuggestion,
    fixAllCompatible,
    activeIssueId,
    setActiveIssueId
  } = useAnalysis();

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'spelling', label: 'Spelling' },
    { id: 'grammar', label: 'Grammar' },
    { id: 'clarity', label: 'Clarity' },
    { id: 'conciseness', label: 'Conciseness' }
  ];

  const autoFixableCount = activeSuggestions.filter(s => s.autoFixable && s.suggestedReplacement !== s.originalText).length;

  return (
    <aside className="analysis-sidebar">
      {/* Score Card */}
      <WritingScoreCard score={score} breakdown={scoreBreakdown} readability={readability} />

      {/* Tone Card */}
      <ToneCard tone={tone} />

      {/* Category Filter Pills */}
      <div style={{ padding: '0.85rem 1.25rem 0.5rem 1.25rem', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Issues ({activeSuggestions.length})
          </h3>

          {autoFixableCount > 0 && (
            <button
              onClick={fixAllCompatible}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                backgroundColor: 'rgba(16,185,129,0.12)',
                color: '#10b981',
                border: 'none',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <CheckCheck size={14} />
              Fix All ({autoFixableCount})
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.35rem' }}>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              style={{
                padding: '0.3rem 0.65rem',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: categoryFilter === cat.id ? 'var(--primary)' : 'var(--bg-app)',
                color: categoryFilter === cat.id ? '#ffffff' : 'var(--text-muted)',
                fontSize: '0.75rem',
                fontWeight: categoryFilter === cat.id ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Suggestions List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        {activeSuggestions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(16,185,129,0.12)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.85rem auto'
            }}>
              <CheckCheck size={24} />
            </div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              Great job! No issues found.
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Your writing looks clear, concise, and accurate. Keep going!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {activeSuggestions.map(sugg => {
              const isSelected = activeIssueId === sugg.id;
              return (
                <div
                  key={sugg.id}
                  onClick={() => setActiveIssueId(sugg.id)}
                  style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    backgroundColor: isSelected ? 'rgba(99,102,241,0.06)' : 'var(--bg-app)',
                    border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                    boxShadow: isSelected ? 'var(--shadow-md)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Category Pill & Severity */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      padding: '0.15rem 0.45rem',
                      borderRadius: '4px',
                      backgroundColor: `var(--color-${sugg.category || 'clarity'})`,
                      color: '#ffffff'
                    }}>
                      {sugg.category}
                    </span>

                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      {sugg.severity}
                    </span>
                  </div>

                  {/* Original vs Replacement */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                    <span style={{ textDecoration: 'line-through', color: 'var(--color-spelling)', fontWeight: 600, fontSize: '0.9rem' }}>
                      {sugg.originalText}
                    </span>
                    <ArrowRight size={14} color="var(--text-muted)" />
                    <span style={{ color: 'var(--color-conciseness)', fontWeight: 700, fontSize: '0.95rem' }}>
                      {sugg.suggestedReplacement}
                    </span>
                  </div>

                  {/* Explanation */}
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '0.75rem' }}>
                    {sugg.explanation}
                  </p>

                  {/* Card Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); acceptSuggestion(sugg.id); }}
                      style={{
                        flex: 1,
                        padding: '0.4rem 0.65rem',
                        borderRadius: '6px',
                        backgroundColor: 'var(--primary)',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <Check size={13} />
                      Accept
                    </button>

                    <button
                      onClick={(e) => { e.stopPropagation(); ignoreSuggestion(sugg.id); }}
                      style={{
                        padding: '0.4rem 0.65rem',
                        borderRadius: '6px',
                        backgroundColor: 'transparent',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border-color)',
                        fontSize: '0.78rem',
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}
                    >
                      Ignore
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
