import express from 'express';
import { addReview, getCourseReviews, deleteReview } from '../controllers/reviewController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/course/:courseId', getCourseReviews);
router.post('/', authenticate, addReview);
router.delete('/:id', authenticate, deleteReview);

export default router;
