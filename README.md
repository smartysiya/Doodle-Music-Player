# Doodle Music Player 📒🎵

A portfolio-grade, full-stack music player web application designed with a custom hand-drawn sketchbook aesthetic. It combines Web Audio API frequency analysis, a real-time interactive canvas waveform, an animated SVG doodle character, and a Node.js + Express + Prisma backend with PostgreSQL.

---

## 🎨 Design Vision & Aesthetics
* **Sketchbook Paper Grid**: Cream-beige notebook lines and grid canvas patterns rendered in pure CSS.
* **Hand-Drawn Borders**: Slight structural irregularities using uneven border-radii and bold, comic-like block ink outlines.
* **Themed Color Palette**: Vibrant pastel purples, pinks, yellows, and slate accents matching a premium creative brand.
* **Responsive Layout**: Adapts cleanly from mobile, tablet, to widescreen desktop views. Supports instant light/dark mode theme toggling.

---

## ⚡ Tech Stack & Architecture

### Frontend (React 18 + TS + Vite + Tailwind + Framer Motion)
* **Zustand State (`src/stores/audioStore.ts`)**: Manages queue indexing, favorites listing, playing flags, user tokens, and real-time beat metrics.
* **Web Audio Analyzer (`src/hooks/useAudioAnalyzer.ts`)**:
  * Configures `AudioContext`, `AnalyserNode`, and connection logic.
  * Runs a 60 FPS analysis loop extracting Frequency Domain data.
  * Implements a **rolling history-based beat detection** algorithm over the bass band (20Hz–150Hz), comparison thresholds dynamically scaling to volume.
* **SVG Character (`src/components/Doodle/DoodleCharacter.tsx`)**:
  * Customizable stick-figure SVG whose face (singing oval, blushing, blinking, eyes closed) and limbs (guitar waving, head-bobbing, jumping) are animated dynamically based on audio energy states.
  * Features a **sleeping idle mode** after 12 seconds of silence (lying down on a cloud with rising Zzz particles) and interactive click responses.
* **Interactive Canvas (`src/components/Waveform/InteractiveWaveform.tsx`)**:
  * Reads selected tracks as `ArrayBuffer` objects and decodes channels with `decodeAudioData` to extract true static peaks.
  * Supports click-to-seek and click-and-drag scrubbing.
  * Overlays glowing frequency visualizer bands centered directly at the active playhead.

### Backend (Node.js + Express + TypeScript + Prisma ORM + PostgreSQL)
* **Prisma Schema (`server/prisma/schema.prisma`)**: Relations mapping users, tracks, playlists, liked bookmarks, and listen logs.
* **JWT Auth Middleware (`server/src/middleware/auth.ts`)**: Decodes and verifies token signatures on protected scopes.
* **PBKDF2 Password Hashing (`server/src/routes/auth.ts`)**: Natively hashes credentials using Node's standard `crypto` module, avoiding binary-related C++ compiler issues on Windows.
* **Multer Upload Engine (`server/src/routes/songs.ts`)**: Parses uploaded audio formats (MP3, WAV, OGG), saves files locally on the server (`uploads/`), and serves them statically.

---

## 📁 File Structure

```
c:/Doodle Music Player/
├── doodle-music-player/       # React Vite Frontend Client
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   │   └── AuthModal.tsx          # Login & SignUp Forms
│   │   │   ├── Controls/
│   │   │   │   └── PlaybackControls.tsx   # Scrubbers, Volume, & State Buttons
│   │   │   ├── Doodle/
│   │   │   │   └── DoodleCharacter.tsx    # Animated SVG Stick-figure
│   │   │   ├── Waveform/
│   │   │   │   └── InteractiveWaveform.tsx # Interactive HTML5 Canvas
│   │   │   └── AudioPlayer.tsx            # Main Unified Layout Shell
│   │   ├── hooks/
│   │   │   └── useAudioAnalyzer.ts        # FFT Audio Engine & Beat Detector
│   │   ├── stores/
│   │   │   └── audioStore.ts              # Zustand Global Store
│   │   ├── index.css                      # Global Styles & Sketchbook grids
│   │   ├── App.tsx                        # Client Core Mount
│   │   └── main.tsx                       # React DOM Root
│   └── package.json
│
├── server/                    # Node.js Express Backend API
│   ├── prisma/
│   │   └── schema.prisma                  # PostgreSQL Database Schema
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.ts                    # JWT Access Token validator
│   │   ├── routes/
│   │   │   ├── auth.ts                    # Register, Login & Profile verification
│   │   │   ├── favorites.ts               # Favorite bookmark toggles
│   │   │   ├── history.ts                 # Logged song play statistics
│   │   │   ├── playlists.ts               # Custom Playlist CRUD & item mapping
│   │   │   └── songs.ts                   # Multer file receiver & track feed
│   │   └── index.ts                       # Server Entry point & uploads static router
│   ├── package.json
│   └── tsconfig.json
│
└── uploads/                   # Statically served user-uploaded tracks
```

---

## 🔌 API Route Reference

| Method | Endpoint | Auth | Description | Payload |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | No | Creates a user, hashes password, returns token | `{ username, email, password }` |
| **POST** | `/api/api/auth/login` | No | Validates credentials, returns JWT token | `{ email, password }` |
| **GET** | `/api/auth/me` | Yes | Retrieves authenticated profile data | *None* |
| **GET** | `/api/songs` | No | Lists all uploaded songs in database | *None* |
| **POST** | `/api/songs/upload` | Yes | Uploads MP3/WAV file, saves track in DB | Form-data: `audio`, `title`, `artist`, `duration` |
| **GET** | `/api/favorites` | Yes | Lists IDs of songs favorited by active user | *None* |
| **POST** | `/api/favorites/toggle` | Yes | Alternates a song between liked/unliked | `{ songId }` |
| **GET** | `/api/playlists` | Yes | Retrieves user's playlists including songs | *None* |
| **POST** | `/api/playlists` | Yes | Creates a new blank playlist | `{ name }` |
| **DELETE** | `/api/playlists/:id` | Yes | Deletes a custom playlist | *None* |
| **POST** | `/api/playlists/:id/songs`| Yes | Inserts a song into a specific playlist | `{ songId }` |
| **GET** | `/api/history` | Yes | Returns user's last 40 play records | *None* |

---

## 🚀 Installation & Local Launch

Follow these steps to spin up the local development servers:

### 1. Database Configuration
1. Ensure **PostgreSQL** is running locally on your machine.
2. Create an empty database named `doodle_music_player`.
3. Check backend configurations inside [server/.env](file:///c:/Doodle%20Music%20Player/server/.env):
   ```env
   PORT=5000
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/doodle_music_player
   JWT_SECRET=super-doodle-secret-key-12345
   ```
   *Modify database credentials (username, password, port) as needed for your local environment.*

### 2. Backend Server Setup
Open a terminal in the `server/` directory:
```bash
cd server
# Install dependencies
npm install

# Build Prisma Client and run migrations to create tables
npx prisma migrate dev --name init

# Start the compilation server in hot-reload mode
npm run dev
```

### 3. Frontend Client Setup
Open a new terminal in the `doodle-music-player/` directory:
```bash
cd doodle-music-player
# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

### 4. Direct Operations Verification
1. Access the web app in your browser (usually `http://localhost:5173`).
2. Click **Choose Files** to drag in local audio files (MP3, WAV, etc.) to immediately test the canvas rendering, seek scrubbing, and active beat animations.
3. Click **Login / Register** to create an account. Once logged in, upload tracks to sync them with your database, save bookmarks via the heart icon, and review your Listening History!
