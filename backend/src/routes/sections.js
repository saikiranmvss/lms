import express from 'express';
import { getSections, createSection, updateSection, deleteSection, reorderSections } from '../controllers/sectionController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/course/:courseId', getSections);
router.post('/course/:courseId', authenticate, authorize('instructor', 'admin'), createSection);
router.put('/:id', authenticate, authorize('instructor', 'admin'), updateSection);
router.delete('/:id', authenticate, authorize('instructor', 'admin'), deleteSection);
router.put('/course/:courseId/reorder', authenticate, authorize('instructor', 'admin'), reorderSections);

export default router;
