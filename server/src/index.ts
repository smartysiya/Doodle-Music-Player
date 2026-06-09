import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Initialize Prisma client
const prisma = new PrismaClient();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Basic Route
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to the Doodle Music Player API!',
    status: 'healthy',
  });
});

// Sample API Route showing Prisma usage
app.get('/api/songs', async (req: Request, res: Response) => {
  try {
    // We will query our Prisma database when it's configured
    // const songs = await prisma.song.findMany();
    res.json({
      message: 'This will return songs once Prisma schema is migrated.',
      songs: [],
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve songs' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
