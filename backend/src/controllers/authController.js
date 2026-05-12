import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import pool from '../db/index.js';
import { sendError, sendSuccess } from '../utils/helpers.js';

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role = 'student' } = req.body;
    if (!name || !email || !password) return sendError(res, 400, 'Name, email and password are required');
    if (password.length < 6) return sendError(res, 400, 'Password must be at least 6 characters');
    const validRoles = ['student', 'instructor'];
    if (!validRoles.includes(role)) return sendError(res, 400, 'Invalid role');

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length) return sendError(res, 409, 'Email already registered');

    const passwordHash = await bcrypt.hash(password, 12);
    const id = randomUUID();
    await pool.query(
      'INSERT INTO users (id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
      [id, name, email, passwordHash, role]
    );
    const result = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [id]);
    const user = result.rows[0];
    const { accessToken, refreshToken } = generateTokens(user.id);
    await pool.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshToken, user.id]);

    sendSuccess(res, { user, accessToken, refreshToken }, 'Registration successful', 201);
  } catch (err) {
    sendError(res, 500, 'Registration failed', err.message);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return sendError(res, 400, 'Email and password are required');

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return sendError(res, 401, 'Invalid email or password');
    if (user.is_suspended) return sendError(res, 403, 'Account suspended. Contact support.');

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return sendError(res, 401, 'Invalid email or password');

    const { accessToken, refreshToken } = generateTokens(user.id);
    await pool.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshToken, user.id]);

    const { password_hash, refresh_token, ...safeUser } = user;
    sendSuccess(res, { user: safeUser, accessToken, refreshToken }, 'Login successful');
  } catch (err) {
    sendError(res, 500, 'Login failed', err.message);
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return sendError(res, 401, 'Refresh token required');

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const result = await pool.query('SELECT id FROM users WHERE id = $1 AND refresh_token = $2', [decoded.userId, refreshToken]);
    if (!result.rows[0]) return sendError(res, 401, 'Invalid refresh token');

    const tokens = generateTokens(decoded.userId);
    await pool.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [tokens.refreshToken, decoded.userId]);

    sendSuccess(res, tokens, 'Token refreshed');
  } catch (err) {
    sendError(res, 401, 'Invalid refresh token');
  }
};

export const logout = async (req, res) => {
  try {
    await pool.query('UPDATE users SET refresh_token = NULL WHERE id = $1', [req.user.id]);
    sendSuccess(res, null, 'Logged out successfully');
  } catch (err) {
    sendError(res, 500, 'Logout failed');
  }
};

export const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, avatar, bio, is_verified, is_instructor_approved, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    sendSuccess(res, result.rows[0]);
  } catch (err) {
    sendError(res, 500, 'Failed to get user');
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, bio, avatar } = req.body;
    await pool.query(
      'UPDATE users SET name = COALESCE($1, name), bio = COALESCE($2, bio), avatar = COALESCE($3, avatar), updated_at = NOW() WHERE id = $4',
      [name, bio, avatar, req.user.id]
    );
    const result = await pool.query(
      'SELECT id, name, email, role, avatar, bio FROM users WHERE id = $1',
      [req.user.id]
    );
    sendSuccess(res, result.rows[0], 'Profile updated');
  } catch (err) {
    sendError(res, 500, 'Failed to update profile');
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return sendError(res, 400, 'Both passwords required');
    if (newPassword.length < 6) return sendError(res, 400, 'New password must be at least 6 characters');

    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const isMatch = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!isMatch) return sendError(res, 400, 'Current password is incorrect');

    const newHash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user.id]);
    sendSuccess(res, null, 'Password changed successfully');
  } catch (err) {
    sendError(res, 500, 'Failed to change password');
  }
};
