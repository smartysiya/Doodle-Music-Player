import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/favorites - Get all user's favorite song IDs
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }

  try {
    const favoritesList = await prisma.favorite.findMany({
      where: { userId: req.user.id },
      select: { songId: true }
    });

    const songIds = favoritesList.map((f) => f.songId);
    res.json({ favorites: songIds });
  } catch (error) {
    console.error('Fetch favorites error:', error);
    res.status(500).json({ error: 'Failed to retrieve favorites.' });
  }
});

// POST /api/favorites/toggle - Toggle favorite status
router.post('/toggle', authenticateToken, async (req: AuthRequest, res: Response) => {
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
    // Check if favorite exists
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_songId: {
          userId: req.user.id,
          songId
        }
      }
    });

    if (existing) {
      // Unfavorite
      await prisma.favorite.delete({
        where: {
          userId_songId: {
            userId: req.user.id,
            songId
          }
        }
      });
      res.json({ message: 'Removed from favorites.', favorited: false });
    } else {
      // Favorite
      await prisma.favorite.create({
        data: {
          userId: req.user.id,
          songId
        }
      });
      res.json({ message: 'Added to favorites.', favorited: true });
    }
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ error: 'Failed to update favorite status.' });
  }
});

export default router;
