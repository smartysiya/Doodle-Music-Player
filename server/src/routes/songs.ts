import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, '../../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'doodle-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB file size limit
  },
  fileFilter: (req, file, cb) => {
    // Check mime type
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed!'));
    }
  }
});

// GET /api/songs - List all songs
router.get('/', async (req, res) => {
  try {
    const songs = await prisma.song.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ songs });
  } catch (error) {
    console.error('Fetch songs error:', error);
    res.status(500).json({ error: 'Failed to retrieve songs list.' });
  }
});

// GET /api/songs/my-songs - List user uploaded songs
router.get('/my-songs', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }

  try {
    const songs = await prisma.song.findMany({
      where: { uploadedBy: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ songs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve your uploaded songs.' });
  }
});

// POST /api/songs/upload - Authenticated file upload
router.post('/upload', authenticateToken, upload.single('audio'), async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized. Please login to upload.' });
    return;
  }

  if (!req.file) {
    res.status(400).json({ error: 'Audio file is required.' });
    return;
  }

  const { title, artist, duration } = req.body;
  
  // Clean fallback parameters
  const fileBasename = req.file.originalname;
  const dotIndex = fileBasename.lastIndexOf('.');
  const fallbackTitle = dotIndex !== -1 ? fileBasename.substring(0, dotIndex) : fileBasename;

  const finalTitle = title || fallbackTitle;
  const finalArtist = artist || 'Local Upload';
  const finalDuration = parseFloat(duration) || 0.0;

  // We expose a server static asset path matching our express.static config
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

  try {
    const song = await prisma.song.create({
      data: {
        title: finalTitle,
        artist: finalArtist,
        duration: finalDuration,
        fileUrl,
        uploadedBy: req.user.id
      }
    });

    res.status(201).json({
      message: 'Audio track uploaded and registered successfully.',
      song
    });
  } catch (error) {
    console.error('Save song DB error:', error);
    // Cleanup physical file on DB failure
    const filepath = req.file.path;
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
    res.status(500).json({ error: 'Failed to save song registration.' });
  }
});

export default router;
