import React from 'react';
import { FileText, Type, AlignLeft, Clock, Copy, Trash2 } from 'lucide-react';
import { useAnalysis } from '../../context/AnalysisContext.jsx';
import { useDocument } from '../../context/DocumentContext.jsx';

export function StatsBar({ onClear, onCopy }) {
  const { stats } = useAnalysis();
  const { activeDocument } = useDocument();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.75rem 1.25rem',
      backgroundColor: 'var(--bg-surface)',
      borderTop: '1px solid var(--border-color)',
      borderRadius: '0 0 12px 12px',
      fontSize: '0.8rem',
      color: 'var(--text-muted)'
    }}>
      {/* Counters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <FileText size={14} color="#6366f1" />
          <span><strong>{stats.words || 0}</strong> words</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Type size={14} color="#10b981" />
          <span><strong>{stats.characters || 0}</strong> chars</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <AlignLeft size={14} color="#f59e0b" />
          <span><strong>{stats.sentences || 0}</strong> sentences</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Clock size={14} color="#8b5cf6" />
          <span><strong>{stats.readingTimeMinutes || 1}</strong> min read</span>
        </div>
      </div>

      {/* Quick Utilities */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          onClick={onCopy}
          title="Copy text to clipboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.35rem 0.6rem',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'transparent',
            color: 'var(--text-muted)',
            fontSize: '0.78rem',
            cursor: 'pointer'
          }}
        >
          <Copy size={13} />
          Copy
        </button>

        <button
          onClick={onClear}
          title="Clear editor text"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.35rem 0.6rem',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'transparent',
            color: 'var(--color-spelling)',
            fontSize: '0.78rem',
            cursor: 'pointer'
          }}
        >
          <Trash2 size={13} />
          Clear
        </button>
      </div>
    </div>
  );
}
