import express from 'express';
import { getDiscussions, createDiscussion, deleteDiscussion, pinDiscussion } from '../controllers/discussionController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/lesson/:lessonId', authenticate, getDiscussions);
router.post('/', authenticate, createDiscussion);
router.delete('/:id', authenticate, deleteDiscussion);
router.patch('/:id/pin', authenticate, authorize('instructor', 'admin'), pinDiscussion);

export default router;
