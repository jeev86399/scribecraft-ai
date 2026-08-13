import React, { useState, useEffect } from 'react';
import { BookOpen, X, Plus, Trash2, Loader2, Check } from 'lucide-react';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';

export function DictionaryModal({ isOpen, onClose }) {
  const { isAuthenticated } = useAuth();
  const [words, setWords] = useState([]);
  const [newWord, setNewWord] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadDict() {
      if (!isOpen || !isAuthenticated) return;
      setLoading(true);
      try {
        const list = await api.listDictionary();
        setWords(list);
      } catch (err) {
        console.error('Failed to load dictionary:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDict();
  }, [isOpen, isAuthenticated]);

  if (!isOpen) return null;

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newWord.trim()) return;

    if (!isAuthenticated) {
      setError('Please sign in to save words to your personal dictionary.');
      return;
    }

    setError(null);
    try {
      const added = await api.addWord(newWord.trim());
      setWords(prev => [...prev, added]);
      setNewWord('');
    } catch (err) {
      setError(err.message || 'Failed to add word.');
    }
  };

  const handleDelete = async (id) => {
    if (isAuthenticated) {
      await api.deleteWord(id);
    }
    setWords(prev => prev.filter(w => w.id !== id));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={20} color="#6366f1" />
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Personal Dictionary
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Custom terms and jargon in your dictionary will not trigger spelling warnings.
              </p>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Add Word Input Form */}
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <input
            type="text"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            placeholder="Add custom word (e.g. Kubernetify)"
            style={{
              flex: 1,
              padding: '0.6rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--text-main)',
              fontSize: '0.88rem',
              outline: 'none'
            }}
          />

          <button
            type="submit"
            style={{
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <Plus size={16} />
            Add Word
          </button>
        </form>

        {error && (
          <p style={{ fontSize: '0.82rem', color: 'var(--color-spelling)', marginBottom: '1rem' }}>
            {error}
          </p>
        )}

        {/* Word List */}
        <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.5rem' }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: '#6366f1' }} />
            </div>
          ) : words.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No custom words saved yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {words.map(w => (
                <div
                  key={w.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-app)'
                  }}
                >
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {w.word}
                  </span>

                  <button
                    onClick={() => handleDelete(w.id)}
                    title="Remove word"
                    style={{ background: 'none', border: 'none', color: 'var(--color-spelling)', cursor: 'pointer' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
