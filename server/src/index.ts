import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// Import Routers
import authRouter from './routes/auth';
import songsRouter from './routes/songs';
import playlistsRouter from './routes/playlists';
import favoritesRouter from './routes/favorites';
import historyRouter from './routes/history';

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Initialize Prisma client
const prisma = new PrismaClient();

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: false, // Allows cross-origin image/audio loading from Vercel frontend
}));
app.use(cors());
app.use(express.json());

// Serve static uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Routes Hookup
app.use('/api/auth', authRouter);
app.use('/api/songs', songsRouter);
app.use('/api/playlists', playlistsRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/history', historyRouter);

// Basic Health Check Route
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to the Doodle Music Player API!',
    status: 'healthy',
  });
});

// Start the server
app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
  console.log(`📂[uploads]: Uploaded tracks served at http://localhost:${port}/uploads`);
});
