import express from 'express';
import { getMyCertificates, getCertificate } from '../controllers/certificateController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/my', authenticate, getMyCertificates);
router.get('/:id', getCertificate);

export default router;
