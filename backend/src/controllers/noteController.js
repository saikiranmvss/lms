import pool from '../db/index.js';
import { sendError, sendSuccess } from '../utils/helpers.js';

export const getNotes = async (req, res) => {
  try {
    const { courseId } = req.params;
    const result = await pool.query(
      'SELECT n.*, l.title as lesson_title FROM notes n LEFT JOIN lessons l ON n.lesson_id = l.id WHERE n.student_id = $1 AND n.course_id = $2 ORDER BY n.created_at DESC',
      [req.user.id, courseId]
    );
    sendSuccess(res, result.rows);
  } catch (err) {
    sendError(res, 500, 'Failed to fetch notes', err.message);
  }
};

export const createNote = async (req, res) => {
  try {
    const { lessonId, courseId, content, timestampSeconds } = req.body;
    const result = await pool.query(
      'INSERT INTO notes (student_id, lesson_id, course_id, content, timestamp_seconds) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.user.id, lessonId, courseId, content, timestampSeconds || 0]
    );
    sendSuccess(res, result.rows[0], 'Note saved', 201);
  } catch (err) {
    sendError(res, 500, 'Failed to save note', err.message);
  }
};

export const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const result = await pool.query(
      'UPDATE notes SET content = $1, updated_at = NOW() WHERE id = $2 AND student_id = $3 RETURNING *',
      [content, id, req.user.id]
    );
    sendSuccess(res, result.rows[0], 'Note updated');
  } catch (err) {
    sendError(res, 500, 'Failed to update note', err.message);
  }
};

export const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM notes WHERE id = $1 AND student_id = $2', [id, req.user.id]);
    sendSuccess(res, null, 'Note deleted');
  } catch (err) {
    sendError(res, 500, 'Failed to delete note', err.message);
  }
};
