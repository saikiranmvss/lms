import Razorpay from 'razorpay';
import crypto from 'crypto';
import pool from '../db/index.js';
import { sendError, sendSuccess } from '../utils/helpers.js';

/** Lazily initialise Razorpay so the server starts even if keys are absent. */
function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in environment variables.');
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

/* ──────────────────────────────────────────────────────────────────────────
   POST /api/payments/create-order
   1. Validate the course exists and is paid
   2. Create a Razorpay order
   3. Save a PENDING transaction record in DB
   Returns: { order_id, amount, currency, transaction_id }
────────────────────────────────────────────────────────────────────────── */
export async function createOrder(req, res) {
  try {
    const { courseId, currency = 'INR' } = req.body;
    const studentId = req.user.id;

    if (!courseId) return sendError(res, 400, 'courseId is required');

    // 1. Fetch course
    const { rows: courses } = await pool.query(
      "SELECT id, title, price, discount_price, currency FROM courses WHERE id = $1 AND status = 'published'",
      [courseId]
    );
    if (!courses[0]) return sendError(res, 404, 'Course not found');
    const course = courses[0];

    // 2. Already enrolled?
    const { rows: enrolled } = await pool.query(
      'SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2',
      [studentId, courseId]
    );
    if (enrolled[0]) return sendError(res, 409, 'Already enrolled in this course');

    // 3. Calculate price in paise (multiply by 100)
    const priceINR = parseFloat(course.discount_price || course.price || 0);
    const amountPaise = Math.round(priceINR * 100);

    if (amountPaise < 100) {
      return sendError(res, 400, 'This is a free course — use the free enroll endpoint instead.');
    }

    // 4. Create Razorpay order
    const shortCourseId = courseId.toString().slice(-8);
    const receipt = `c_${shortCourseId}_${Date.now().toString().slice(-8)}`.slice(0, 40);

    const rzp = getRazorpay();
    const rzpOrder = await rzp.orders.create({ amount: amountPaise, currency, receipt });

    // 5. Save PENDING transaction to DB
    await pool.query(
      `INSERT INTO transactions
         (student_id, course_id, amount, currency, status, payment_method, razorpay_order_id)
       VALUES ($1, $2, $3, $4, 'pending', 'razorpay', $5)`,
      [studentId, courseId, priceINR, currency, rzpOrder.id]
    );

    // Fetch the new transaction id
    const { rows: txRows } = await pool.query(
      "SELECT id FROM transactions WHERE razorpay_order_id = $1 LIMIT 1",
      [rzpOrder.id]
    );

    return sendSuccess(res, {
      order_id: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      transaction_id: txRows[0]?.id ?? null,
    });
  } catch (err) {
    console.error('Razorpay create-order error:', err);
    return sendError(res, 500, err.message || 'Failed to create payment order');
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   POST /api/payments/verify
   1. Verify HMAC-SHA256 signature
   2. Mark transaction as COMPLETED
   3. Enroll the student automatically
   4. Create a notification
   Returns: { verified: true, enrollment: {...} }
────────────────────────────────────────────────────────────────────────── */
export async function verifyPayment(req, res) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const studentId = req.user.id;

    // 1. Validate input
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return sendError(res, 400, 'Missing required payment fields');
    }

    // 2. Find the pending transaction
    const { rows: txRows } = await pool.query(
      "SELECT * FROM transactions WHERE razorpay_order_id = $1 AND student_id = $2 AND status = 'pending' LIMIT 1",
      [razorpay_order_id, studentId]
    );
    if (!txRows[0]) return sendError(res, 404, 'Transaction not found or already processed');
    const tx = txRows[0];

    // 3. Verify signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSig !== razorpay_signature) {
      // Mark as failed
      await pool.query(
        "UPDATE transactions SET status = 'failed', failure_reason = 'Signature mismatch' WHERE id = $1",
        [tx.id]
      );
      return sendError(res, 400, 'Payment verification failed — signature mismatch');
    }

    // 4. Mark transaction as COMPLETED
    await pool.query(
      `UPDATE transactions
         SET status = 'completed',
             razorpay_payment_id = $1,
             razorpay_signature  = $2
       WHERE id = $3`,
      [razorpay_payment_id, razorpay_signature, tx.id]
    );

    // 5. Enroll the student (idempotent — ignore duplicate)
    const { rows: existingEnroll } = await pool.query(
      'SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2',
      [studentId, tx.course_id]
    );

    if (!existingEnroll[0]) {
      await pool.query(
        'INSERT INTO enrollments (student_id, course_id) VALUES ($1, $2)',
        [studentId, tx.course_id]
      );
      await pool.query(
        'UPDATE courses SET total_enrollments = total_enrollments + 1 WHERE id = $1',
        [tx.course_id]
      );
    }

    // 6. Fetch course title for notification
    const { rows: cRows } = await pool.query(
      'SELECT title, slug FROM courses WHERE id = $1',
      [tx.course_id]
    );
    const courseTitle = cRows[0]?.title ?? 'the course';
    const courseSlug = cRows[0]?.slug ?? '';

    // 7. Send notification to student
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, link)
       VALUES ($1, $2, $3, 'payment', $4)`,
      [
        studentId,
        'Payment Successful 🎉',
        `Payment of ₹${tx.amount} confirmed for "${courseTitle}". You are now enrolled!`,
        `/learn/${courseSlug}`,
      ]
    );

    return sendSuccess(res, {
      verified: true,
      transaction_id: tx.id,
      payment_id: razorpay_payment_id,
      course_id: tx.course_id,
      amount: tx.amount,
      currency: tx.currency,
      course_slug: courseSlug,
    }, 'Payment verified and enrollment confirmed');
  } catch (err) {
    console.error('Razorpay verify error:', err);
    return sendError(res, 500, err.message || 'Payment verification failed');
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   POST /api/payments/failed
   Called when Razorpay fires payment.failed event on frontend
   Marks the transaction as failed in DB
────────────────────────────────────────────────────────────────────────── */
export async function markFailed(req, res) {
  try {
    const { razorpay_order_id, error_description } = req.body;
    const studentId = req.user.id;

    if (!razorpay_order_id) return sendError(res, 400, 'razorpay_order_id required');

    await pool.query(
      "UPDATE transactions SET status = 'failed', failure_reason = $1 WHERE razorpay_order_id = $2 AND student_id = $3 AND status = 'pending'",
      [error_description || 'Payment failed', razorpay_order_id, studentId]
    );

    return sendSuccess(res, null, 'Transaction marked as failed');
  } catch (err) {
    return sendError(res, 500, 'Could not update transaction');
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   GET /api/payments/my
   Returns the current student's full transaction history
────────────────────────────────────────────────────────────────────────── */
export async function getMyTransactions(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT t.id, t.amount, t.currency, t.status, t.payment_method,
              t.razorpay_order_id, t.razorpay_payment_id, t.failure_reason,
              t.created_at,
              c.title AS course_title, c.slug AS course_slug,
              c.thumbnail AS course_thumbnail
         FROM transactions t
         JOIN courses c ON t.course_id = c.id
        WHERE t.student_id = $1
        ORDER BY t.created_at DESC`,
      [req.user.id]
    );
    return sendSuccess(res, rows);
  } catch (err) {
    return sendError(res, 500, 'Failed to fetch transactions', err.message);
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   GET /api/payments/admin  (admin only)
   Full transaction list for the admin dashboard
────────────────────────────────────────────────────────────────────────── */
export async function getAllTransactions(req, res) {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status || null;

    const where = status ? "WHERE t.status = $3" : "";
    const params = status
      ? [limit, offset, status]
      : [limit, offset];

    const { rows } = await pool.query(
      `SELECT t.id, t.amount, t.currency, t.status, t.payment_method,
              t.razorpay_order_id, t.razorpay_payment_id, t.failure_reason,
              t.created_at,
              u.name  AS student_name,  u.email AS student_email,
              c.title AS course_title,  c.slug  AS course_slug
         FROM transactions t
         JOIN users   u ON t.student_id = u.id
         JOIN courses c ON t.course_id  = c.id
         ${where}
        ORDER BY t.created_at DESC
        LIMIT $1 OFFSET $2`,
      params
    );

    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) AS total FROM transactions t ${where}`,
      status ? [status] : []
    );

    return sendSuccess(res, {
      transactions: rows,
      pagination: {
        total: countRows[0].total,
        page,
        limit,
        totalPages: Math.ceil(countRows[0].total / limit),
      },
    });
  } catch (err) {
    return sendError(res, 500, 'Failed to fetch transactions', err.message);
  }
}
