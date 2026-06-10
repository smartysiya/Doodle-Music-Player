import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/history - Retrieve user's listening history
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }

  try {
    const history = await prisma.history.findMany({
      where: { userId: req.user.id },
      include: {
        song: true
      },
      orderBy: {
        playedAt: 'desc'
      },
      take: 40 // limit to last 40 plays
    });

    res.json({ history });
  } catch (error) {
    console.error('Fetch history error:', error);
    res.status(500).json({ error: 'Failed to retrieve listening history.' });
  }
});

// POST /api/history - Add song to listening history
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }

  const { songId } = req.body;
  if (!songId) {
    res.status(400).json({ error: 'Song ID is required.' });
    return;
  }

  try {
    const record = await prisma.history.create({
      data: {
        userId: req.user.id,
        songId
      },
      include: {
        song: true
      }
    });

    res.status(201).json({ message: 'Listening history logged.', record });
  } catch (error) {
    console.error('Save history log error:', error);
    res.status(500).json({ error: 'Failed to log history.' });
  }
});

export default router;
