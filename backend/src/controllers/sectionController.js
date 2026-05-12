import { randomUUID } from 'crypto';
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
      SELECT s.id, s.course_id, s.title, s.description, s.position, s.created_at,
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', j.id, 'title', j.title, 'type', j.type, 'duration_seconds', j.duration_seconds,
            'is_preview', j.is_preview, 'position', j.position, 'is_published', j.is_published,
            'video_url', j.video_url, 'content', j.content
          )
        )
        FROM (
          SELECT l.id, l.title, l.type, l.duration_seconds, l.is_preview, l.position, l.is_published, l.video_url, l.content
          FROM lessons l WHERE l.section_id = s.id ORDER BY l.position
        ) j
        ) AS lessons
      FROM sections s
      WHERE s.course_id = $1
      ORDER BY s.position
    `, [courseId]);
    for (const row of result.rows) {
      if (typeof row.lessons === 'string') {
        try { row.lessons = JSON.parse(row.lessons); } catch { row.lessons = []; }
      }
      if (!row.lessons) row.lessons = [];
    }
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
    const sid = randomUUID();
    await pool.query(
      'INSERT INTO sections (id, course_id, title, description, position) VALUES ($1, $2, $3, $4, $5)',
      [sid, courseId, title, description, posResult.rows[0].pos]
    );
    const result = await pool.query('SELECT * FROM sections WHERE id = $1', [sid]);
    sendSuccess(res, result.rows[0], 'Section created', 201);
  } catch (err) {
    sendError(res, 500, 'Failed to create section', err.message);
  }
};

export const updateSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    await pool.query(
      'UPDATE sections SET title = COALESCE($1, title), description = COALESCE($2, description) WHERE id = $3',
      [title, description, id]
    );
    const result = await pool.query('SELECT * FROM sections WHERE id = $1', [id]);
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
