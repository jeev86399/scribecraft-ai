import { Router } from 'express';
import {
  listDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  duplicateDocument,
  getDocumentHistory,
  restoreRevision
} from '../controllers/documentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', listDocuments);
router.post('/', createDocument);
router.get('/:id', getDocument);
router.put('/:id', updateDocument);
router.delete('/:id', deleteDocument);
router.post('/:id/duplicate', duplicateDocument);
router.get('/:id/history', getDocumentHistory);
router.post('/:id/history/:revisionId/restore', restoreRevision);

export default router;
