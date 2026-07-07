import Razorpay from 'razorpay';
import crypto from 'crypto';

/** Lazily initialise Razorpay so the server can start even if keys are absent. */
function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in environment variables.');
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

/**
 * POST /api/payments/create-order
 * Body: { amount (in paise, e.g. 49900 for ₹499), currency, receipt }
 */
export async function createOrder(req, res) {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    if (!amount || isNaN(amount) || Number(amount) < 100) {
      return res.status(400).json({ success: false, message: 'Amount must be at least 100 paise (₹1).' });
    }

    const options = {
      amount: Math.round(Number(amount)),
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
    };

    const razorpay = getRazorpay();
    const order = await razorpay.orders.create(options);

    return res.status(200).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.error('Razorpay create-order error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create payment order.' });
  }
}

/**
 * POST /api/payments/verify
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
export async function verifyPayment(req, res) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment verification fields.' });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment signature verification failed.' });
    }

    // Signature is valid — payment is genuine
    return res.status(200).json({ success: true, message: 'Payment verified successfully.' });
  } catch (err) {
    console.error('Razorpay verify error:', err);
    return res.status(500).json({ success: false, message: 'Payment verification failed.' });
  }
}
