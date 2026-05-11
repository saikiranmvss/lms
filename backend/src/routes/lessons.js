import express from 'express';
import { createLesson, updateLesson, deleteLesson, getLesson, reorderLessons, addResource } from '../controllers/lessonController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticate, authorize('instructor', 'admin'), createLesson);
router.post('/resources', authenticate, authorize('instructor', 'admin'), addResource);
router.put('/reorder', authenticate, authorize('instructor', 'admin'), reorderLessons);
router.get('/:id', authenticate, getLesson);
router.put('/:id', authenticate, authorize('instructor', 'admin'), updateLesson);
router.delete('/:id', authenticate, authorize('instructor', 'admin'), deleteLesson);

export default router;
