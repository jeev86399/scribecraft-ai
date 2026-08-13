import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'scribecraft_jwt_secret_key_prod_quality_2026';

export async function signup(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const passwordHash = await bcrypt.hash(password, 10);

    await db.run(
      'INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)',
      [userId, name.trim(), email.toLowerCase().trim(), passwordHash]
    );

    // Initialize user settings
    await db.run(
      'INSERT INTO user_settings (user_id) VALUES (?)',
      [userId]
    );

    const token = jwt.sign({ id: userId, email: email.toLowerCase().trim(), name }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      token,
      user: { id: userId, name: name.trim(), email: email.toLowerCase().trim() }
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Server error during sign up.' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during login.' });
  }
}

export async function getCurrentUser(req, res) {
  try {
    const user = await db.get('SELECT id, name, email, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const settings = await db.get('SELECT * FROM user_settings WHERE user_id = ?', [req.user.id]);

    return res.json({
      user,
      settings: settings ? {
        ...settings,
        enabled_categories: JSON.parse(settings.enabled_categories || '[]')
      } : null
    });
  } catch (err) {
    console.error('Get current user error:', err);
    return res.status(500).json({ error: 'Server error fetching user profile.' });
  }
}
