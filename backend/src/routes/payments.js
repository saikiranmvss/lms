import express from 'express';
import {
  createOrder,
  verifyPayment,
  markFailed,
  getMyTransactions,
  getAllTransactions,
} from '../controllers/paymentController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Create a Razorpay order (student initiates checkout)
router.post('/create-order', authenticate, createOrder);

// Verify signature after successful payment (auto-enrolls on success)
router.post('/verify', authenticate, verifyPayment);

// Mark a transaction as failed (called when Razorpay modal fires payment.failed)
router.post('/failed', authenticate, markFailed);

// Student: view own transaction history
router.get('/my', authenticate, getMyTransactions);

// Admin: view all transactions
router.get('/admin', authenticate, authorize('admin'), getAllTransactions);

export default router;
