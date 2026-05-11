import pool from '../db/index.js';
import { sendError, sendSuccess } from '../utils/helpers.js';

export const getNotifications = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    const unread = await pool.query('SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false', [req.user.id]);
    sendSuccess(res, { notifications: result.rows, unreadCount: parseInt(unread.rows[0].count) });
  } catch (err) {
    sendError(res, 500, 'Failed to fetch notifications', err.message);
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === 'all') {
      await pool.query('UPDATE notifications SET is_read = true WHERE user_id = $1', [req.user.id]);
    } else {
      await pool.query('UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    }
    sendSuccess(res, null, 'Notifications marked as read');
  } catch (err) {
    sendError(res, 500, 'Failed to mark as read', err.message);
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM notifications WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    sendSuccess(res, null, 'Notification deleted');
  } catch (err) {
    sendError(res, 500, 'Failed to delete notification', err.message);
  }
};
