import bcrypt from 'bcryptjs';
import { db } from '../config/db.js';

export async function updateProfile(req, res) {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    let updatedName = user.name;
    let updatedEmail = user.email;
    let updatedPasswordHash = user.password_hash;

    if (name && name.trim()) {
      updatedName = name.trim();
    }

    if (email && email.trim() && email.toLowerCase().trim() !== user.email) {
      const emailClean = email.toLowerCase().trim();
      const existing = await db.get('SELECT id FROM users WHERE email = ? AND id != ?', [emailClean, userId]);
      if (existing) {
        return res.status(409).json({ error: 'Email address is already in use.' });
      }
      updatedEmail = emailClean;
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to set a new password.' });
      }
      const validPass = await bcrypt.compare(currentPassword, user.password_hash);
      if (!validPass) {
        return res.status(401).json({ error: 'Current password does not match.' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      }
      updatedPasswordHash = await bcrypt.hash(newPassword, 10);
    }

    await db.run(
      'UPDATE users SET name = ?, email = ?, password_hash = ? WHERE id = ?',
      [updatedName, updatedEmail, updatedPasswordHash, userId]
    );

    return res.json({
      user: { id: userId, name: updatedName, email: updatedEmail }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ error: 'Failed to update user profile.' });
  }
}

export async function updateSettings(req, res) {
  try {
    const { preferred_variant, writing_goal, default_tone, enabled_categories } = req.body;
    const userId = req.user.id;

    const existing = await db.get('SELECT user_id FROM user_settings WHERE user_id = ?', [userId]);

    const categoriesJson = enabled_categories ? JSON.stringify(enabled_categories) : null;

    if (existing) {
      await db.run(
        `UPDATE user_settings SET 
          preferred_variant = COALESCE(?, preferred_variant),
          writing_goal = COALESCE(?, writing_goal),
          default_tone = COALESCE(?, default_tone),
          enabled_categories = COALESCE(?, enabled_categories),
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?`,
        [preferred_variant, writing_goal, default_tone, categoriesJson, userId]
      );
    } else {
      await db.run(
        `INSERT INTO user_settings (user_id, preferred_variant, writing_goal, default_tone, enabled_categories)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, preferred_variant || 'US', writing_goal || 'General', default_tone || 'Neutral', categoriesJson || '[]']
      );
    }

    const updated = await db.get('SELECT * FROM user_settings WHERE user_id = ?', [userId]);
    return res.json({
      ...updated,
      enabled_categories: JSON.parse(updated.enabled_categories || '[]')
    });
  } catch (err) {
    console.error('Update settings error:', err);
    return res.status(500).json({ error: 'Failed to update settings.' });
  }
}

export async function clearAllDocuments(req, res) {
  try {
    const userId = req.user.id;
    await db.run('DELETE FROM documents WHERE user_id = ?', [userId]);
    await db.run('DELETE FROM revisions WHERE user_id = ?', [userId]);
    return res.json({ message: 'All user documents cleared successfully.' });
  } catch (err) {
    console.error('Clear documents error:', err);
    return res.status(500).json({ error: 'Failed to clear documents.' });
  }
}

export async function deleteAccount(req, res) {
  try {
    const userId = req.user.id;
    await db.run('DELETE FROM users WHERE id = ?', [userId]);
    await db.run('DELETE FROM documents WHERE user_id = ?', [userId]);
    await db.run('DELETE FROM revisions WHERE user_id = ?', [userId]);
    await db.run('DELETE FROM dictionaries WHERE user_id = ?', [userId]);
    await db.run('DELETE FROM user_settings WHERE user_id = ?', [userId]);
    return res.json({ message: 'Account deleted successfully.' });
  } catch (err) {
    console.error('Delete account error:', err);
    return res.status(500).json({ error: 'Failed to delete account.' });
  }
}
