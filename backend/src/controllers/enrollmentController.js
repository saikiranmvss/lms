import pool from '../db/index.js';
import { sendError, sendSuccess } from '../utils/helpers.js';

export const enrollCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    if (!courseId) return sendError(res, 400, 'Course ID required');

    const course = await pool.query("SELECT id, price, title FROM courses WHERE id = $1 AND status = 'published'", [courseId]);
    if (!course.rows[0]) return sendError(res, 404, 'Course not found');

    const existing = await pool.query('SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2', [req.user.id, courseId]);
    if (existing.rows[0]) return sendError(res, 409, 'Already enrolled');

    await pool.query('INSERT INTO enrollments (student_id, course_id) VALUES ($1, $2)', [req.user.id, courseId]);
    await pool.query('UPDATE courses SET total_enrollments = total_enrollments + 1 WHERE id = $1', [courseId]);

    // Create notification
    await pool.query(
      'INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)',
      [req.user.id, 'Enrolled Successfully', `You are now enrolled in ${course.rows[0].title}`, 'enrollment']
    );

    sendSuccess(res, null, 'Enrolled successfully', 201);
  } catch (err) {
    sendError(res, 500, 'Enrollment failed', err.message);
  }
};

export const getMyEnrollments = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*, c.title, c.slug, c.thumbnail, c.total_lessons, c.duration_seconds,
        u.name as instructor_name, cat.name as category_name
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      LEFT JOIN users u ON c.instructor_id = u.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE e.student_id = $1 ORDER BY (e.last_accessed_at IS NULL) ASC, e.last_accessed_at DESC, e.enrolled_at DESC
    `, [req.user.id]);
    sendSuccess(res, result.rows);
  } catch (err) {
    sendError(res, 500, 'Failed to fetch enrollments', err.message);
  }
};

export const updateProgress = async (req, res) => {
  try {
    const { lessonId, courseId, isCompleted, watchTimeSeconds } = req.body;

    const enrollment = await pool.query('SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2', [req.user.id, courseId]);
    if (!enrollment.rows[0]) return sendError(res, 403, 'Not enrolled in this course');

    await pool.query(`
      INSERT INTO progress_tracking (student_id, lesson_id, course_id, is_completed, watch_time_seconds, completed_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON DUPLICATE KEY UPDATE
        is_completed = GREATEST(progress_tracking.is_completed, VALUES(is_completed)),
        watch_time_seconds = GREATEST(progress_tracking.watch_time_seconds, VALUES(watch_time_seconds)),
        completed_at = CASE WHEN VALUES(is_completed) = 1 AND progress_tracking.completed_at IS NULL THEN NOW() ELSE progress_tracking.completed_at END,
        updated_at = NOW()
    `, [req.user.id, lessonId, courseId, isCompleted ? 1 : 0, watchTimeSeconds || 0, isCompleted ? new Date() : null]);

    // Update enrollment completion percentage
    const totalLessons = await pool.query("SELECT COUNT(*) AS count FROM lessons WHERE course_id = $1 AND is_published = 1", [courseId]);
    const completedLessons = await pool.query("SELECT COUNT(*) AS count FROM progress_tracking WHERE student_id = $1 AND course_id = $2 AND is_completed = 1", [req.user.id, courseId]);
    const total = Number(totalLessons.rows[0]?.count || 0);
    const completed = Number(completedLessons.rows[0]?.count || 0);
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    await pool.query(
      'UPDATE enrollments SET completion_percentage = $1, last_accessed_at = NOW(), completed_at = $2 WHERE student_id = $3 AND course_id = $4',
      [percentage, percentage === 100 ? new Date() : null, req.user.id, courseId]
    );

    // ─── GAMIFICATION UPDATE ───
    let xpEarned = 0;
    let streakUpdated = false;
    let newStreak = 0;
    let unlockedBadge = null;

    if (isCompleted) {
      xpEarned = 10; // 10 XP for each completed lesson

      // 1. Fetch user's current streak and active date details
      const { rows: users } = await pool.query(
        'SELECT daily_streak, last_active_date, experience_points, badges FROM users WHERE id = $1',
        [req.user.id]
      );
      if (users[0]) {
        const u = users[0];
        const todayStr = new Date().toISOString().split('T')[0];
        newStreak = u.daily_streak || 0;

        if (!u.last_active_date) {
          newStreak = 1;
          streakUpdated = true;
        } else {
          const lastActiveStr = new Date(u.last_active_date).toISOString().split('T')[0];
          const diffTime = Math.abs(new Date(todayStr) - new Date(lastActiveStr));
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            newStreak += 1;
            streakUpdated = true;
          } else if (diffDays > 1) {
            newStreak = 1;
            streakUpdated = true;
          }
        }

        const totalXp = (u.experience_points || 0) + xpEarned;
        let badgesArray = [];
        try {
          badgesArray = typeof u.badges === 'string' ? JSON.parse(u.badges) : (u.badges || []);
        } catch {
          badgesArray = [];
        }

        // Check for new badges
        if (percentage === 100 && !badgesArray.includes('course_graduate')) {
          badgesArray.push('course_graduate');
          unlockedBadge = 'Course Graduate';
        }
        if (newStreak >= 7 && !badgesArray.includes('super_learner')) {
          badgesArray.push('super_learner');
          unlockedBadge = 'Super Learner';
        }
        if (totalXp >= 100 && !badgesArray.includes('centurion')) {
          badgesArray.push('centurion');
          unlockedBadge = 'Centurion';
        }

        // Save back to DB
        await pool.query(
          `UPDATE users 
           SET experience_points = $1, 
               daily_streak = $2, 
               last_active_date = NOW(), 
               badges = $3 
           WHERE id = $4`,
          [totalXp, newStreak, JSON.stringify(badgesArray), req.user.id]
        );
      }
    }

    // Issue certificate if 100%
    if (percentage === 100) {
      await pool.query(
        'INSERT IGNORE INTO certificates (student_id, course_id) VALUES ($1, $2)',
        [req.user.id, courseId]
      );
    }

    sendSuccess(res, { 
      completion_percentage: percentage,
      xpEarned,
      streakUpdated,
      newStreak,
      unlockedBadge
    });
  } catch (err) {
    sendError(res, 500, 'Failed to update progress', err.message);
  }
};

export const getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const enrollment = await pool.query('SELECT * FROM enrollments WHERE student_id = $1 AND course_id = $2', [req.user.id, courseId]);
    if (!enrollment.rows[0]) return sendError(res, 403, 'Not enrolled');

    const progress = await pool.query(
      'SELECT lesson_id, is_completed, watch_time_seconds FROM progress_tracking WHERE student_id = $1 AND course_id = $2',
      [req.user.id, courseId]
    );
    sendSuccess(res, { enrollment: enrollment.rows[0], progress: progress.rows });
  } catch (err) {
    sendError(res, 500, 'Failed to fetch progress', err.message);
  }
};
