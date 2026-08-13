import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Trash2, 
  Copy, 
  Clock, 
  Sparkles, 
  BarChart3, 
  CheckCircle2, 
  BookOpen, 
  ArrowRight 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDocument } from '../../context/DocumentContext.jsx';

export function Dashboard({ onOpenDoc }) {
  const { user } = useAuth();
  const { documents, createNewDocument, deleteDocument, duplicateDocument } = useDocument();

  const [searchQuery, setSearchQuery] = useState('');

  const templates = [
    { title: 'Executive Email Pitch', content: 'Dear [Name],\n\nI am writing to share a brief update regarding our strategic initiative...', goal: 'Professional' },
    { title: 'Academic Essay Draft', content: 'Introduction:\nThe rapid evolution of artificial intelligence in modern workflows raises critical questions...', goal: 'Academic' },
    { title: 'Product Announcement', content: 'We are thrilled to introduce ScribeCraft AI 2.0! Built from the ground up to empower writers...', goal: 'Persuasive' },
    { title: 'Blog Post Outline', content: 'Title: 5 Ways to Improve Your Writing Today\n\n1. Cut unnecessary filler words\n2. Prefer active voice...', goal: 'Casual' }
  ];

  const handleTemplateClick = async (tpl) => {
    const doc = await createNewDocument(tpl.title, tpl.content);
    onOpenDoc(doc.id);
  };

  const filteredDocs = documents.filter(d =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.content && d.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const avgScore = documents.length > 0
    ? Math.round(documents.reduce((acc, d) => acc + (d.score || 100), 0) / documents.length)
    : 100;

  const totalWords = documents.reduce((acc, d) => {
    return acc + (d.content ? d.content.trim().split(/\s+/).filter(Boolean).length : 0);
  }, 0);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 3rem', backgroundColor: 'var(--bg-app)' }}>
      {/* Welcome Banner */}
      <div style={{
        padding: '2rem',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
        color: '#ffffff',
        marginBottom: '2rem',
        boxShadow: '0 10px 25px rgba(49,46,129,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ zIndex: 10, maxWidth: '600px' }}>
          <span style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '0.25rem 0.65rem',
            borderRadius: '9999px',
            backgroundColor: 'rgba(255,255,255,0.15)',
            color: '#c7d2fe',
            marginBottom: '0.75rem',
            display: 'inline-block'
          }}>
            Welcome Back
          </span>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
            Ready to craft your next piece, {user?.name || 'Writer'}?
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#e0e7ff', lineHeight: 1.5, opacity: 0.9 }}>
            ScribeCraft AI is ready to analyze, polish, and optimize your writing in real time.
          </p>
        </div>

        <button
          onClick={async () => {
            const newDoc = await createNewDocument();
            onOpenDoc(newDoc.id);
          }}
          style={{
            zIndex: 10,
            padding: '0.85rem 1.4rem',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            color: '#312e81',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
            transition: 'transform 0.2s ease'
          }}
        >
          <Plus size={20} />
          Create New Document
        </button>
      </div>

      {/* Analytics Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {/* Total Documents */}
        <div style={{ padding: '1.25rem', borderRadius: '16px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Documents</span>
            <FileText size={20} color="#6366f1" />
          </div>
          <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>{documents.length}</span>
        </div>

        {/* Avg Writing Score */}
        <div style={{ padding: '1.25rem', borderRadius: '16px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Average Quality</span>
            <CheckCircle2 size={20} color="#10b981" />
          </div>
          <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>{avgScore}%</span>
        </div>

        {/* Total Words Written */}
        <div style={{ padding: '1.25rem', borderRadius: '16px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Words Written</span>
            <BookOpen size={20} color="#8b5cf6" />
          </div>
          <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>{totalWords.toLocaleString()}</span>
        </div>

        {/* Productive Insights */}
        <div style={{ padding: '1.25rem', borderRadius: '16px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Writing Status</span>
            <Sparkles size={20} color="#f59e0b" />
          </div>
          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981' }}>Active & Ready</span>
        </div>
      </div>

      {/* Templates Section */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem' }}>
          Quick Start Templates
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {templates.map((tpl, i) => (
            <div
              key={i}
              onClick={() => handleTemplateClick(tpl)}
              style={{
                padding: '1.25rem',
                borderRadius: '14px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                backgroundColor: 'rgba(99,102,241,0.1)',
                color: '#6366f1',
                marginBottom: '0.5rem',
                display: 'inline-block'
              }}>
                {tpl.goal}
              </span>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                {tpl.title}
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {tpl.content}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Documents Table */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Recent Documents ({filteredDocs.length})
          </h3>

          {/* Search Input */}
          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              style={{
                width: '100%',
                padding: '0.45rem 0.75rem 0.45rem 2.2rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {filteredDocs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <FileText size={36} color="var(--text-muted)" style={{ marginBottom: '0.5rem' }} />
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No documents found.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {filteredDocs.map(doc => (
              <div
                key={doc.id}
                onClick={() => onOpenDoc(doc.id)}
                style={{
                  padding: '1.25rem',
                  borderRadius: '14px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-sm)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {doc.title || 'Untitled Document'}
                    </h4>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981' }}>
                      {doc.score || 100}%
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {doc.preview || doc.content || 'Empty document...'}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>{doc.wordCount || 0} words</span>
                  
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); duplicateDocument(doc.id); }}
                      title="Duplicate document"
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}
                    >
                      <Copy size={15} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteDocument(doc.id); }}
                      title="Delete document"
                      style={{ background: 'none', border: 'none', color: 'var(--color-spelling)', cursor: 'pointer', padding: '0.2rem' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
