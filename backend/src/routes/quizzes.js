import express from 'express';
import { createQuiz, updateQuiz, getQuiz, getQuizByLesson, addQuestion, updateQuestion, deleteQuestion, submitQuiz, getQuizResults } from '../controllers/quizController.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticate, authorize('instructor', 'admin'), createQuiz);
router.post('/questions', authenticate, authorize('instructor', 'admin'), addQuestion);
router.post('/submit', authenticate, submitQuiz);
router.get('/lesson/:lessonId', authenticate, getQuizByLesson);
router.get('/:id', optionalAuth, getQuiz);
router.get('/:quizId/results', authenticate, getQuizResults);
router.put('/:id', authenticate, authorize('instructor', 'admin'), updateQuiz);
router.put('/questions/:id', authenticate, authorize('instructor', 'admin'), updateQuestion);
router.delete('/questions/:id', authenticate, authorize('instructor', 'admin'), deleteQuestion);

export default router;
