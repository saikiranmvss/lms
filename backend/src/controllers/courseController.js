import { randomUUID } from 'crypto';
import pool from '../db/index.js';
import { generateSlug, sendError, sendSuccess, buildPaginationMeta } from '../utils/helpers.js';

export const getCourses = async (req, res) => {
  try {
    const { page = 1, limit = 12, category, level, search, sort = 'newest', minPrice, maxPrice } = req.query;
    const offset = (page - 1) * limit;
    let conditions = ["c.status = 'published'"];
    let params = [];
    let idx = 1;

    if (category) { conditions.push(`cat.slug = $${idx++}`); params.push(category); }
    if (level && level !== 'all') { conditions.push(`c.level = $${idx++}`); params.push(level); }
    if (search) {
      const s = `%${search}%`;
      conditions.push(`(LOWER(c.title) LIKE LOWER($${idx}) OR LOWER(COALESCE(c.short_description,'')) LIKE LOWER($${idx + 1}))`);
      params.push(s, s);
      idx += 2;
    }
    if (minPrice !== undefined) { conditions.push(`c.price >= $${idx++}`); params.push(parseFloat(minPrice)); }
    if (maxPrice !== undefined) { conditions.push(`c.price <= $${idx++}`); params.push(parseFloat(maxPrice)); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const sortMap = { newest: 'c.created_at DESC', oldest: 'c.created_at ASC', popular: 'c.total_enrollments DESC', rating: 'c.avg_rating DESC', price_asc: 'c.price ASC', price_desc: 'c.price DESC' };
    const orderBy = sortMap[sort] || 'c.created_at DESC';

    const countResult = await pool.query(`SELECT COUNT(*) FROM courses c LEFT JOIN categories cat ON c.category_id = cat.id ${where}`, params);
    const total = countResult.rows[0].count;

    params.push(parseInt(limit), offset);
    const result = await pool.query(`
      SELECT c.*, cat.name as category_name, cat.slug as category_slug,
        u.name as instructor_name, u.avatar as instructor_avatar
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN users u ON c.instructor_id = u.id
      ${where} ORDER BY ${orderBy} LIMIT $${idx++} OFFSET $${idx++}
    `, params);

    sendSuccess(res, { courses: result.rows, pagination: buildPaginationMeta(total, page, limit) });
  } catch (err) {
    sendError(res, 500, 'Failed to fetch courses', err.message);
  }
};

export const getCourseBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const result = await pool.query(`
      SELECT c.*, cat.name as category_name, cat.slug as category_slug,
        u.name as instructor_name, u.avatar as instructor_avatar, u.bio as instructor_bio,
        u.id as instructor_id
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN users u ON c.instructor_id = u.id
      WHERE c.slug = $1
    `, [slug]);

    if (!result.rows[0]) return sendError(res, 404, 'Course not found');
    const course = result.rows[0];

    const sections = await pool.query(`
      SELECT s.id, s.course_id, s.title, s.description, s.position, s.created_at,
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', j.id, 'title', j.title, 'type', j.type, 'duration_seconds', j.duration_seconds,
            'is_preview', j.is_preview, 'position', j.position,
            'video_url', j.video_url, 'content', j.content, 'description', j.description
          )
        )
        FROM (
          SELECT l.id, l.title, l.type, l.duration_seconds, l.is_preview, l.position, l.video_url, l.content, l.description
          FROM lessons l WHERE l.section_id = s.id ORDER BY l.position
        ) j
        ) AS lessons
      FROM sections s
      WHERE s.course_id = $1
      ORDER BY s.position
    `, [course.id]);
    for (const row of sections.rows) {
      if (typeof row.lessons === 'string') {
        try { row.lessons = JSON.parse(row.lessons); } catch { row.lessons = []; }
      }
      if (!row.lessons) row.lessons = [];
    }

    const reviews = await pool.query(`
      SELECT r.*, u.name as student_name, u.avatar as student_avatar
      FROM reviews r JOIN users u ON r.student_id = u.id
      WHERE r.course_id = $1 ORDER BY r.created_at DESC LIMIT 10
    `, [course.id]);

    let isEnrolled = false;
    let userProgress = null;
    if (req.user) {
      const enrollment = await pool.query('SELECT * FROM enrollments WHERE student_id = $1 AND course_id = $2', [req.user.id, course.id]);
      isEnrolled = enrollment.rows.length > 0;
      if (isEnrolled) userProgress = enrollment.rows[0];
    }

    sendSuccess(res, { course, sections: sections.rows, reviews: reviews.rows, isEnrolled, userProgress });
  } catch (err) {
    sendError(res, 500, 'Failed to fetch course', err.message);
  }
};

