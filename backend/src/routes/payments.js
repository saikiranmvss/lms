import express from 'express';
import { createOrder, verifyPayment } from '../controllers/paymentController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Create Razorpay order (authenticated users only)
router.post('/create-order', authenticate, createOrder);

// Verify payment signature after checkout
router.post('/verify', authenticate, verifyPayment);

export default router;
