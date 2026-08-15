import express from 'express';
import { getServiceStatus } from '../controllers/statusController.js';

const router = express.Router();

router.get('/', getServiceStatus);

export default router;
