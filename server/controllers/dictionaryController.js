import { db } from '../config/db.js';

export async function listDictionary(req, res) {
  try {
    const words = await db.all(
      'SELECT id, word, created_at FROM dictionaries WHERE user_id = ? ORDER BY word ASC',
      [req.user.id]
    );
    return res.json(words);
  } catch (err) {
    console.error('List dictionary error:', err);
    return res.status(500).json({ error: 'Failed to fetch personal dictionary.' });
  }
}

export async function addWord(req, res) {
  try {
    const { word } = req.body;

    if (!word || typeof word !== 'string' || word.trim().length === 0) {
      return res.status(400).json({ error: 'Word is required.' });
    }

    const cleanWord = word.trim().toLowerCase();

    if (cleanWord.length > 50) {
      return res.status(400).json({ error: 'Word length cannot exceed 50 characters.' });
    }

    const id = `dict_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    try {
      await db.run(
        'INSERT INTO dictionaries (id, user_id, word) VALUES (?, ?, ?)',
        [id, req.user.id, cleanWord]
      );
    } catch (e) {
      if (e.message && e.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ error: `'${cleanWord}' is already in your dictionary.` });
      }
      throw e;
    }

    const newEntry = await db.get('SELECT * FROM dictionaries WHERE id = ?', [id]);
    return res.status(201).json(newEntry);
  } catch (err) {
    console.error('Add dictionary word error:', err);
    return res.status(500).json({ error: 'Failed to add word to dictionary.' });
  }
}

export async function deleteWord(req, res) {
  try {
    const { id } = req.params;

    const existing = await db.get('SELECT id FROM dictionaries WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Word not found in dictionary.' });
    }

    await db.run('DELETE FROM dictionaries WHERE id = ? AND user_id = ?', [id, req.user.id]);
    return res.json({ message: 'Word removed from dictionary.', id });
  } catch (err) {
    console.error('Delete dictionary word error:', err);
    return res.status(500).json({ error: 'Failed to delete word from dictionary.' });
  }
}
