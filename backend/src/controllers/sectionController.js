import pool from '../db/index.js';
import { sendError, sendSuccess } from '../utils/helpers.js';

const checkCourseOwnership = async (courseId, userId, role) => {
  const result = await pool.query('SELECT id FROM courses WHERE id = $1 AND instructor_id = $2', [courseId, userId]);
  return result.rows[0] || role === 'admin';
};

export const getSections = async (req, res) => {
  try {
    const { courseId } = req.params;
    const result = await pool.query(`
      SELECT s.*, json_agg(json_build_object(
        'id', l.id, 'title', l.title, 'type', l.type, 'duration_seconds', l.duration_seconds,
        'is_preview', l.is_preview, 'position', l.position, 'is_published', l.is_published,
        'video_url', l.video_url, 'content', l.content
      ) ORDER BY l.position) FILTER (WHERE l.id IS NOT NULL) as lessons
      FROM sections s LEFT JOIN lessons l ON l.section_id = s.id
      WHERE s.course_id = $1 GROUP BY s.id ORDER BY s.position
    `, [courseId]);
    sendSuccess(res, result.rows);
  } catch (err) {
    sendError(res, 500, 'Failed to fetch sections', err.message);
  }
};

export const createSection = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description } = req.body;
    if (!await checkCourseOwnership(courseId, req.user.id, req.user.role)) return sendError(res, 403, 'Not authorized');

    const posResult = await pool.query('SELECT COALESCE(MAX(position), -1) + 1 as pos FROM sections WHERE course_id = $1', [courseId]);
    const result = await pool.query(
      'INSERT INTO sections (course_id, title, description, position) VALUES ($1, $2, $3, $4) RETURNING *',
      [courseId, title, description, posResult.rows[0].pos]
    );
    sendSuccess(res, result.rows[0], 'Section created', 201);
  } catch (err) {
    sendError(res, 500, 'Failed to create section', err.message);
  }
};

export const updateSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    const result = await pool.query(
      'UPDATE sections SET title = COALESCE($1, title), description = COALESCE($2, description) WHERE id = $3 RETURNING *',
      [title, description, id]
    );
    sendSuccess(res, result.rows[0], 'Section updated');
  } catch (err) {
    sendError(res, 500, 'Failed to update section', err.message);
  }
};

export const deleteSection = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM sections WHERE id = $1', [id]);
    sendSuccess(res, null, 'Section deleted');
  } catch (err) {
    sendError(res, 500, 'Failed to delete section', err.message);
  }
};

export const reorderSections = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { order } = req.body; // array of {id, position}
    if (!await checkCourseOwnership(courseId, req.user.id, req.user.role)) return sendError(res, 403, 'Not authorized');

    for (const item of order) {
      await pool.query('UPDATE sections SET position = $1 WHERE id = $2 AND course_id = $3', [item.position, item.id, courseId]);
    }
    sendSuccess(res, null, 'Sections reordered');
  } catch (err) {
    sendError(res, 500, 'Failed to reorder sections', err.message);
  }
};
