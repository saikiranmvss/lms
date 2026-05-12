import { randomUUID } from 'crypto';
import pool from '../db/index.js';
import { sendError, sendSuccess } from '../utils/helpers.js';

export const createLesson = async (req, res) => {
  try {
    const { sectionId, courseId, title, description, type, videoUrl, content, durationSeconds, isPreview } = req.body;
    const posResult = await pool.query('SELECT COALESCE(MAX(position), -1) + 1 as pos FROM lessons WHERE section_id = $1', [sectionId]);
    const lid = randomUUID();
    await pool.query(`
      INSERT INTO lessons (id, section_id, course_id, title, description, type, video_url, content, duration_seconds, is_preview, position)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    `, [lid, sectionId, courseId, title, description, type || 'video', videoUrl, content, durationSeconds || 0, isPreview ? 1 : 0, posResult.rows[0].pos]);

    await pool.query('UPDATE courses SET total_lessons = total_lessons + 1, duration_seconds = duration_seconds + $1 WHERE id = $2', [durationSeconds || 0, courseId]);
    const result = await pool.query('SELECT * FROM lessons WHERE id = $1', [lid]);
    sendSuccess(res, result.rows[0], 'Lesson created', 201);
  } catch (err) {
    sendError(res, 500, 'Failed to create lesson', err.message);
  }
};

export const updateLesson = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, type, videoUrl, content, durationSeconds, isPreview, isPublished } = req.body;
    await pool.query(`
      UPDATE lessons SET
        title = COALESCE($1, title), description = COALESCE($2, description),
        type = COALESCE($3, type), video_url = COALESCE($4, video_url),
        content = COALESCE($5, content), duration_seconds = COALESCE($6, duration_seconds),
        is_preview = COALESCE($7, is_preview), is_published = COALESCE($8, is_published),
        updated_at = NOW()
      WHERE id = $9
    `, [title, description, type, videoUrl, content, durationSeconds, isPreview, isPublished, id]);
    const result = await pool.query('SELECT * FROM lessons WHERE id = $1', [id]);
    sendSuccess(res, result.rows[0], 'Lesson updated');
  } catch (err) {
    sendError(res, 500, 'Failed to update lesson', err.message);
  }
};

export const deleteLesson = async (req, res) => {
  try {
    const { id } = req.params;
    const lesson = await pool.query('SELECT * FROM lessons WHERE id = $1', [id]);
    if (!lesson.rows[0]) return sendError(res, 404, 'Lesson not found');
    await pool.query('DELETE FROM lessons WHERE id = $1', [id]);
    await pool.query('UPDATE courses SET total_lessons = GREATEST(0, total_lessons - 1) WHERE id = $1', [lesson.rows[0].course_id]);
    sendSuccess(res, null, 'Lesson deleted');
  } catch (err) {
    sendError(res, 500, 'Failed to delete lesson', err.message);
  }
};

export const getLesson = async (req, res) => {
  try {
    const { id } = req.params;
    const lesson = await pool.query('SELECT * FROM lessons WHERE id = $1', [id]);
    if (!lesson.rows[0]) return sendError(res, 404, 'Lesson not found');

    const resources = await pool.query('SELECT * FROM lesson_resources WHERE lesson_id = $1', [id]);
    const discussions = await pool.query(`
      SELECT d.*, u.name, u.avatar FROM discussions d
      JOIN users u ON d.user_id = u.id
      WHERE d.lesson_id = $1 AND d.parent_id IS NULL ORDER BY d.created_at DESC LIMIT 20
    `, [id]);

    sendSuccess(res, { lesson: lesson.rows[0], resources: resources.rows, discussions: discussions.rows });
  } catch (err) {
    sendError(res, 500, 'Failed to fetch lesson', err.message);
  }
};

export const reorderLessons = async (req, res) => {
  try {
    const { order } = req.body;
    for (const item of order) {
      await pool.query('UPDATE lessons SET position = $1 WHERE id = $2', [item.position, item.id]);
    }
    sendSuccess(res, null, 'Lessons reordered');
  } catch (err) {
    sendError(res, 500, 'Failed to reorder lessons', err.message);
  }
};

export const addResource = async (req, res) => {
  try {
    const { lessonId, title, type, url, fileSize } = req.body;
    const rid = randomUUID();
    await pool.query(
      'INSERT INTO lesson_resources (id, lesson_id, title, type, url, file_size) VALUES ($1,$2,$3,$4,$5,$6)',
      [rid, lessonId, title, type, url, fileSize]
    );
    const result = await pool.query('SELECT * FROM lesson_resources WHERE id = $1', [rid]);
    sendSuccess(res, result.rows[0], 'Resource added', 201);
  } catch (err) {
    sendError(res, 500, 'Failed to add resource', err.message);
  }
};
