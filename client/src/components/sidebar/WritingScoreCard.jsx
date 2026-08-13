import React from 'react';
import { Award, CheckCircle, Eye, Sparkles, Send } from 'lucide-react';

export function WritingScoreCard({ score, breakdown, readability }) {
  // Determine score color accent
  let scoreColor = '#10b981'; // green
  if (score < 60) scoreColor = '#ef4444'; // red
  else if (score < 80) scoreColor = '#f59e0b'; // amber

  // SVG Ring Circle Math
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div style={{
      padding: '1.25rem',
      backgroundColor: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      {/* Header & Overall Circle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Overall Writing Score
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {readability?.label || 'Standard'} • {readability?.gradeLevel || 'Grade 8'}
          </p>
        </div>

        {/* SVG Progress Ring */}
        <div style={{ position: 'relative', width: '88px', height: '88px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="88" height="88" viewBox="0 0 88 88" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="44"
              cy="44"
              r={radius}
              stroke="var(--border-color)"
              strokeWidth="7"
              fill="transparent"
            />
            <circle
              cx="44"
              cy="44"
              r={radius}
              stroke={scoreColor}
              strokeWidth="7"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div style={{ position: 'absolute', textAlign: 'center' }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {score}
            </span>
          </div>
        </div>
      </div>

      {/* Sub-Score Breakdown Bars */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        {/* Correctness */}
        <div style={{ padding: '0.6rem', borderRadius: '8px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Correctness</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-spelling)' }}>{breakdown?.correctness || 100}</span>
          </div>
          <div style={{ height: '4px', borderRadius: '2px', backgroundColor: 'var(--border-color)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${breakdown?.correctness || 100}%`, backgroundColor: 'var(--color-spelling)', transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* Clarity */}
        <div style={{ padding: '0.6rem', borderRadius: '8px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Clarity</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-clarity)' }}>{breakdown?.clarity || 100}</span>
          </div>
          <div style={{ height: '4px', borderRadius: '2px', backgroundColor: 'var(--border-color)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${breakdown?.clarity || 100}%`, backgroundColor: 'var(--color-clarity)', transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* Engagement */}
        <div style={{ padding: '0.6rem', borderRadius: '8px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Engagement</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-tone)' }}>{breakdown?.engagement || 100}</span>
          </div>
          <div style={{ height: '4px', borderRadius: '2px', backgroundColor: 'var(--border-color)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${breakdown?.engagement || 100}%`, backgroundColor: 'var(--color-tone)', transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* Delivery */}
        <div style={{ padding: '0.6rem', borderRadius: '8px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Delivery</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-conciseness)' }}>{breakdown?.delivery || 100}</span>
          </div>
          <div style={{ height: '4px', borderRadius: '2px', backgroundColor: 'var(--border-color)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${breakdown?.delivery || 100}%`, backgroundColor: 'var(--color-conciseness)', transition: 'width 0.4s ease' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
