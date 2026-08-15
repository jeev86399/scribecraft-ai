import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../scribecraft.db');

const verboseSqlite = sqlite3.verbose();
const rawDb = new verboseSqlite.Database(dbPath);

// Enable foreign keys
rawDb.run('PRAGMA foreign_keys = ON');

export const db = {
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      rawDb.get(sql, params, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      rawDb.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      rawDb.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }
};

export async function initDb() {
  await db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      score INTEGER DEFAULT 100,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS revisions (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      word_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS dictionaries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      word TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, word),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY,
      preferred_variant TEXT DEFAULT 'US',
      writing_goal TEXT DEFAULT 'General',
      default_tone TEXT DEFAULT 'Neutral',
      enabled_categories TEXT DEFAULT '["spelling","grammar","punctuation","clarity","conciseness","readability","word_choice","sentence_structure","tone","style"]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS ai_detections (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      word_count INTEGER NOT NULL,
      ai_likelihood INTEGER NOT NULL,
      human_likelihood INTEGER NOT NULL,
      confidence TEXT NOT NULL,
      classification_label TEXT NOT NULL,
      summary_reasons TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS ai_humanizations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      original_text TEXT NOT NULL,
      humanized_text TEXT NOT NULL,
      mode TEXT NOT NULL,
      before_score_likelihood INTEGER,
      after_score_likelihood INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  console.log('Database initialized successfully at:', dbPath);
}
