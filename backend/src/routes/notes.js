import express from 'express';
import { getNotes, createNote, updateNote, deleteNote } from '../controllers/noteController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/course/:courseId', authenticate, getNotes);
router.post('/', authenticate, createNote);
router.put('/:id', authenticate, updateNote);
router.delete('/:id', authenticate, deleteNote);

export default router;
