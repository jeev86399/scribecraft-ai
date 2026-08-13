import { Router } from 'express';
import { updateProfile, updateSettings, clearAllDocuments, deleteAccount } from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.put('/profile', updateProfile);
router.put('/settings', updateSettings);
router.post('/clear-documents', clearAllDocuments);
router.delete('/account', deleteAccount);

export default router;
