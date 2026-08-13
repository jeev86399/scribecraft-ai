import React from 'react';
import { 
  Sparkles, 
  History, 
  RotateCcw, 
  RotateCw, 
  CheckCircle2, 
  Loader2, 
  Wand2,
  Sun,
  Moon
} from 'lucide-react';
import { useDocument } from '../../context/DocumentContext.jsx';
import { useAnalysis } from '../../context/AnalysisContext.jsx';

export function Topbar({ onOpenHistory, onOpenRewrite, theme, toggleTheme }) {
  const { activeDocument, saveActiveDocument, isAutosaving } = useDocument();
  const { isAnalyzing, runAnalysis } = useAnalysis();

  const handleTitleChange = (e) => {
    saveActiveDocument({ title: e.target.value });
  };

  return (
    <header className="app-topbar">
      {/* Title & Save Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
        <input
          type="text"
          value={activeDocument?.title || ''}
          onChange={handleTitleChange}
          placeholder="Untitled Document"
          style={{
            fontSize: '1.15rem',
            fontWeight: 700,
            color: 'var(--text-main)',
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            maxWidth: '320px',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            overflow: 'hidden'
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {isAutosaving ? (
            <>
              <Loader2 size={14} className="spin-animation" style={{ animation: 'spin 1s linear infinite' }} />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={14} color="#10b981" />
              <span>Saved</span>
            </>
          )}
        </div>
      </div>

      {/* Action Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        {/* Revision History */}
        <button
          onClick={onOpenHistory}
          title="Revision History"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 0.75rem',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-main)',
            fontSize: '0.82rem',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          <History size={16} />
          <span style={{ display: 'var(--hide-mobile, inline)' }}>History</span>
        </button>

        {/* AI Rewrite Action */}
        <button
          onClick={onOpenRewrite}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 0.85rem',
            borderRadius: '8px',
            border: 'none',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            color: '#ffffff',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(99,102,241,0.25)'
          }}
        >
          <Wand2 size={16} />
          <span>AI Rewrite</span>
        </button>

        {/* Manual Re-Analyze */}
        <button
          onClick={() => runAnalysis(activeDocument?.content || '')}
          disabled={isAnalyzing}
          title="Re-analyze document"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 0.75rem',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-main)',
            fontSize: '0.82rem',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          <Sparkles size={16} color="#6366f1" className={isAnalyzing ? 'spin-animation' : ''} />
          <span>{isAnalyzing ? 'Analyzing...' : 'Analyze'}</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title="Toggle Dark/Light Mode"
          style={{
            padding: '0.5rem',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-main)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
        </button>
      </div>
    </header>
  );
}
