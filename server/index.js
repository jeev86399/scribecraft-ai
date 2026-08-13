import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import { initDb } from './config/db.js';
import authRoutes from './routes/auth.js';
import documentRoutes from './routes/documents.js';
import analysisRoutes from './routes/analysis.js';
import dictionaryRoutes from './routes/dictionary.js';
import userRoutes from './routes/user.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '5mb' }));

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

app.use('/api', apiLimiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', product: 'ScribeCraft AI Server', timestamp: new Date().toISOString() });
});

// Route Mounts
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/dictionary', dictionaryRoutes);
app.use('/api/user', userRoutes);

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Start database and server
async function startServer() {
  try {
    await initDb();
    const server = app.listen(PORT, () => {
      console.log(`✨ ScribeCraft AI Backend Server running on http://localhost:${PORT}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n⚠️ Port ${PORT} is currently in use by another process.`);
        console.error(`Try stopping the existing process running on port ${PORT} or change PORT in server/.env.\n`);
      } else {
        console.error('Server error:', err);
      }
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
