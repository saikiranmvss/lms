import express from 'express';
import { getAiTutorResponse } from '../controllers/aiController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// AI Chatbot Route (requires authenticating the student)
router.post('/chat', authenticate, getAiTutorResponse);

export default router;
