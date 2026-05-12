import { randomUUID } from 'crypto';
import pool from '../db/index.js';
import { sendError, sendSuccess } from '../utils/helpers.js';

export const getDiscussions = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const result = await pool.query(`
      SELECT d.*, u.name, u.avatar, u.role,
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT('id', r.id, 'content', r.content, 'created_at', r.created_at, 'user_id', r.user_id, 'name', ru.name, 'avatar', ru.avatar)
        )
        FROM discussions r JOIN users ru ON r.user_id = ru.id WHERE r.parent_id = d.id
        ) AS replies
      FROM discussions d JOIN users u ON d.user_id = u.id
      WHERE d.lesson_id = $1 AND d.parent_id IS NULL ORDER BY d.is_pinned DESC, d.created_at DESC
    `, [lessonId]);
    for (const row of result.rows) {
      if (typeof row.replies === 'string') {
        try { row.replies = JSON.parse(row.replies); } catch { row.replies = []; }
      }
      if (!row.replies) row.replies = [];
    }
    sendSuccess(res, result.rows);
  } catch (err) {
    sendError(res, 500, 'Failed to fetch discussions', err.message);
  }
};

export const createDiscussion = async (req, res) => {
  try {
    const { lessonId, courseId, content, parentId } = req.body;
    const did = randomUUID();
    await pool.query(
      'INSERT INTO discussions (id, lesson_id, course_id, user_id, content, parent_id) VALUES ($1,$2,$3,$4,$5,$6)',
      [did, lessonId, courseId, req.user.id, content, parentId || null]
    );
    const full = await pool.query('SELECT d.*, u.name, u.avatar, u.role FROM discussions d JOIN users u ON d.user_id = u.id WHERE d.id = $1', [did]);
    sendSuccess(res, full.rows[0], 'Discussion posted', 201);
  } catch (err) {
    sendError(res, 500, 'Failed to post discussion', err.message);
  }
};

export const deleteDiscussion = async (req, res) => {
  try {
    const { id } = req.params;
    const discussion = await pool.query('SELECT user_id FROM discussions WHERE id = $1', [id]);
    if (!discussion.rows[0]) return sendError(res, 404, 'Not found');
    if (discussion.rows[0].user_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'instructor') {
      return sendError(res, 403, 'Not authorized');
    }
    await pool.query('DELETE FROM discussions WHERE id = $1', [id]);
    sendSuccess(res, null, 'Discussion deleted');
  } catch (err) {
    sendError(res, 500, 'Failed to delete discussion', err.message);
  }
};

export const pinDiscussion = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE discussions SET is_pinned = IF(is_pinned, 0, 1) WHERE id = $1', [id]);
    const result = await pool.query('SELECT * FROM discussions WHERE id = $1', [id]);
    sendSuccess(res, result.rows[0]);
  } catch (err) {
    sendError(res, 500, 'Failed to pin discussion', err.message);
  }
};
