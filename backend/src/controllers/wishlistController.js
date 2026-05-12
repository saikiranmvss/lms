import pool from '../db/index.js';
import { sendError, sendSuccess } from '../utils/helpers.js';

export const getWishlist = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT w.*, c.title, c.slug, c.thumbnail, c.price, c.discount_price, c.avg_rating, c.total_reviews, c.level,
        u.name as instructor_name
      FROM wishlists w JOIN courses c ON w.course_id = c.id LEFT JOIN users u ON c.instructor_id = u.id
      WHERE w.student_id = $1 ORDER BY w.created_at DESC
    `, [req.user.id]);
    sendSuccess(res, result.rows);
  } catch (err) {
    sendError(res, 500, 'Failed to fetch wishlist', err.message);
  }
};

export const addToWishlist = async (req, res) => {
  try {
    const { courseId } = req.body;
    await pool.query('INSERT INTO wishlists (student_id, course_id) VALUES ($1,$2) ON DUPLICATE KEY UPDATE student_id = student_id', [req.user.id, courseId]);
    sendSuccess(res, null, 'Added to wishlist', 201);
  } catch (err) {
    sendError(res, 500, 'Failed to add to wishlist', err.message);
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    const { courseId } = req.params;
    await pool.query('DELETE FROM wishlists WHERE student_id = $1 AND course_id = $2', [req.user.id, courseId]);
    sendSuccess(res, null, 'Removed from wishlist');
  } catch (err) {
    sendError(res, 500, 'Failed to remove from wishlist', err.message);
  }
};
