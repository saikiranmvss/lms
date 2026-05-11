import jwt from 'jsonwebtoken';
import pool from '../db/index.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query('SELECT id, name, email, role, avatar, is_suspended FROM users WHERE id = $1', [decoded.userId]);
    if (!result.rows[0]) return res.status(401).json({ message: 'User not found' });
    if (result.rows[0].is_suspended) return res.status(403).json({ message: 'Account suspended' });
    req.user = result.rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }
  next();
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const result = await pool.query('SELECT id, name, email, role, avatar FROM users WHERE id = $1', [decoded.userId]);
      req.user = result.rows[0] || null;
    }
  } catch {}
  next();
};
