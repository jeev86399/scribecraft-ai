import { analyzeTextService, rewriteTextService, paraphraseTextService } from '../services/aiService.js';
import { detectAITextService } from '../services/aiDetectorEngine.js';
import { humanizeTextService } from '../services/humanizerService.js';
import { synchronizeSuggestions } from '../services/positionSync.js';
import { db } from '../config/db.js';

export async function analyzeText(req, res) {
  try {
    const { text } = req.body;
    const userId = req.user ? req.user.id : null;

    if (text === undefined || text === null) {
      return res.status(400).json({ error: 'Text field is required.' });
    }

    let customDictionary = [];
    let enabledCategories = null;

    if (userId) {
      const dictRows = await db.all('SELECT word FROM dictionaries WHERE user_id = ?', [userId]);
      customDictionary = dictRows.map(r => r.word);

      const settings = await db.get('SELECT enabled_categories FROM user_settings WHERE user_id = ?', [userId]);
      if (settings && settings.enabled_categories) {
        try {
          enabledCategories = JSON.parse(settings.enabled_categories);
        } catch (e) {
          enabledCategories = null;
        }
      }
    }

    const result = await analyzeTextService(text, customDictionary, enabledCategories);

    // Ensure suggestion positions align accurately with input text
    const syncedSuggestions = synchronizeSuggestions(result.suggestions, text);

    return res.json({
      ...result,
      suggestions: syncedSuggestions
    });
  } catch (err) {
    console.error('Analyze text error:', err);
    return res.status(500).json({ error: 'Failed to analyze text.' });
  }
}

export async function rewriteText(req, res) {
  try {
    const { text, goal, targetTone } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text to rewrite is required.' });
    }

    const result = await rewriteTextService(text, goal || 'Improve clarity', targetTone || 'Professional');

    return res.json(result);
  } catch (err) {
    console.error('Rewrite text error:', err);
    return res.status(500).json({ error: 'Failed to rewrite text.' });
  }
}

export async function paraphraseText(req, res) {
  try {
    const { text, mode } = req.body;

    if (text === undefined || text === null) {
      return res.status(400).json({ error: 'Text to paraphrase is required.' });
    }

    const result = await paraphraseTextService(text, mode || 'Standard');

    return res.json(result);
  } catch (err) {
    console.error('Paraphrase text error:', err);
    return res.status(500).json({ error: 'Failed to paraphrase text.' });
  }
}

export async function detectAI(req, res) {
  try {
    const { text } = req.body;
    const userId = req.user ? req.user.id : null;

    if (text === undefined || text === null) {
      return res.status(400).json({ error: 'Text field is required.' });
    }

    const result = await detectAITextService(text);

    // Save history for authenticated users if analysis was valid
    if (userId && result.success) {
      const id = `det_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const resData = result.result;
      
      await db.run(
        `INSERT INTO ai_detections (
           id, user_id, word_count, ai_likelihood, human_likelihood, confidence, 
           classification_label, summary_reasons, detector_version, reliability, 
           evidence_coverage, active_families, unavailable_families, fallback_mode
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          userId,
          result.evidence?.integrity?.preprocessed?.wordCount || 0,
          resData.aiLikelihood,
          100 - resData.aiLikelihood,
          resData.confidence,
          resData.classification,
          JSON.stringify([resData.agreementLevel]), // Placeholder for reasons
          result.version,
          resData.reliability,
          resData.evidenceCoverage,
          JSON.stringify(resData.activeFamilies || []),
          JSON.stringify(resData.unavailableFamilies || []),
          resData.fallbackMode ? 1 : 0
        ]
      );
    }

    return res.json(result);
  } catch (err) {
    console.error('AI Detection error:', err);
    return res.status(500).json({ error: 'Failed to perform AI detection.' });
  }
}

export async function humanizeText(req, res) {
  try {
    const { text, mode } = req.body;
    const userId = req.user ? req.user.id : null;

    if (text === undefined || text === null || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text to humanize is required.' });
    }

    const result = await humanizeTextService(text, mode);
    
    // Save history for authenticated users
    if (userId && !result.error && result.humanizedText) {
      const id = `hum_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      await db.run(
        `INSERT INTO ai_humanizations (id, user_id, original_text, humanized_text, mode, before_score_likelihood, after_score_likelihood)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          userId,
          text,
          result.humanizedText,
          result.mode || 'natural',
          result.beforeScore?.aiLikelihood || null,
          result.afterScore?.aiLikelihood || null
        ]
      );
    }

    return res.json(result);
  } catch (err) {
    console.error('Humanize text error:', err);
    return res.status(500).json({ error: 'Failed to humanize text.' });
  }
}

export async function getAIDetectionHistory(req, res) {
  try {
    const userId = req.user.id;
    const history = await db.all(
      `SELECT id, word_count, ai_likelihood, human_likelihood, confidence, classification_label, summary_reasons, created_at,
              detector_version, reliability, evidence_coverage, active_families, unavailable_families, fallback_mode
       FROM ai_detections WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`,
      [userId]
    );

    const formatted = history.map(item => ({
      ...item,
      summary_reasons: JSON.parse(item.summary_reasons || '[]'),
      active_families: JSON.parse(item.active_families || '[]'),
      unavailable_families: JSON.parse(item.unavailable_families || '[]'),
      fallback_mode: item.fallback_mode === 1
    }));

    return res.json(formatted);
  } catch (err) {
    console.error('Get AI detection history error:', err);
    return res.status(500).json({ error: 'Failed to fetch detection history.' });
  }
}

export async function deleteAIDetectionHistory(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await db.run('DELETE FROM ai_detections WHERE id = ? AND user_id = ?', [id, userId]);
    return res.json({ message: 'History record deleted.', id });
  } catch (err) {
    console.error('Delete AI detection history error:', err);
    return res.status(500).json({ error: 'Failed to delete detection record.' });
  }
}

export async function getAIHumanizationHistory(req, res) {
  try {
    const userId = req.user.id;
    const history = await db.all(
      'SELECT id, original_text, humanized_text, mode, before_score_likelihood, after_score_likelihood, created_at FROM ai_humanizations WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [userId]
    );
    return res.json(history);
  } catch (err) {
    console.error('Get AI humanization history error:', err);
    return res.status(500).json({ error: 'Failed to fetch humanization history.' });
  }
}

export async function deleteAIHumanizationHistory(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await db.run('DELETE FROM ai_humanizations WHERE id = ? AND user_id = ?', [id, userId]);
    return res.json({ message: 'History record deleted.', id });
  } catch (err) {
    console.error('Delete AI humanization history error:', err);
    return res.status(500).json({ error: 'Failed to delete humanization record.' });
  }
}
