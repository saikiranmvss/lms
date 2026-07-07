import express from 'express';
import { getAiTutorResponse, runCodeProxy } from '../controllers/aiController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// AI Chatbot Route (requires authenticating the student)
router.post('/chat', authenticate, getAiTutorResponse);

// Code Execution Proxy Route
router.post('/run-code', authenticate, runCodeProxy);

export default router;
