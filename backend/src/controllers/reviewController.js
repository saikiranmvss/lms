import pool from '../db/index.js';
import { sendError, sendSuccess, buildPaginationMeta } from '../utils/helpers.js';

export const addReview = async (req, res) => {
  try {
    const { courseId, rating, comment } = req.body;
    if (!courseId || !rating) return sendError(res, 400, 'Course ID and rating required');
    if (rating < 1 || rating > 5) return sendError(res, 400, 'Rating must be between 1 and 5');

    const enrollment = await pool.query('SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2', [req.user.id, courseId]);
    if (!enrollment.rows[0]) return sendError(res, 403, 'Must be enrolled to review');

    await pool.query(`
      INSERT INTO reviews (course_id, student_id, rating, comment)
      VALUES ($1, $2, $3, $4)
      ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment), updated_at = NOW()
    `, [courseId, req.user.id, rating, comment]);

    const result = await pool.query(
      'SELECT * FROM reviews WHERE course_id = $1 AND student_id = $2',
      [courseId, req.user.id]
    );

    // Update course rating
    const stats = await pool.query('SELECT AVG(rating) as avg, COUNT(*) as total FROM reviews WHERE course_id = $1 AND is_approved = true', [courseId]);
    await pool.query('UPDATE courses SET avg_rating = $1, total_reviews = $2 WHERE id = $3', [
      parseFloat(stats.rows[0].avg).toFixed(2), stats.rows[0].total, courseId
    ]);

    sendSuccess(res, result.rows[0], 'Review submitted', 201);
  } catch (err) {
    sendError(res, 500, 'Failed to submit review', err.message);
  }
};

export const getCourseReviews = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const total = await pool.query('SELECT COUNT(*) FROM reviews WHERE course_id = $1 AND is_approved = true', [courseId]);
    const result = await pool.query(`
      SELECT r.*, u.name as student_name, u.avatar as student_avatar
      FROM reviews r JOIN users u ON r.student_id = u.id
      WHERE r.course_id = $1 AND r.is_approved = true
      ORDER BY r.created_at DESC LIMIT $2 OFFSET $3
    `, [courseId, parseInt(limit), offset]);

    sendSuccess(res, { reviews: result.rows, pagination: buildPaginationMeta(total.rows[0].count, page, limit) });
  } catch (err) {
    sendError(res, 500, 'Failed to fetch reviews', err.message);
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await pool.query('SELECT * FROM reviews WHERE id = $1', [id]);
    if (!review.rows[0]) return sendError(res, 404, 'Review not found');
    if (review.rows[0].student_id !== req.user.id && req.user.role !== 'admin') return sendError(res, 403, 'Not authorized');
    await pool.query('DELETE FROM reviews WHERE id = $1', [id]);
    sendSuccess(res, null, 'Review deleted');
  } catch (err) {
    sendError(res, 500, 'Failed to delete review', err.message);
  }
};
