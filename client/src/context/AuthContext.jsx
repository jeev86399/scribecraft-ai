import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('scribecraft_token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function initAuth() {
      if (token) {
        try {
          const data = await api.getCurrentUser();
          setUser(data.user);
          setSettings(data.settings);
        } catch (err) {
          console.warn('Session check failed:', err.message);
          logout();
        }
      }
      setLoading(false);
    }
    initAuth();
  }, [token]);

  const login = async (email, password) => {
    setError(null);
    try {
      const data = await api.login(email, password);
      localStorage.setItem('scribecraft_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const signup = async (name, email, password) => {
    setError(null);
    try {
      const data = await api.signup(name, email, password);
      localStorage.setItem('scribecraft_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('scribecraft_token');
    setToken(null);
    setUser(null);
    setSettings(null);
  };

  const updateProfile = async (data) => {
    const res = await api.updateProfile(data);
    setUser(res.user);
    return res;
  };

  const updateSettings = async (data) => {
    const res = await api.updateSettings(data);
    setSettings(res);
    return res;
  };

  return (
    <AuthContext.Provider value={{
      user,
      settings,
      token,
      isAuthenticated: !!user,
      loading,
      error,
      login,
      signup,
      logout,
      updateProfile,
      updateSettings
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
