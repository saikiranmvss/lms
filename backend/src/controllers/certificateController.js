import pool from '../db/index.js';
import { sendError, sendSuccess } from '../utils/helpers.js';

export const getMyCertificates = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT cert.*, c.title as course_title, c.thumbnail, c.slug, u.name as instructor_name
      FROM certificates cert
      JOIN courses c ON cert.course_id = c.id
      JOIN users u ON c.instructor_id = u.id
      WHERE cert.student_id = $1 ORDER BY cert.issued_at DESC
    `, [req.user.id]);
    sendSuccess(res, result.rows);
  } catch (err) {
    sendError(res, 500, 'Failed to fetch certificates', err.message);
  }
};

export const getCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT cert.*, c.title as course_title, c.thumbnail, u.name as student_name, inst.name as instructor_name
      FROM certificates cert
      JOIN courses c ON cert.course_id = c.id
      JOIN users u ON cert.student_id = u.id
      JOIN users inst ON c.instructor_id = inst.id
      WHERE cert.id = $1
    `, [id]);
    if (!result.rows[0]) return sendError(res, 404, 'Certificate not found');
    sendSuccess(res, result.rows[0]);
  } catch (err) {
    sendError(res, 500, 'Failed to fetch certificate', err.message);
  }
};
