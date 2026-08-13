import { db } from '../config/db.js';

export async function listDocuments(req, res) {
  try {
    const docs = await db.all(
      'SELECT id, title, content, score, created_at, updated_at FROM documents WHERE user_id = ? ORDER BY updated_at DESC',
      [req.user.id]
    );

    // Calculate word count for preview
    const result = docs.map(doc => {
      const words = doc.content ? doc.content.trim().split(/\s+/).filter(Boolean).length : 0;
      return {
        ...doc,
        wordCount: words,
        preview: doc.content ? doc.content.slice(0, 140) : ''
      };
    });

    return res.json(result);
  } catch (err) {
    console.error('List documents error:', err);
    return res.status(500).json({ error: 'Failed to retrieve documents.' });
  }
}

export async function getDocument(req, res) {
  try {
    const { id } = req.params;
    const doc = await db.get('SELECT * FROM documents WHERE id = ? AND user_id = ?', [id, req.user.id]);

    if (!doc) {
      return res.status(404).json({ error: 'Document not found or access denied.' });
    }

    return res.json(doc);
  } catch (err) {
    console.error('Get document error:', err);
    return res.status(500).json({ error: 'Failed to retrieve document.' });
  }
}

export async function createDocument(req, res) {
  try {
    const { title, content } = req.body;
    const docId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const docTitle = title && title.trim() ? title.trim() : 'Untitled Document';
    const docContent = content || '';

    await db.run(
      'INSERT INTO documents (id, user_id, title, content, score) VALUES (?, ?, ?, ?, ?)',
      [docId, req.user.id, docTitle, docContent, 100]
    );

    // Create initial revision snapshot
    const revId = `rev_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const words = docContent ? docContent.trim().split(/\s+/).filter(Boolean).length : 0;
    await db.run(
      'INSERT INTO revisions (id, document_id, user_id, title, content, word_count) VALUES (?, ?, ?, ?, ?, ?)',
      [revId, docId, req.user.id, docTitle, docContent, words]
    );

    const newDoc = await db.get('SELECT * FROM documents WHERE id = ?', [docId]);
    return res.status(201).json(newDoc);
  } catch (err) {
    console.error('Create document error:', err);
    return res.status(500).json({ error: 'Failed to create document.' });
  }
}

export async function updateDocument(req, res) {
  try {
    const { id } = req.params;
    const { title, content, score } = req.body;

    const existing = await db.get('SELECT * FROM documents WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Document not found or access denied.' });
    }

    const updatedTitle = title !== undefined ? title : existing.title;
    const updatedContent = content !== undefined ? content : existing.content;
    const updatedScore = score !== undefined ? score : existing.score;

    await db.run(
      'UPDATE documents SET title = ?, content = ?, score = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [updatedTitle, updatedContent, updatedScore, id, req.user.id]
    );

    // Check if we should create a revision snapshot (if content changed significantly or > 5 minutes since last revision)
    if (updatedContent !== existing.content) {
      const lastRev = await db.get(
        'SELECT created_at, content FROM revisions WHERE document_id = ? ORDER BY created_at DESC LIMIT 1',
        [id]
      );

      const words = updatedContent ? updatedContent.trim().split(/\s+/).filter(Boolean).length : 0;
      const isSignificantlyDifferent = !lastRev || Math.abs(updatedContent.length - lastRev.content.length) > 30;

      if (isSignificantlyDifferent) {
        const revId = `rev_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        await db.run(
          'INSERT INTO revisions (id, document_id, user_id, title, content, word_count) VALUES (?, ?, ?, ?, ?, ?)',
          [revId, id, req.user.id, updatedTitle, updatedContent, words]
        );
      }
    }

    const doc = await db.get('SELECT * FROM documents WHERE id = ?', [id]);
    return res.json(doc);
  } catch (err) {
    console.error('Update document error:', err);
    return res.status(500).json({ error: 'Failed to update document.' });
  }
}

export async function deleteDocument(req, res) {
  try {
    const { id } = req.params;

    const existing = await db.get('SELECT id FROM documents WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Document not found or access denied.' });
    }

    await db.run('DELETE FROM documents WHERE id = ? AND user_id = ?', [id, req.user.id]);
    await db.run('DELETE FROM revisions WHERE document_id = ? AND user_id = ?', [id, req.user.id]);

    return res.json({ message: 'Document deleted successfully.', id });
  } catch (err) {
    console.error('Delete document error:', err);
    return res.status(500).json({ error: 'Failed to delete document.' });
  }
}

export async function duplicateDocument(req, res) {
  try {
    const { id } = req.params;

    const existing = await db.get('SELECT * FROM documents WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Document not found or access denied.' });
    }

    const newId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newTitle = `Copy of ${existing.title}`;

    await db.run(
      'INSERT INTO documents (id, user_id, title, content, score) VALUES (?, ?, ?, ?, ?)',
      [newId, req.user.id, newTitle, existing.content, existing.score]
    );

    const dupDoc = await db.get('SELECT * FROM documents WHERE id = ?', [newId]);
    return res.status(201).json(dupDoc);
  } catch (err) {
    console.error('Duplicate document error:', err);
    return res.status(500).json({ error: 'Failed to duplicate document.' });
  }
}

export async function getDocumentHistory(req, res) {
  try {
    const { id } = req.params;

    const doc = await db.get('SELECT id FROM documents WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found or access denied.' });
    }

    const revisions = await db.all(
      'SELECT id, document_id, title, content, word_count, created_at FROM revisions WHERE document_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 30',
      [id, req.user.id]
    );

    return res.json(revisions);
  } catch (err) {
    console.error('Get document history error:', err);
    return res.status(500).json({ error: 'Failed to retrieve document history.' });
  }
}

export async function restoreRevision(req, res) {
  try {
    const { id, revisionId } = req.params;

    const rev = await db.get(
      'SELECT * FROM revisions WHERE id = ? AND document_id = ? AND user_id = ?',
      [revisionId, id, req.user.id]
    );

    if (!rev) {
      return res.status(404).json({ error: 'Revision not found or access denied.' });
    }

    await db.run(
      'UPDATE documents SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [rev.title, rev.content, id, req.user.id]
    );

    const updatedDoc = await db.get('SELECT * FROM documents WHERE id = ?', [id]);
    return res.json(updatedDoc);
  } catch (err) {
    console.error('Restore revision error:', err);
    return res.status(500).json({ error: 'Failed to restore revision.' });
  }
}
