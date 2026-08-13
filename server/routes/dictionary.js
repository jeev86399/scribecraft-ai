import { Router } from 'express';
import { listDictionary, addWord, deleteWord } from '../controllers/dictionaryController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', listDictionary);
router.post('/', addWord);
router.delete('/:id', deleteWord);

export default router;
