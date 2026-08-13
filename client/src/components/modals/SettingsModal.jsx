import React, { useState } from 'react';
import { Settings, X, User, Shield, Check, Trash2, AlertTriangle, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api.js';

export function SettingsModal({ isOpen, onClose }) {
  const { user, settings, updateProfile, updateSettings, logout, isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState('profile');

  // Profile Form
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState(null);

  // Settings Form
  const [variant, setVariant] = useState(settings?.preferred_variant || 'US');
  const [goal, setGoal] = useState(settings?.writing_goal || 'General');
  const [tone, setTone] = useState(settings?.default_tone || 'Neutral');
  const [categories, setCategories] = useState(
    settings?.enabled_categories || ['spelling', 'grammar', 'punctuation', 'clarity', 'conciseness', 'word_choice', 'tone', 'style']
  );
  const [settingsMsg, setSettingsMsg] = useState(null);

  if (!isOpen) return null;

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileMsg(null);
    try {
      await updateProfile({ name, email, currentPassword, newPassword });
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message });
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsMsg(null);
    try {
      await updateSettings({
        preferred_variant: variant,
        writing_goal: goal,
        default_tone: tone,
        enabled_categories: categories
      });
      setSettingsMsg({ type: 'success', text: 'Preferences saved successfully!' });
    } catch (err) {
      setSettingsMsg({ type: 'error', text: err.message });
    }
  };

  const toggleCategory = (cat) => {
    setCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleClearDocs = async () => {
    if (window.confirm('Are you sure you want to delete ALL your documents? This action cannot be undone.')) {
      try {
        await api.clearDocuments();
        alert('All documents have been cleared.');
        window.location.reload();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('CRITICAL WARNING: Are you sure you want to permanently delete your account and all data?')) {
      try {
        await api.deleteAccount();
        logout();
        onClose();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={20} color="#6366f1" />
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Account & Writing Settings
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Manage your account profile, feedback preferences, and privacy.
              </p>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
          <button
            onClick={() => setActiveTab('profile')}
            style={{
              padding: '0.55rem 1rem',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: activeTab === 'profile' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'profile' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: activeTab === 'profile' ? 700 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Profile
          </button>

          <button
            onClick={() => setActiveTab('preferences')}
            style={{
              padding: '0.55rem 1rem',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: activeTab === 'preferences' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'preferences' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: activeTab === 'preferences' ? 700 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Writing Preferences
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            style={{
              padding: '0.55rem 1rem',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: activeTab === 'privacy' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'privacy' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: activeTab === 'privacy' ? 700 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Privacy & Danger Zone
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {!isAuthenticated ? (
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                You are currently using guest mode. Sign in to customize your profile!
              </p>
            ) : (
              <>
                {profileMsg && (
                  <p style={{ fontSize: '0.82rem', color: profileMsg.type === 'error' ? 'var(--color-spelling)' : '#10b981' }}>
                    {profileMsg.text}
                  </p>
                )}

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '0.88rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '0.88rem' }}
                  />
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem' }}>Change Password</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <input
                      type="password"
                      placeholder="Current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                    />
                    <input
                      type="password"
                      placeholder="New password (min 6 chars)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  style={{
                    padding: '0.65rem',
                    borderRadius: '8px',
                    backgroundColor: 'var(--primary)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    marginTop: '0.5rem'
                  }}
                >
                  <Save size={16} />
                  Save Profile Changes
                </button>
              </>
            )}
          </form>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {settingsMsg && (
              <p style={{ fontSize: '0.82rem', color: settingsMsg.type === 'error' ? 'var(--color-spelling)' : '#10b981' }}>
                {settingsMsg.text}
              </p>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>English Dialect</label>
                <select
                  value={variant}
                  onChange={(e) => setVariant(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                >
                  <option value="US">American English (US)</option>
                  <option value="UK">British English (UK)</option>
                  <option value="CA">Canadian English (CA)</option>
                  <option value="AU">Australian English (AU)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Writing Goal</label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                >
                  <option value="General">General Writing</option>
                  <option value="Academic">Academic / Research</option>
                  <option value="Business">Business / Executive</option>
                  <option value="Email">Email Communication</option>
                  <option value="Creative">Creative Storytelling</option>
                </select>
              </div>
            </div>

            {/* Category Toggles */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Enabled Feedback Categories</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {['spelling', 'grammar', 'punctuation', 'clarity', 'conciseness', 'word_choice', 'tone', 'style'].map(cat => (
                  <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={categories.includes(cat)}
                      onChange={() => toggleCategory(cat)}
                    />
                    <span style={{ textTransform: 'capitalize' }}>{cat.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              style={{
                padding: '0.65rem',
                borderRadius: '8px',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem'
              }}
            >
              <Save size={16} />
              Save Preferences
            </button>
          </form>
        )}

        {/* Privacy & Danger Zone Tab */}
        {activeTab === 'privacy' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ padding: '1rem', borderRadius: '10px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                Clear All Saved Documents
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Permanently delete all documents and revisions associated with your account.
              </p>
              <button
                onClick={handleClearDocs}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  backgroundColor: 'transparent',
                  color: 'var(--color-spelling)',
                  border: '1px solid var(--color-spelling)',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                Clear All Documents
              </button>
            </div>

            {isAuthenticated && (
              <div style={{ padding: '1rem', borderRadius: '10px', backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid var(--color-spelling)' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-spelling)', marginBottom: '0.35rem' }}>
                  Delete Account
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  Permanently delete your user account, custom dictionary, and all document data.
                </p>
                <button
                  onClick={handleDeleteAccount}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    backgroundColor: 'var(--color-spelling)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  Delete Account Permanently
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
