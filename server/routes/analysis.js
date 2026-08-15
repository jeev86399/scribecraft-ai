import { Router } from 'express';
import { 
  analyzeText, 
  rewriteText, 
  paraphraseText, 
  detectAI, 
  humanizeText,
  getAIDetectionHistory, 
  deleteAIDetectionHistory,
  getAIHumanizationHistory,
  deleteAIHumanizationHistory
} from '../controllers/analysisController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    return authenticateToken(req, res, next);
  }
  next();
}

router.post('/analyze', optionalAuth, analyzeText);
router.post('/rewrite', optionalAuth, rewriteText);
router.post('/paraphrase', optionalAuth, paraphraseText);
router.post('/detect-ai', optionalAuth, detectAI);
router.post('/humanize', optionalAuth, humanizeText);

router.get('/detect-ai/history', authenticateToken, getAIDetectionHistory);
router.delete('/detect-ai/history/:id', authenticateToken, deleteAIDetectionHistory);

router.get('/humanize/history', authenticateToken, getAIHumanizationHistory);
router.delete('/humanize/history/:id', authenticateToken, deleteAIHumanizationHistory);

export default router;
