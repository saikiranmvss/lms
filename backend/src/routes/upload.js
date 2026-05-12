import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticate, authorize } from '../middleware/auth.js';
import { sendError, sendSuccess } from '../utils/helpers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

const videoStorage = multer.diskStorage({
  destination: path.join(__dirname, '../../public/videos'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

const videoFilter = (req, file, cb) => {
  const allowed = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only video files are allowed'), false);
};

const upload = multer({
  storage: videoStorage,
  fileFilter: videoFilter,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2 GB
});

router.post('/video', authenticate, authorize('instructor', 'admin'), (req, res) => {
  upload.single('video')(req, res, (err) => {
    if (err) return sendError(res, 400, err.message || 'Upload failed');
    if (!req.file) return sendError(res, 400, 'No file uploaded');
    // Relative URL so the SPA always resolves against the browser origin (Vite proxy, Apache, CDN, etc.)
    const url = `/uploads/videos/${req.file.filename}`;
    sendSuccess(res, { url, filename: req.file.filename, size: req.file.size }, 'Video uploaded');
  });
});

export default router;
