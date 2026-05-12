import pool from '../db/index.js';
import { sendError, sendSuccess } from '../utils/helpers.js';

export const createQuiz = async (req, res) => {
  try {
    const { lessonId, courseId, title, description, timeLimitMinutes, passingPercentage, maxAttempts } = req.body;
    const existing = await pool.query('SELECT id FROM quizzes WHERE lesson_id = $1', [lessonId]);
    if (existing.rows[0]) return sendSuccess(res, existing.rows[0], 'Quiz already exists');
    const result = await pool.query(`
      INSERT INTO quizzes (lesson_id, course_id, title, description, time_limit_minutes, passing_percentage, max_attempts)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [lessonId, courseId, title, description, timeLimitMinutes || null, passingPercentage || 70, maxAttempts || 3]);
    sendSuccess(res, result.rows[0], 'Quiz created', 201);
  } catch (err) {
    sendError(res, 500, 'Failed to create quiz', err.message);
  }
};

export const updateQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, timeLimitMinutes, passingPercentage, maxAttempts } = req.body;
    const result = await pool.query(`
      UPDATE quizzes SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        time_limit_minutes = $3,
        passing_percentage = COALESCE($4, passing_percentage),
        max_attempts = COALESCE($5, max_attempts),
        updated_at = NOW()
      WHERE id = $6 RETURNING *
    `, [title, description, timeLimitMinutes || null, passingPercentage, maxAttempts, id]);
    if (!result.rows[0]) return sendError(res, 404, 'Quiz not found');
    sendSuccess(res, result.rows[0], 'Quiz updated');
  } catch (err) {
    sendError(res, 500, 'Failed to update quiz', err.message);
  }
};

export const getQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = await pool.query('SELECT * FROM quizzes WHERE id = $1', [id]);
    if (!quiz.rows[0]) return sendError(res, 404, 'Quiz not found');
    const questions = await pool.query(
      'SELECT id, question, type, options, slider_config, correct_answers, explanation, points, position FROM quiz_questions WHERE quiz_id = $1 ORDER BY position',
      [id]
    );
    let userAttempts = [];
    if (req.user) {
      const attempts = await pool.query(
        'SELECT id, score, is_passed, submitted_at, answers FROM quiz_attempts WHERE quiz_id = $1 AND student_id = $2 ORDER BY submitted_at DESC',
        [id, req.user.id]
      );
      userAttempts = attempts.rows;
    }
    sendSuccess(res, { quiz: quiz.rows[0], questions: questions.rows, userAttempts });
  } catch (err) {
    sendError(res, 500, 'Failed to fetch quiz', err.message);
  }
};

export const getQuizByLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const quiz = await pool.query('SELECT * FROM quizzes WHERE lesson_id = $1', [lessonId]);
    if (!quiz.rows[0]) return sendError(res, 404, 'Quiz not found');
    const questions = await pool.query(
      'SELECT id, question, type, options, slider_config, correct_answers, explanation, points, position FROM quiz_questions WHERE quiz_id = $1 ORDER BY position',
      [quiz.rows[0].id]
    );
    let userAttempts = [];
    if (req.user) {
      const attempts = await pool.query(
        'SELECT id, score, is_passed, submitted_at, answers FROM quiz_attempts WHERE quiz_id = $1 AND student_id = $2 ORDER BY submitted_at DESC',
        [quiz.rows[0].id, req.user.id]
      );
      userAttempts = attempts.rows;
    }
    sendSuccess(res, { quiz: quiz.rows[0], questions: questions.rows, userAttempts });
  } catch (err) {
    sendError(res, 500, 'Failed to fetch quiz', err.message);
  }
};

export const addQuestion = async (req, res) => {
  try {
    const { quizId, question, type, options, sliderConfig, correctAnswers, explanation, points } = req.body;
    if (!quizId || !question) return sendError(res, 400, 'quizId and question are required');
    const posResult = await pool.query('SELECT COALESCE(MAX(position), -1) + 1 as pos FROM quiz_questions WHERE quiz_id = $1', [quizId]);
    const opts = (type !== 'range_slider' && options) ? JSON.stringify(options) : null;
    const sliderCfg = (type === 'range_slider' && sliderConfig) ? JSON.stringify(sliderConfig) : null;
    const correct = correctAnswers || [];
    const result = await pool.query(`
      INSERT INTO quiz_questions (quiz_id, question, type, options, slider_config, correct_answers, explanation, points, position)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
    `, [quizId, question, type || 'mcq', opts, sliderCfg, correct, explanation || null, points || 1, posResult.rows[0].pos]);
    await pool.query('UPDATE quizzes SET updated_at = NOW() WHERE id = $1', [quizId]);
    sendSuccess(res, result.rows[0], 'Question added', 201);
  } catch (err) {
    sendError(res, 500, 'Failed to add question', err.message);
  }
};

export const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, type, options, sliderConfig, correctAnswers, explanation, points } = req.body;
    const opts = (type !== 'range_slider' && options) ? JSON.stringify(options) : null;
    const sliderCfg = (type === 'range_slider' && sliderConfig) ? JSON.stringify(sliderConfig) : null;
    const result = await pool.query(`
      UPDATE quiz_questions SET
        question = COALESCE($1, question),
        type = COALESCE($2, type),
        options = COALESCE($3, options),
        slider_config = COALESCE($4, slider_config),
        correct_answers = COALESCE($5, correct_answers),
        explanation = COALESCE($6, explanation),
        points = COALESCE($7, points)
      WHERE id = $8 RETURNING *
    `, [question, type, opts, sliderCfg, correctAnswers, explanation, points, id]);
    if (!result.rows[0]) return sendError(res, 404, 'Question not found');
    sendSuccess(res, result.rows[0], 'Question updated');
  } catch (err) {
    sendError(res, 500, 'Failed to update question', err.message);
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const q = await pool.query('SELECT quiz_id FROM quiz_questions WHERE id = $1', [id]);
    if (!q.rows[0]) return sendError(res, 404, 'Question not found');
    await pool.query('DELETE FROM quiz_questions WHERE id = $1', [id]);
    const remaining = await pool.query('SELECT id FROM quiz_questions WHERE quiz_id = $1 ORDER BY position', [q.rows[0].quiz_id]);
    for (let i = 0; i < remaining.rows.length; i++) {
      await pool.query('UPDATE quiz_questions SET position = $1 WHERE id = $2', [i, remaining.rows[i].id]);
    }
    sendSuccess(res, null, 'Question deleted');
  } catch (err) {
    sendError(res, 500, 'Failed to delete question', err.message);
  }
};

function gradeQuestion(q, userAnswer) {
  if (userAnswer === undefined || userAnswer === null || userAnswer === '') return false;
  if (q.type === 'mcq' || q.type === 'true_false') {
    return q.correct_answers.includes(String(userAnswer));
  }
  if (q.type === 'multiple_answer') {
    const userArr = (Array.isArray(userAnswer) ? userAnswer : [userAnswer]).map(String).sort();
    const correctArr = [...q.correct_answers].map(String).sort();
    return JSON.stringify(userArr) === JSON.stringify(correctArr);
  }
  if (q.type === 'range_slider') {
    const cfg = q.slider_config || {};
    const tolerance = parseFloat(cfg.tolerance ?? 0);
    const correctVal = parseFloat(q.correct_answers?.[0] ?? 0);
    const userVal = parseFloat(userAnswer);
    return !isNaN(userVal) && Math.abs(userVal - correctVal) <= tolerance;
  }
  // short_answer - no auto grade
  return false;
}

export const submitQuiz = async (req, res) => {
  try {
    const { quizId, answers, timeTakenSeconds } = req.body;
    const quiz = await pool.query('SELECT * FROM quizzes WHERE id = $1', [quizId]);
    if (!quiz.rows[0]) return sendError(res, 404, 'Quiz not found');

    const prevAttempts = await pool.query('SELECT COUNT(*) FROM quiz_attempts WHERE quiz_id = $1 AND student_id = $2', [quizId, req.user.id]);
    if (parseInt(prevAttempts.rows[0].count) >= quiz.rows[0].max_attempts) {
      return sendError(res, 400, `Maximum attempts (${quiz.rows[0].max_attempts}) reached`);
    }

    const questions = await pool.query('SELECT * FROM quiz_questions WHERE quiz_id = $1', [quizId]);
    let totalPoints = 0, earnedPoints = 0;
    const questionResults = {};

    for (const q of questions.rows) {
      totalPoints += q.points;
      const userAnswer = answers[q.id];
      const isCorrect = gradeQuestion(q, userAnswer);
      if (isCorrect) earnedPoints += q.points;
      questionResults[q.id] = { isCorrect, userAnswer, correctAnswers: q.correct_answers, points: q.points, type: q.type };
    }

    const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const isPassed = score >= quiz.rows[0].passing_percentage;

    const result = await pool.query(`
      INSERT INTO quiz_attempts (quiz_id, student_id, answers, score, is_passed, time_taken_seconds)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
    `, [quizId, req.user.id, JSON.stringify(answers), score.toFixed(2), isPassed, timeTakenSeconds]);

    sendSuccess(res, {
      attempt: result.rows[0],
      score: parseFloat(score.toFixed(2)),
      isPassed,
      earnedPoints,
      totalPoints,
      passingPercentage: quiz.rows[0].passing_percentage,
      questionResults,
      attemptsUsed: parseInt(prevAttempts.rows[0].count) + 1,
      maxAttempts: quiz.rows[0].max_attempts,
    });
  } catch (err) {
    sendError(res, 500, 'Failed to submit quiz', err.message);
  }
};

export const getQuizResults = async (req, res) => {
  try {
    const { quizId } = req.params;
    const quiz = await pool.query('SELECT * FROM quizzes WHERE id = $1', [quizId]);
    const questions = await pool.query('SELECT * FROM quiz_questions WHERE quiz_id = $1 ORDER BY position', [quizId]);
    const attempts = await pool.query('SELECT * FROM quiz_attempts WHERE quiz_id = $1 AND student_id = $2 ORDER BY submitted_at DESC', [quizId, req.user.id]);
    sendSuccess(res, { quiz: quiz.rows[0], questions: questions.rows, attempts: attempts.rows });
  } catch (err) {
    sendError(res, 500, 'Failed to fetch quiz results', err.message);
  }
};
