import express from 'express';
import { getDashboardStats, getAllUsers, updateUserStatus, getAllCourses, approveCourse, getRevenueAnalytics, getInstructorAnalytics } from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard', authenticate, authorize('admin'), getDashboardStats);
router.get('/users', authenticate, authorize('admin'), getAllUsers);
router.patch('/users/:id', authenticate, authorize('admin'), updateUserStatus);
router.get('/courses', authenticate, authorize('admin'), getAllCourses);
router.patch('/courses/:id/approve', authenticate, authorize('admin'), approveCourse);
router.get('/revenue', authenticate, authorize('admin'), getRevenueAnalytics);
router.get('/instructor/analytics', authenticate, authorize('instructor', 'admin'), getInstructorAnalytics);

export default router;
