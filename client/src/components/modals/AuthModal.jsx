import React, { useState } from 'react';
import { UserCheck, X, LogIn, UserPlus, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export function AuthModal({ isOpen, onClose }) {
  const { login, signup } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await signup(name, email, password);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserCheck size={20} color="#6366f1" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {mode === 'login' ? 'Sign In to ScribeCraft' : 'Create Account'}
            </h3>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', borderRadius: '8px', backgroundColor: 'var(--bg-app)', padding: '0.25rem', marginBottom: '1.25rem' }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            style={{
              flex: 1,
              padding: '0.45rem',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: mode === 'login' ? 'var(--bg-surface)' : 'transparent',
              color: mode === 'login' ? 'var(--text-main)' : 'var(--text-muted)',
              fontWeight: mode === 'login' ? 700 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: mode === 'login' ? 'var(--shadow-sm)' : 'none'
            }}
          >
            Sign In
          </button>

          <button
            type="button"
            onClick={() => { setMode('signup'); setError(null); }}
            style={{
              flex: 1,
              padding: '0.45rem',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: mode === 'signup' ? 'var(--bg-surface)' : 'transparent',
              color: mode === 'signup' ? 'var(--text-main)' : 'var(--text-muted)',
              fontWeight: mode === 'signup' ? 700 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: mode === 'signup' ? 'var(--shadow-sm)' : 'none'
            }}
          >
            Register
          </button>
        </div>

        {error && (
          <p style={{ fontSize: '0.82rem', color: 'var(--color-spelling)', marginBottom: '1rem', textAlign: 'center' }}>
            {error}
          </p>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {mode === 'signup' && (
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '0.88rem' }}
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '0.88rem' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '0.88rem' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.7rem',
              borderRadius: '8px',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginTop: '0.5rem'
            }}
          >
            {loading ? (
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            ) : mode === 'login' ? (
              <>
                <LogIn size={18} />
                Sign In
              </>
            ) : (
              <>
                <UserPlus size={18} />
                Create Free Account
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
