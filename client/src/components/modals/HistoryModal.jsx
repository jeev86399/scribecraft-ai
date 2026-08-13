import React, { useState, useEffect } from 'react';
import { History, X, RotateCcw, Clock, Loader2, FileText } from 'lucide-react';
import { api } from '../../services/api.js';
import { useDocument } from '../../context/DocumentContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export function HistoryModal({ isOpen, onClose }) {
  const { activeDocument, saveActiveDocument } = useDocument();
  const { isAuthenticated } = useAuth();

  const [revisions, setRevisions] = useState([]);
  const [selectedRev, setSelectedRev] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchHistory() {
      if (!isOpen || !activeDocument || !isAuthenticated || activeDocument.id.startsWith('guest_')) return;
      setLoading(true);
      try {
        const list = await api.getDocumentHistory(activeDocument.id);
        setRevisions(list);
        if (list.length > 0) setSelectedRev(list[0]);
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [isOpen, activeDocument, isAuthenticated]);

  if (!isOpen) return null;

  const handleRestore = async () => {
    if (!selectedRev || !activeDocument) return;
    if (window.confirm('Restore this revision to your document?')) {
      if (isAuthenticated && !activeDocument.id.startsWith('guest_')) {
        await api.restoreRevision(activeDocument.id, selectedRev.id);
      }
      saveActiveDocument({
        title: selectedRev.title,
        content: selectedRev.content
      });
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '780px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={20} color="#6366f1" />
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Revision History
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                View document snapshots and restore previous versions anytime.
              </p>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: '#6366f1' }} />
          </div>
        ) : revisions.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <Clock size={32} color="var(--text-muted)" style={{ marginBottom: '0.5rem' }} />
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              No revision history found yet. Revisions are created automatically as you make major edits.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1.25rem', height: '360px' }}>
            {/* Timeline sidebar */}
            <div style={{ borderRight: '1px solid var(--border-color)', paddingRight: '1rem', overflowY: 'auto' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>
                Saved Snapshots ({revisions.length})
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {revisions.map(rev => {
                  const isSelected = selectedRev?.id === rev.id;
                  const dateStr = new Date(rev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div
                      key={rev.id}
                      onClick={() => setSelectedRev(rev)}
                      style={{
                        padding: '0.6rem 0.75rem',
                        borderRadius: '8px',
                        backgroundColor: isSelected ? 'rgba(99,102,241,0.12)' : 'var(--bg-app)',
                        border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isSelected ? '#6366f1' : 'var(--text-main)', display: 'block' }}>
                        {dateStr}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {rev.word_count || 0} words
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Version Preview */}
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ flex: 1, backgroundColor: 'var(--bg-app)', borderRadius: '10px', border: '1px solid var(--border-color)', padding: '1rem', overflowY: 'auto' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Version Preview</span>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginTop: '0.5rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {selectedRev?.content || 'Empty snapshot...'}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  onClick={handleRestore}
                  disabled={!selectedRev}
                  style={{
                    padding: '0.65rem 1.25rem',
                    borderRadius: '8px',
                    backgroundColor: 'var(--primary)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <RotateCcw size={16} />
                  Restore This Version
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
