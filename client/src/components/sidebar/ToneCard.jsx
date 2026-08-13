import React from 'react';
import { Volume2, Smile, Briefcase, GraduationCap, Zap, Shield, Sparkles } from 'lucide-react';

export function ToneCard({ tone }) {
  const primaryTone = tone?.primary || 'Neutral';
  const breakdown = tone?.breakdown || { Neutral: 100 };

  const getToneIcon = (t) => {
    switch (t) {
      case 'Professional': return <Briefcase size={14} color="#6366f1" />;
      case 'Friendly': return <Smile size={14} color="#10b981" />;
      case 'Academic': return <GraduationCap size={14} color="#8b5cf6" />;
      case 'Confident': return <Zap size={14} color="#f59e0b" />;
      case 'Assertive': return <Shield size={14} color="#ef4444" />;
      default: return <Volume2 size={14} color="#06b6d4" />;
    }
  };

  return (
    <div style={{
      padding: '1.25rem',
      backgroundColor: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-color)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Sparkles size={16} color="#8b5cf6" />
          <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Detected Tone
          </h3>
        </div>

        <span style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          padding: '0.25rem 0.65rem',
          borderRadius: '9999px',
          backgroundColor: 'rgba(139,92,246,0.12)',
          color: '#8b5cf6',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem'
        }}>
          {getToneIcon(primaryTone)}
          {primaryTone}
        </span>
      </div>

      {/* Tone Breakdown Percentages */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {Object.entries(breakdown).slice(0, 3).map(([name, pct]) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>{name}</span>
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
