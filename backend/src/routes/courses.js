import express from 'express';
import { getCourses, getCourseBySlug, createCourse, updateCourse, deleteCourse, publishCourse, getInstructorCourses, getCourseStudents, getFeaturedCourses } from '../controllers/courseController.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', optionalAuth, getCourses);
router.get('/featured', getFeaturedCourses);
router.get('/instructor/my-courses', authenticate, authorize('instructor', 'admin'), getInstructorCourses);
router.get('/:slug', optionalAuth, getCourseBySlug);
router.post('/', authenticate, authorize('instructor', 'admin'), createCourse);
router.put('/:id', authenticate, authorize('instructor', 'admin'), updateCourse);
router.delete('/:id', authenticate, authorize('instructor', 'admin'), deleteCourse);
router.patch('/:id/status', authenticate, authorize('instructor', 'admin'), publishCourse);
router.get('/:id/students', authenticate, authorize('instructor', 'admin'), getCourseStudents);

export default router;
