import express from 'express';
import { enrollCourse, getMyEnrollments, updateProgress, getCourseProgress } from '../controllers/enrollmentController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/my', authenticate, getMyEnrollments);
router.post('/', authenticate, enrollCourse);
router.post('/progress', authenticate, updateProgress);
router.get('/progress/:courseId', authenticate, getCourseProgress);

export default router;
