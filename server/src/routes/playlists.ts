import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/playlists - Retrieve all playlists with songs
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }

  try {
    const playlists = await prisma.playlist.findMany({
      where: { userId: req.user.id },
      include: {
        items: {
          include: {
            song: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ playlists });
  } catch (error) {
    console.error('Fetch playlists error:', error);
    res.status(500).json({ error: 'Failed to retrieve playlists.' });
  }
});

// POST /api/playlists - Create new playlist
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }

  const { name } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Playlist name is required.' });
    return;
  }

  try {
    const playlist = await prisma.playlist.create({
      data: {
        name,
        userId: req.user.id
      },
      include: {
        items: true
      }
    });

    res.status(201).json({ message: 'Playlist created.', playlist });
  } catch (error) {
    console.error('Create playlist error:', error);
    res.status(500).json({ error: 'Failed to create playlist.' });
  }
});

// DELETE /api/playlists/:id - Delete playlist
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }

  const { id } = req.params;

  try {
    const playlist = await prisma.playlist.findUnique({
      where: { id }
    });

    if (!playlist) {
      res.status(404).json({ error: 'Playlist not found.' });
      return;
    }

    if (playlist.userId !== req.user.id) {
      res.status(403).json({ error: 'Forbidden. You do not own this playlist.' });
      return;
    }

    await prisma.playlist.delete({
      where: { id }
    });

    res.json({ message: 'Playlist deleted.' });
  } catch (error) {
    console.error('Delete playlist error:', error);
    res.status(500).json({ error: 'Failed to delete playlist.' });
  }
});

// POST /api/playlists/:id/songs - Add song to playlist
router.post('/:id/songs', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }

  const { id: playlistId } = req.params;
  const { songId } = req.body;

  if (!songId) {
    res.status(400).json({ error: 'Song ID is required.' });
    return;
  }

  try {
    // Check ownership
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId }
    });

    if (!playlist) {
      res.status(404).json({ error: 'Playlist not found.' });
      return;
    }

    if (playlist.userId !== req.user.id) {
      res.status(403).json({ error: 'Forbidden.' });
      return;
    }

    // Check if song already exists in playlist
    const existing = await prisma.playlistItem.findUnique({
      where: {
        playlistId_songId: {
          playlistId,
          songId
        }
      }
    });

    if (existing) {
      res.status(400).json({ error: 'Song is already in this playlist.' });
      return;
    }

    // Get current items count to determine ordering
    const count = await prisma.playlistItem.count({
      where: { playlistId }
    });

    const item = await prisma.playlistItem.create({
      data: {
        playlistId,
        songId,
        order: count + 1
      },
      include: {
        song: true
      }
    });

    res.status(201).json({ message: 'Song added to playlist.', item });
  } catch (error) {
    console.error('Add song to playlist error:', error);
    res.status(500).json({ error: 'Failed to add song to playlist.' });
  }
});

// DELETE /api/playlists/:id/songs/:songId - Remove song from playlist
router.delete('/:id/songs/:songId', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }

  const { id: playlistId, songId } = req.params;

  try {
    // Check ownership
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId }
    });

    if (!playlist) {
      res.status(404).json({ error: 'Playlist not found.' });
      return;
    }

    if (playlist.userId !== req.user.id) {
      res.status(403).json({ error: 'Forbidden.' });
      return;
    }

    await prisma.playlistItem.delete({
      where: {
        playlistId_songId: {
          playlistId,
          songId
        }
      }
    });

    res.json({ message: 'Song removed from playlist.' });
  } catch (error) {
    console.error('Remove song from playlist error:', error);
    res.status(500).json({ error: 'Failed to remove song.' });
  }
});

export default router;