export const createCourse = async (req, res) => {
  try {
    const { title, description, short_description, category_id, level, language, price, requirements, what_you_learn, tags } = req.body;
    if (!title) return sendError(res, 400, 'Title is required');
    const slug = generateSlug(title) + '-' + Date.now();
    const cid = randomUUID();
    await pool.query(`
      INSERT INTO courses (id, title, slug, description, short_description, category_id, level, language, price, requirements, what_you_learn, tags, instructor_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    `, [cid, title, slug, description, short_description, category_id, level || 'beginner', language || 'English', price || 0,
      JSON.stringify(requirements || []), JSON.stringify(what_you_learn || []), JSON.stringify(tags || []), req.user.id]);
    const result = await pool.query('SELECT * FROM courses WHERE id = $1', [cid]);

    sendSuccess(res, result.rows[0], 'Course created', 201);
  } catch (err) {
    sendError(res, 500, 'Failed to create course', err.message);
  }
};

export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const ownership = await pool.query('SELECT id FROM courses WHERE id = $1 AND instructor_id = $2', [id, req.user.id]);
    if (!ownership.rows[0] && req.user.role !== 'admin') return sendError(res, 403, 'Not authorized');

    const { title, description, short_description, category_id, level, language, price, discount_price, thumbnail, preview_video, requirements, what_you_learn, tags } = req.body;

    const reqJson = requirements != null ? JSON.stringify(requirements) : null;
    const learnJson = what_you_learn != null ? JSON.stringify(what_you_learn) : null;
    const tagsJson = tags != null ? JSON.stringify(tags) : null;
    await pool.query(`
      UPDATE courses SET
        title = COALESCE($1, title), description = COALESCE($2, description),
        short_description = COALESCE($3, short_description), category_id = COALESCE($4, category_id),
        level = COALESCE($5, level), language = COALESCE($6, language),
        price = COALESCE($7, price), discount_price = COALESCE($8, discount_price),
        thumbnail = COALESCE($9, thumbnail), preview_video = COALESCE($10, preview_video),
        requirements = COALESCE($11, requirements), what_you_learn = COALESCE($12, what_you_learn),
        tags = COALESCE($13, tags), updated_at = NOW()
      WHERE id = $14
    `, [title, description, short_description, category_id, level, language, price, discount_price, thumbnail, preview_video, reqJson, learnJson, tagsJson, id]);
    const result = await pool.query('SELECT * FROM courses WHERE id = $1', [id]);

    sendSuccess(res, result.rows[0], 'Course updated');
  } catch (err) {
    sendError(res, 500, 'Failed to update course', err.message);
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const ownership = await pool.query('SELECT id FROM courses WHERE id = $1 AND instructor_id = $2', [id, req.user.id]);
    if (!ownership.rows[0] && req.user.role !== 'admin') return sendError(res, 403, 'Not authorized');
    await pool.query('DELETE FROM courses WHERE id = $1', [id]);
    sendSuccess(res, null, 'Course deleted');
  } catch (err) {
    sendError(res, 500, 'Failed to delete course', err.message);
  }
};

export const publishCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = req.user.role === 'admin' ? ['draft', 'pending', 'published', 'rejected'] : ['draft', 'pending'];
    if (!validStatuses.includes(status)) return sendError(res, 400, 'Invalid status');

    const ownership = await pool.query('SELECT id FROM courses WHERE id = $1 AND instructor_id = $2', [id, req.user.id]);
    if (!ownership.rows[0] && req.user.role !== 'admin') return sendError(res, 403, 'Not authorized');

    await pool.query('UPDATE courses SET status = $1, updated_at = NOW() WHERE id = $2', [status, id]);
    const result = await pool.query('SELECT * FROM courses WHERE id = $1', [id]);
    sendSuccess(res, result.rows[0], 'Course status updated');
  } catch (err) {
    sendError(res, 500, 'Failed to update course status', err.message);
  }
};

export const getInstructorCourses = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, cat.name as category_name FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE c.instructor_id = $1 ORDER BY c.created_at DESC
    `, [req.user.id]);
    sendSuccess(res, result.rows);
  } catch (err) {
    sendError(res, 500, 'Failed to fetch courses', err.message);
  }
};

export const getCourseStudents = async (req, res) => {
  try {
    const { id } = req.params;
    const ownership = await pool.query('SELECT id FROM courses WHERE id = $1 AND instructor_id = $2', [id, req.user.id]);
    if (!ownership.rows[0] && req.user.role !== 'admin') return sendError(res, 403, 'Not authorized');

    const result = await pool.query(`
      SELECT u.id, u.name, u.email, u.avatar, e.enrolled_at, e.completion_percentage
      FROM enrollments e JOIN users u ON e.student_id = u.id
      WHERE e.course_id = $1 ORDER BY e.enrolled_at DESC
    `, [id]);
    sendSuccess(res, result.rows);
  } catch (err) {
    sendError(res, 500, 'Failed to fetch students', err.message);
  }
};

export const getFeaturedCourses = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, cat.name as category_name, u.name as instructor_name, u.avatar as instructor_avatar
      FROM courses c LEFT JOIN categories cat ON c.category_id = cat.id LEFT JOIN users u ON c.instructor_id = u.id
      WHERE c.status = 'published' AND c.is_featured = true ORDER BY c.avg_rating DESC LIMIT 8
    `);
    sendSuccess(res, result.rows);
  } catch (err) {
    sendError(res, 500, 'Failed to fetch featured courses', err.message);
  }
};
