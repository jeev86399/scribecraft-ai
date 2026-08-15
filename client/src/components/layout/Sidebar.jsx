import React from 'react';
import { 
  FileText, 
  LayoutDashboard, 
  BookOpen, 
  Settings, 
  Plus, 
  LogOut, 
  Sparkles,
  UserCheck,
  ShieldCheck,
  Wand2,
  CheckCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDocument } from '../../context/DocumentContext.jsx';

export function Sidebar({ currentView, setCurrentView, onOpenDictionary, onOpenSettings, onOpenAuth }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { createNewDocument } = useDocument();

  const handleNewDoc = async () => {
    await createNewDocument('Untitled Document', '');
    setCurrentView('editor');
  };

  return (
    <aside className="app-sidebar">
      {/* Brand Header */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(99,102,241,0.4)'
        }}>
          <Sparkles size={20} color="#ffffff" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h1 style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#ffffff' }}>
            ScribeCraft<span style={{ color: '#818cf8', fontWeight: 800 }}>.AI</span> <span style={{ fontSize: '0.65rem', padding: '2px 5px', backgroundColor: '#3730a3', color: '#e0e7ff', borderRadius: '12px', marginLeft: '4px', verticalAlign: 'middle', fontWeight: 'bold' }}>v2.0</span>
          </h1>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Writing Assistant
          </span>
        </div>
      </div>

      {/* Primary Action */}
      <div style={{ padding: '1.25rem 1.25rem 0.5rem 1.25rem' }}>
        <button
          onClick={handleNewDoc}
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            backgroundColor: '#4f46e5',
            color: '#ffffff',
            border: 'none',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 14px rgba(79,70,229,0.35)',
            transition: 'all 0.2s ease'
          }}
        >
          <Plus size={18} />
          New Document
        </button>
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', overflowY: 'auto' }}>
        {/* Editor */}
        <button
          onClick={() => setCurrentView('editor')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.65rem 0.85rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: currentView === 'editor' ? 'rgba(99,102,241,0.15)' : 'transparent',
            color: currentView === 'editor' ? '#818cf8' : '#94a3b8',
            fontWeight: currentView === 'editor' ? 600 : 500,
            fontSize: '0.88rem',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.15s ease'
          }}
        >
          <FileText size={17} />
          Editor
        </button>

        {/* Dashboard */}
        <button
          onClick={() => setCurrentView('dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.65rem 0.85rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: currentView === 'dashboard' ? 'rgba(99,102,241,0.15)' : 'transparent',
            color: currentView === 'dashboard' ? '#818cf8' : '#94a3b8',
            fontWeight: currentView === 'dashboard' ? 600 : 500,
            fontSize: '0.88rem',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.15s ease'
          }}
        >
          <LayoutDashboard size={17} />
          Dashboard
        </button>

        {/* Paraphraser */}
        <button
          onClick={() => setCurrentView('paraphraser')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.65rem 0.85rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: currentView === 'paraphraser' ? 'rgba(16,185,129,0.15)' : 'transparent',
            color: currentView === 'paraphraser' ? '#10b981' : '#94a3b8',
            fontWeight: currentView === 'paraphraser' ? 600 : 500,
            fontSize: '0.88rem',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.15s ease'
          }}
        >
          <Wand2 size={17} />
          Paraphraser
        </button>

        {/* Grammar Checker */}
        <button
          onClick={() => setCurrentView('editor')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.65rem 0.85rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'transparent',
            color: '#94a3b8',
            fontWeight: 500,
            fontSize: '0.88rem',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.15s ease'
          }}
        >
          <CheckCheck size={17} />
          Grammar Checker
        </button>

        {/* AI Detector */}
        <button
          onClick={() => setCurrentView('detector')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.65rem 0.85rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: currentView === 'detector' ? 'rgba(6,182,212,0.15)' : 'transparent',
            color: currentView === 'detector' ? '#06b6d4' : '#94a3b8',
            fontWeight: currentView === 'detector' ? 600 : 500,
            fontSize: '0.88rem',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.15s ease'
          }}
        >
          <ShieldCheck size={17} />
          AI Detector
        </button>

        {/* AI Humanizer */}
        <button
          onClick={() => setCurrentView('humanizer')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.65rem 0.85rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: currentView === 'humanizer' ? 'rgba(20,184,166,0.15)' : 'transparent',
            color: currentView === 'humanizer' ? '#14b8a6' : '#94a3b8',
            fontWeight: currentView === 'humanizer' ? 600 : 500,
            fontSize: '0.88rem',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.15s ease'
          }}
        >
          <Wand2 size={17} />
          AI Humanizer
        </button>

        {/* Personal Dictionary */}
        <button
          onClick={onOpenDictionary}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.65rem 0.85rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'transparent',
            color: '#94a3b8',
            fontWeight: 500,
            fontSize: '0.88rem',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.15s ease'
          }}
        >
          <BookOpen size={17} />
          Personal Dictionary
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.65rem 0.85rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'transparent',
            color: '#94a3b8',
            fontWeight: 500,
            fontSize: '0.88rem',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.15s ease'
          }}
        >
          <Settings size={17} />
          Settings
        </button>
      </nav>

      {/* User Footer / Auth state */}
      <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {isAuthenticated ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#312e81',
                color: '#818cf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}>
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {user?.name}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '0.4rem',
                borderRadius: '6px'
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            style={{
              width: '100%',
              padding: '0.65rem',
              borderRadius: '8px',
              backgroundColor: 'rgba(255,255,255,0.08)',
              color: '#f8fafc',
              border: '1px solid rgba(255,255,255,0.1)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <UserCheck size={16} />
            Sign In / Register
          </button>
        )}
      </div>
    </aside>
  );
}
