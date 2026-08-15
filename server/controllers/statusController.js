import { db } from '../config/db.js';
import { isGeminiConfigured } from '../services/aiConfig.js';
import { pingMLDetector } from '../services/ml-detector-client.js';

export async function getServiceStatus(req, res) {
  try {
    // 1. Check DB
    let dbStatus = 'ok';
    try {
      db.prepare('SELECT 1').get();
    } catch (err) {
      dbStatus = 'error';
    }

    // 2. Check Gemini
    const geminiStatus = isGeminiConfigured() ? 'configured' : 'missing_key';

    // 3. Check ML Detector
    const mlOnline = await pingMLDetector();
    const mlStatus = mlOnline ? 'online' : 'offline';

    res.json({
      version: '2.0',
      status: 'ok',
      services: {
        database: dbStatus,
        gemini: geminiStatus,
        ml_detector: mlStatus,
        rule_engine: 'online'
      }
    });
  } catch (error) {
    console.error('Error fetching status:', error);
    res.status(500).json({ error: 'Failed to retrieve service status' });
  }
}
