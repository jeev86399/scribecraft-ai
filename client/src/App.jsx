import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext.jsx';
import { DocumentProvider, useDocument } from './context/DocumentContext.jsx';
import { AnalysisProvider } from './context/AnalysisContext.jsx';

import { Sidebar } from './components/layout/Sidebar.jsx';
import { Topbar } from './components/layout/Topbar.jsx';
import { RichEditor } from './components/editor/RichEditor.jsx';
import { AnalysisSidebar } from './components/sidebar/AnalysisSidebar.jsx';
import { Dashboard } from './components/dashboard/Dashboard.jsx';
import { Paraphraser } from './components/paraphraser/Paraphraser.jsx';
import { AIDetector } from './components/detector/AIDetector.jsx';

import { RewriteModal } from './components/modals/RewriteModal.jsx';
import { HistoryModal } from './components/modals/HistoryModal.jsx';
import { DictionaryModal } from './components/modals/DictionaryModal.jsx';
import { SettingsModal } from './components/modals/SettingsModal.jsx';
import { AuthModal } from './components/modals/AuthModal.jsx';

function MainAppContent() {
  const { openDocument } = useDocument();

  // Read initial view from URL hash or default to 'editor'
  const getInitialView = () => {
    const hash = window.location.hash.replace('#', '');
    if (['editor', 'dashboard', 'paraphraser', 'detector'].includes(hash)) {
      return hash;
    }
    return 'editor';
  };

  const [currentView, setCurrentView] = useState(getInitialView()); // 'editor' | 'dashboard' | 'paraphraser' | 'detector'
  const [theme, setTheme] = useState(localStorage.getItem('scribecraft_theme') || 'dark');

  // Modal dialog states
  const [rewriteOpen, setRewriteOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [dictOpen, setDictOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('scribecraft_theme', theme);
  }, [theme]);

  // Sync view state with URL hash
  const handleSetView = (view) => {
    setCurrentView(view);
    window.location.hash = view;
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleOpenDocFromDashboard = (docId) => {
    openDocument(docId);
    handleSetView('editor');
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        setCurrentView={handleSetView}
        onOpenDictionary={() => setDictOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenAuth={() => setAuthOpen(true)}
      />

      {/* Main Workspace */}
      <div className="app-main">
        <Topbar
          onOpenHistory={() => setHistoryOpen(true)}
          onOpenRewrite={() => setRewriteOpen(true)}
          theme={theme}
          toggleTheme={toggleTheme}
        />

        {/* View Switcher: Editor vs Dashboard vs Paraphraser vs AI Detector */}
        {currentView === 'dashboard' ? (
          <Dashboard onOpenDoc={handleOpenDocFromDashboard} />
        ) : currentView === 'paraphraser' ? (
          <Paraphraser />
        ) : currentView === 'detector' ? (
          <AIDetector />
        ) : (
          <div className="content-workspace">
            <div className="editor-canvas-container">
              <RichEditor onOpenDictionary={() => setDictOpen(true)} />
            </div>
            <AnalysisSidebar />
          </div>
        )}
      </div>

      {/* Modals */}
      <RewriteModal isOpen={rewriteOpen} onClose={() => setRewriteOpen(false)} />
      <HistoryModal isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />
      <DictionaryModal isOpen={dictOpen} onClose={() => setDictOpen(false)} />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DocumentProvider>
        <AnalysisProvider>
          <MainAppContent />
        </AnalysisProvider>
      </DocumentProvider>
    </AuthProvider>
  );
}
