import express from 'express';
import { createLesson, updateLesson, deleteLesson, getLesson, reorderLessons, addResource } from '../controllers/lessonController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/:id', authenticate, getLesson);
router.post('/', authenticate, authorize('instructor', 'admin'), createLesson);
router.put('/:id', authenticate, authorize('instructor', 'admin'), updateLesson);
router.delete('/:id', authenticate, authorize('instructor', 'admin'), deleteLesson);
router.put('/reorder', authenticate, authorize('instructor', 'admin'), reorderLessons);
router.post('/resources', authenticate, authorize('instructor', 'admin'), addResource);

export default router;
