import express from 'express';
import { createQuiz, getQuiz, addQuestion, submitQuiz, getQuizResults } from '../controllers/quizController.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticate, authorize('instructor', 'admin'), createQuiz);
router.get('/:id', optionalAuth, getQuiz);
router.post('/questions', authenticate, authorize('instructor', 'admin'), addQuestion);
router.post('/submit', authenticate, submitQuiz);
router.get('/:quizId/results', authenticate, getQuizResults);

export default router;
