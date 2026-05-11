import pool from '../db/index.js';
import { sendError, sendSuccess } from '../utils/helpers.js';

export const getDashboardStats = async (req, res) => {
  try {
    const [users, courses, enrollments, revenue] = await Promise.all([
      pool.query('SELECT COUNT(*) as total, SUM(CASE WHEN role=\'student\' THEN 1 ELSE 0 END) as students, SUM(CASE WHEN role=\'instructor\' THEN 1 ELSE 0 END) as instructors FROM users'),
      pool.query("SELECT COUNT(*) as total, SUM(CASE WHEN status='published' THEN 1 ELSE 0 END) as published, SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) as pending FROM courses"),
      pool.query('SELECT COUNT(*) as total FROM enrollments'),
      pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE status = 'completed'"),
    ]);

    const recentUsers = await pool.query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5');
    const recentCourses = await pool.query(`
      SELECT c.id, c.title, c.status, c.created_at, u.name as instructor_name
      FROM courses c JOIN users u ON c.instructor_id = u.id
      ORDER BY c.created_at DESC LIMIT 5
    `);

    const monthlyRevenue = await pool.query(`
      SELECT DATE_TRUNC('month', created_at) as month, SUM(amount) as revenue, COUNT(*) as transactions
      FROM transactions WHERE status = 'completed' AND created_at >= NOW() - INTERVAL '6 months'
      GROUP BY month ORDER BY month
    `);

    sendSuccess(res, {
      stats: {
        ...users.rows[0],
        totalCourses: courses.rows[0].total,
        publishedCourses: courses.rows[0].published,
        pendingCourses: courses.rows[0].pending,
        totalEnrollments: enrollments.rows[0].total,
        totalRevenue: revenue.rows[0].total,
      },
      recentUsers: recentUsers.rows,
      recentCourses: recentCourses.rows,
      monthlyRevenue: monthlyRevenue.rows,
    });
  } catch (err) {
    sendError(res, 500, 'Failed to fetch dashboard stats', err.message);
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const offset = (page - 1) * limit;
    let conditions = [];
    let params = [];
    let idx = 1;

    if (role) { conditions.push(`role = $${idx++}`); params.push(role); }
    if (search) { conditions.push(`(name ILIKE $${idx++} OR email ILIKE $${idx-1})`); params.push(`%${search}%`); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    params.push(parseInt(limit), offset);

    const total = await pool.query(`SELECT COUNT(*) FROM users ${where}`, conditions.length ? params.slice(0, -2) : []);
    const result = await pool.query(
      `SELECT id, name, email, role, avatar, is_verified, is_suspended, is_instructor_approved, created_at FROM users ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
      params
    );

    sendSuccess(res, { users: result.rows, total: parseInt(total.rows[0].count) });
  } catch (err) {
    sendError(res, 500, 'Failed to fetch users', err.message);
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_suspended, is_instructor_approved, role } = req.body;

    const result = await pool.query(`
      UPDATE users SET
        is_suspended = COALESCE($1, is_suspended),
        is_instructor_approved = COALESCE($2, is_instructor_approved),
        role = COALESCE($3, role),
        updated_at = NOW()
      WHERE id = $4 RETURNING id, name, email, role, is_suspended, is_instructor_approved
    `, [is_suspended, is_instructor_approved, role, id]);

    if (!result.rows[0]) return sendError(res, 404, 'User not found');
    sendSuccess(res, result.rows[0], 'User updated');
  } catch (err) {
    sendError(res, 500, 'Failed to update user', err.message);
  }
};

export const getAllCourses = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (page - 1) * limit;
    let conditions = [];
    let params = [];
    let idx = 1;

    if (status) { conditions.push(`c.status = $${idx++}`); params.push(status); }
    if (search) { conditions.push(`c.title ILIKE $${idx++}`); params.push(`%${search}%`); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    params.push(parseInt(limit), offset);

    const total = await pool.query(`SELECT COUNT(*) FROM courses c ${where}`, conditions.length ? params.slice(0, -2) : []);
    const result = await pool.query(`
      SELECT c.*, u.name as instructor_name, cat.name as category_name
      FROM courses c LEFT JOIN users u ON c.instructor_id = u.id LEFT JOIN categories cat ON c.category_id = cat.id
      ${where} ORDER BY c.created_at DESC LIMIT $${idx++} OFFSET $${idx++}
    `, params);

    sendSuccess(res, { courses: result.rows, total: parseInt(total.rows[0].count) });
  } catch (err) {
    sendError(res, 500, 'Failed to fetch courses', err.message);
  }
};

export const approveCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await pool.query(
      "UPDATE courses SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [status, id]
    );
    if (!result.rows[0]) return sendError(res, 404, 'Course not found');
    sendSuccess(res, result.rows[0], 'Course status updated');
  } catch (err) {
    sendError(res, 500, 'Failed to update course', err.message);
  }
};

export const getRevenueAnalytics = async (req, res) => {
  try {
    const [total, monthly, topCourses] = await Promise.all([
      pool.query("SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as transactions FROM transactions WHERE status='completed'"),
      pool.query(`
        SELECT DATE_TRUNC('month', created_at) as month, SUM(amount) as revenue, COUNT(*) as count
        FROM transactions WHERE status='completed' AND created_at >= NOW() - INTERVAL '12 months'
        GROUP BY month ORDER BY month
      `),
      pool.query(`
        SELECT c.id, c.title, c.thumbnail, SUM(t.amount) as revenue, COUNT(t.id) as sales
        FROM transactions t JOIN courses c ON t.course_id = c.id WHERE t.status='completed'
        GROUP BY c.id ORDER BY revenue DESC LIMIT 10
      `),
    ]);

    sendSuccess(res, { total: total.rows[0], monthly: monthly.rows, topCourses: topCourses.rows });
  } catch (err) {
    sendError(res, 500, 'Failed to fetch revenue analytics', err.message);
  }
};

export const getInstructorAnalytics = async (req, res) => {
  try {
    const instructorId = req.user.id;
    const [courseStats, enrollmentStats, revenueStats, recentEnrollments] = await Promise.all([
      pool.query("SELECT COUNT(*) as total, SUM(CASE WHEN status='published' THEN 1 ELSE 0 END) as published FROM courses WHERE instructor_id = $1", [instructorId]),
      pool.query('SELECT COUNT(*) as total FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE c.instructor_id = $1', [instructorId]),
      pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM transactions t JOIN courses c ON t.course_id = c.id WHERE c.instructor_id = $1 AND t.status='completed'", [instructorId]),
      pool.query(`
        SELECT u.name, u.email, u.avatar, c.title as course_title, e.enrolled_at, e.completion_percentage
        FROM enrollments e JOIN users u ON e.student_id = u.id JOIN courses c ON e.course_id = c.id
        WHERE c.instructor_id = $1 ORDER BY e.enrolled_at DESC LIMIT 10
      `, [instructorId]),
    ]);

    const monthlyEnrollments = await pool.query(`
      SELECT DATE_TRUNC('month', e.enrolled_at) as month, COUNT(*) as enrollments
      FROM enrollments e JOIN courses c ON e.course_id = c.id
      WHERE c.instructor_id = $1 AND e.enrolled_at >= NOW() - INTERVAL '6 months'
      GROUP BY month ORDER BY month
    `, [instructorId]);

    sendSuccess(res, {
      courseStats: courseStats.rows[0],
      enrollmentStats: enrollmentStats.rows[0],
      revenueStats: revenueStats.rows[0],
      recentEnrollments: recentEnrollments.rows,
      monthlyEnrollments: monthlyEnrollments.rows,
    });
  } catch (err) {
    sendError(res, 500, 'Failed to fetch analytics', err.message);
  }
};
