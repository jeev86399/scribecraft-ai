const API_BASE = 'http://localhost:5001/api';

function getAuthHeaders() {
  const token = localStorage.getItem('scribecraft_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {})
    }
  };

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || `HTTP ${response.status}: Request failed`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  signup: (name, email, password) => request('/auth/signup', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getCurrentUser: () => request('/auth/me'),

  // Documents
  listDocuments: () => request('/documents'),
  getDocument: (id) => request(`/documents/${id}`),
  createDocument: (title, content) => request('/documents', { method: 'POST', body: JSON.stringify({ title, content }) }),
  updateDocument: (id, data) => request(`/documents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDocument: (id) => request(`/documents/${id}`, { method: 'DELETE' }),
  duplicateDocument: (id) => request(`/documents/${id}/duplicate`, { method: 'POST' }),
  getDocumentHistory: (id) => request(`/documents/${id}/history`),
  restoreRevision: (id, revisionId) => request(`/documents/${id}/history/${revisionId}/restore`, { method: 'POST' }),

  // Analysis, Paraphrase, AI Detection & Humanizer
  analyzeText: (text) => request('/analysis/analyze', { method: 'POST', body: JSON.stringify({ text }) }),
  rewriteText: (text, goal, targetTone) => request('/analysis/rewrite', { method: 'POST', body: JSON.stringify({ text, goal, targetTone }) }),
  paraphrase: (text, mode) => request('/analysis/paraphrase', { method: 'POST', body: JSON.stringify({ text, mode }) }),
  detectAI: (text) => request('/analysis/detect-ai', { method: 'POST', body: JSON.stringify({ text }) }),
  humanizeText: (text, mode) => request('/analysis/humanize', { method: 'POST', body: JSON.stringify({ text, mode }) }),
  getAIDetectionHistory: () => request('/analysis/detect-ai/history'),
  deleteAIDetectionHistory: (id) => request(`/analysis/detect-ai/history/${id}`, { method: 'DELETE' }),
  getAIHumanizationHistory: () => request('/analysis/humanize/history'),
  deleteAIHumanizationHistory: (id) => request(`/analysis/humanize/history/${id}`, { method: 'DELETE' }),

  // Dictionary
  listDictionary: () => request('/dictionary'),
  addWord: (word) => request('/dictionary', { method: 'POST', body: JSON.stringify({ word }) }),
  deleteWord: (id) => request(`/dictionary/${id}`, { method: 'DELETE' }),

  // User & Settings
  updateProfile: (data) => request('/user/profile', { method: 'PUT', body: JSON.stringify(data) }),
  updateSettings: (data) => request('/user/settings', { method: 'PUT', body: JSON.stringify(data) }),
  clearDocuments: () => request('/user/clear-documents', { method: 'POST' }),
  deleteAccount: () => request('/user/account', { method: 'DELETE' })
};
