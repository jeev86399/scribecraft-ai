import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';
import { useAuth } from './AuthContext.jsx';

const DocumentContext = createContext();

const DEFAULT_SAMPLE_CONTENT = `Welcome to ScribeCraft AI!

This is a live, interactive document created to showcase your new AI writing assistant.

Here is a quick sample paragraph with deliberate issues so you can test real-time AI suggestions:
"We made a decision to utilize this system in order to improve our writting. Becuase there is a apple on the table, they is going to take it. We should of checked basic fundamentals before starting."

Try clicking any highlighted text, exploring the quality score in the right sidebar, or choosing an AI rewrite option!`;

export function DocumentProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [activeDocument, setActiveDocument] = useState(null);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(null);

  // Load documents when user logs in
  const loadDocuments = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingDocs(true);
    try {
      const list = await api.listDocuments();
      setDocuments(list);
      if (list.length > 0 && !activeDocument) {
        setActiveDocument(list[0]);
      } else if (list.length === 0) {
        // Create initial default document for new user
        const initialDoc = await api.createDocument('Getting Started with ScribeCraft AI', DEFAULT_SAMPLE_CONTENT);
        setDocuments([initialDoc]);
        setActiveDocument(initialDoc);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoadingDocs(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDocuments();
    } else {
      // Guest demo mode document
      const guestDoc = {
        id: 'guest_doc_demo',
        title: 'Untitled Document',
        content: DEFAULT_SAMPLE_CONTENT,
        score: 85,
        updated_at: new Date().toISOString()
      };
      setDocuments([guestDoc]);
      setActiveDocument(guestDoc);
    }
  }, [isAuthenticated, loadDocuments]);

  const openDocument = async (id) => {
    if (isAuthenticated) {
      try {
        const doc = await api.getDocument(id);
        setActiveDocument(doc);
      } catch (err) {
        console.error('Failed to fetch document:', err);
      }
    } else {
      const found = documents.find(d => d.id === id);
      if (found) setActiveDocument(found);
    }
  };

  const createNewDocument = async (title = 'Untitled Document', content = '') => {
    if (isAuthenticated) {
      const newDoc = await api.createDocument(title, content);
      setDocuments(prev => [newDoc, ...prev]);
      setActiveDocument(newDoc);
      return newDoc;
    } else {
      const guestDoc = {
        id: `guest_${Date.now()}`,
        title,
        content,
        score: 100,
        updated_at: new Date().toISOString()
      };
      setDocuments(prev => [guestDoc, ...prev]);
      setActiveDocument(guestDoc);
      return guestDoc;
    }
  };

  const saveActiveDocument = async (updates) => {
    if (!activeDocument) return;

    const updatedDoc = {
      ...activeDocument,
      ...updates,
      updated_at: new Date().toISOString()
    };

    setActiveDocument(updatedDoc);
    setDocuments(prev => prev.map(d => d.id === updatedDoc.id ? updatedDoc : d));

    if (isAuthenticated && !updatedDoc.id.startsWith('guest_')) {
      setIsAutosaving(true);
      try {
        await api.updateDocument(updatedDoc.id, {
          title: updatedDoc.title,
          content: updatedDoc.content,
          score: updatedDoc.score
        });
        setLastSavedTime(new Date());
      } catch (err) {
        console.error('Autosave error:', err);
      } finally {
        setIsAutosaving(false);
      }
    } else {
      setLastSavedTime(new Date());
    }
  };

  const deleteDocument = async (id) => {
    if (isAuthenticated && !id.startsWith('guest_')) {
      await api.deleteDocument(id);
    }
    const remaining = documents.filter(d => d.id !== id);
    setDocuments(remaining);
    if (activeDocument && activeDocument.id === id) {
      setActiveDocument(remaining.length > 0 ? remaining[0] : null);
    }
  };

  const duplicateDocument = async (id) => {
    if (isAuthenticated && !id.startsWith('guest_')) {
      const dup = await api.duplicateDocument(id);
      setDocuments(prev => [dup, ...prev]);
      setActiveDocument(dup);
      return dup;
    } else {
      const target = documents.find(d => d.id === id);
      if (!target) return;
      const dup = {
        ...target,
        id: `guest_${Date.now()}`,
        title: `Copy of ${target.title}`,
        updated_at: new Date().toISOString()
      };
      setDocuments(prev => [dup, ...prev]);
      setActiveDocument(dup);
      return dup;
    }
  };

  return (
    <DocumentContext.Provider value={{
      documents,
      activeDocument,
      loadingDocs,
      isAutosaving,
      lastSavedTime,
      loadDocuments,
      openDocument,
      createNewDocument,
      saveActiveDocument,
      deleteDocument,
      duplicateDocument
    }}>
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocument() {
  return useContext(DocumentContext);
}
