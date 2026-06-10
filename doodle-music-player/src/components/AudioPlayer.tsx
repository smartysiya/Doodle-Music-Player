import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Plus, LogIn, LogOut, Sun, Moon, Music, Heart, Sparkles, FolderUp, 
  Trash2, Radio, Check, Circle
} from 'lucide-react';
import { useAudioStore, Song } from '../stores/audioStore';
import { useAudioAnalyzer } from '../hooks/useAudioAnalyzer';
import { DoodleCharacter } from './Doodle/DoodleCharacter';
import { InteractiveWaveform } from './Waveform/InteractiveWaveform';
import { PlaybackControls } from './Controls/PlaybackControls';
import { AuthModal } from './Auth/AuthModal';

// Initial default fallback tracks to ensure the player works immediately
const DEFAULT_TRACKS: Song[] = [
  {
    id: 'default-1',
    title: 'Good Vibes',
    artist: 'The Sketchers',
    fileUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration: 372,
  },
  {
    id: 'default-2',
    title: 'Pencil Scribbles',
    artist: 'Lo-Fi Doodle Band',
    fileUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    duration: 425,
  },
  {
    id: 'default-3',
    title: 'Sunset Coffee',
    artist: 'Pastel Dreams',
    fileUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    duration: 302,
  }
];

export const AudioPlayer: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Zustand Store
  const {
    isPlaying,
    currentTime,
    currentTrack,
    queue,
    volume,
    isMuted,
    user,
    token,
    favorites,
    setPlaying,
    setCurrentTime,
    setDuration,
    playTrack,
    setQueue,
    logout,
    setFavorites
  } = useAudioStore();

  // Initialize Web Audio Analyzer
  useAudioAnalyzer(audioRef);

  // Component local states
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [songsList, setSongsList] = useState<Song[]>(DEFAULT_TRACKS);
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'history'>('all');
  
  // Handle volume & mute changes in HTMLAudioElement
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Handle track source changes and play/pause state in HTMLAudioElement
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;
    
    // Check if the source has actually changed
    if (audioRef.current.src !== currentTrack.fileUrl) {
      audioRef.current.src = currentTrack.fileUrl;
      audioRef.current.load(); // Reload element with new source
    }
    
    if (isPlaying) {
      audioRef.current.play().catch((err) => {
        console.warn('Playback interrupted or blocked by user gesture:', err);
        setPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentTrack, setPlaying]);

  // Load songs list from database if authenticated
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/songs`);
        if (response.ok) {
          const data = await response.json();
          if (data.songs && data.songs.length > 0) {
            // Merge database songs with defaults
            setSongsList([...data.songs, ...DEFAULT_TRACKS]);
          }
        }
      } catch (err) {
        console.warn('Server not available, loading default portfolio songs:', err);
      }
    };
    
    fetchSongs();
  }, [token]);

  // Initialize default track if none loaded
  useEffect(() => {
    if (!currentTrack && songsList.length > 0) {
      playTrack(songsList[0], songsList);
      // Wait, playTrack automatically sets isPlaying to true, but we want it paused initially on boot
      setPlaying(false);
    }
  }, [songsList, currentTrack]);

  // Dark mode class sync
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Handle Play/Pause Toggle
  const handlePlayPause = () => {
    if (!currentTrack) return;
    setPlaying(!isPlaying);
  };

  // Audio Time Update listener
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  // Audio track ended listener -> trigger next song
  const handleEnded = () => {
    setPlaying(false);
    useAudioStore.getState().nextTrack();
  };

  // File Upload parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newSongs: Song[] = [];

    Array.from(files).forEach((file) => {
      const blobUrl = URL.createObjectURL(file);
      
      const track: Song = {
        id: 'local-' + Date.now() + Math.random().toString(36).substr(2, 5),
        title: file.name.substring(0, file.name.lastIndexOf('.')) || file.name,
        artist: 'Local Upload',
        fileUrl: blobUrl,
        duration: 0, // Determined once loaded in audio element
      };

      newSongs.push(track);
    });

    // Update locally displayed songs and set as active queue
    const updatedSongsList = [...newSongs, ...songsList];
    setSongsList(updatedSongsList);
    setQueue(updatedSongsList);

    // Auto play the first uploaded track
    if (newSongs.length > 0) {
      playTrack(newSongs[0], updatedSongsList);
    }
  };

  // Delete local song from list
  const handleDeleteSong = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = songsList.filter(s => s.id !== id);
    setSongsList(updated);
    setQueue(updated);
    
    if (currentTrack?.id === id) {
      setPlaying(false);
      if (updated.length > 0) {
        playTrack(updated[0], updated);
        setPlaying(false);
      }
    }
  };

  // Sync favorites
  const toggleFavOnSong = async (song: Song, e: React.MouseEvent) => {
    e.stopPropagation();
    useAudioStore.getState().toggleFavorite(song.id);
    
    if (token) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/favorites/toggle`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ songId: song.id })
        });
      } catch (err) {
        console.error('Failed to sync favorite on server:', err);
      }
    }
  };

  // Filter songs based on active tab
  const getFilteredSongs = () => {
    switch (activeTab) {
      case 'favorites':
        return songsList.filter(s => favorites.includes(s.id));
      case 'history':
        const historyIds = useAudioStore.getState().history.map(h => h.id);
        return songsList.filter(s => historyIds.includes(s.id));
      case 'all':
      default:
        return songsList;
    }
  };

  const filteredSongs = getFilteredSongs();

  return (
    <div className="min-h-screen notebook-grid notebook-margin-line pl-12 pr-4 sm:pr-8 py-8 flex flex-col items-center">
      
      {/* Upper Navigation Navbar */}
      <header className="w-full max-w-5xl flex items-center justify-between mb-8 pb-4 border-b-2 border-slate-800 dark:border-slate-100 z-10">
        <div className="flex items-center gap-2">
          <span className="text-3xl">📒</span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black font-handwritten tracking-wide text-slate-800 dark:text-slate-50 leading-tight">
              DOODLE MUSIC PLAYER
            </h1>
            <p className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500">
              Music + Doodles that move with the beat
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 sketch-btn text-slate-700 dark:text-slate-200"
            title="Toggle theme"
          >
            {darkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
          </button>

          {/* Auth Button */}
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-mono font-bold hidden sm:inline-block text-slate-600 dark:text-slate-300 bg-yellow-100 dark:bg-yellow-950/40 border border-slate-800 dark:border-slate-600 px-3 py-1.5 rounded-full">
                ✏️ {user.username}
              </span>
              <button
                onClick={logout}
                className="p-2 sm:px-4 sm:py-2 sketch-btn flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200"
                title="Logout"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthOpen(true)}
              className="px-4 py-2 sketch-btn flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-100 bg-purple-100 dark:bg-purple-950/45 border-slate-800"
            >
              <LogIn size={16} />
              <span>Login / Register</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container Dashboard */}
      <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 items-start">
        
        {/* Left 2 Columns: Main Player Card */}
        <section className="lg:col-span-2 flex flex-col gap-6">
          <div className="w-full bg-white dark:bg-zinc-900 sketch-card p-6 sm:p-8 relative overflow-hidden flex flex-col md:flex-row gap-6 sm:gap-8">
            
            {/* Sketch binder ring overlays */}
            <div className="absolute -left-1 top-12 flex flex-col gap-4 pointer-events-none">
              <div className="w-6 h-3 bg-slate-300 dark:bg-zinc-700 border-2 border-slate-800 dark:border-slate-500 rounded-full"></div>
              <div className="w-6 h-3 bg-slate-300 dark:bg-zinc-700 border-2 border-slate-800 dark:border-slate-500 rounded-full"></div>
              <div className="w-6 h-3 bg-slate-300 dark:bg-zinc-700 border-2 border-slate-800 dark:border-slate-500 rounded-full"></div>
            </div>

            {/* Left Box: Static Album Art with yellow scribbling and stick figure */}
            <div className="flex flex-col items-center justify-center bg-yellow-100/60 dark:bg-yellow-950/20 w-full md:w-[200px] h-[210px] shrink-0 border-3 border-slate-800 dark:border-slate-300 rounded-2xl relative overflow-hidden shadow-block-sm">
              {/* Yellow highlighter scribble SVG overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none">
                <svg viewBox="0 0 100 100" fill="none" className="w-[125%] h-[125%] select-none">
                  <path
                    d="M 10 30 Q 50 15 90 20 Q 95 50 85 80 Q 40 95 15 75 Q 5 50 10 30"
                    fill="#fef08a" // yellow-200
                  />
                  <path
                    d="M 20 40 Q 60 30 80 50 Q 50 70 30 50 Z"
                    fill="#fbcfe8" // pink-200
                    opacity="0.5"
                  />
                </svg>
              </div>

              {/* Hand-drawn stick figure drawing */}
              <svg
                width="110"
                height="120"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="z-10 drop-shadow"
              >
                {/* Head circle */}
                <path d="M 50 15 C 62 15 72 23 71 35 C 70 47 60 55 50 55 C 38 55 28 47 29 35 C 30 23 38 15 50 15 Z" stroke="var(--ink)" strokeWidth="3" fill="var(--bg-paper)" />
                {/* Face smile */}
                <circle cx="43" cy="31" r="3" fill="var(--ink)" />
                <circle cx="57" cy="31" r="3" fill="var(--ink)" />
                <path d="M 45 42 Q 50 47 55 42" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                {/* Spine & Arms */}
                <path d="M 50 55 L 50 85" stroke="var(--ink)" strokeWidth="3.5" />
                <path d="M 50 63 C 35 70 25 78 20 70" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" fill="none" />
                <path d="M 50 63 C 65 70 75 78 80 70" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" fill="none" />
                {/* Headphones */}
                <path d="M 31 35 C 31 16 69 16 69 35" stroke="#ec4899" strokeWidth="3" fill="none" />
                <circle cx="31" cy="35" r="4.5" fill="#a855f7" stroke="var(--ink)" strokeWidth="1.5" />
                <circle cx="69" cy="35" r="4.5" fill="#a855f7" stroke="var(--ink)" strokeWidth="1.5" />
                <text x="75" y="25" fontSize="13" fill="#a855f7" fontWeight="bold">♪</text>
              </svg>

              {/* Tape deco */}
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-14 h-5 bg-amber-100/70 border border-amber-200 rotate-2 opacity-80 flex items-center justify-center">
                <span className="text-[9px] font-mono text-amber-800">Doodle</span>
              </div>
            </div>

            {/* Right side inside player: Track Info, Canvas Waveform & Controls */}
            <div className="flex-1 flex flex-col justify-between min-w-0">
              
              {/* Dynamic beat-responsive doodle drawing */}
              <div className="absolute right-6 top-6 z-10">
                <DoodleCharacter />
              </div>

              {/* Title & Artist */}
              <div className="mb-4 pr-32">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs uppercase tracking-widest font-mono font-black text-purple-500 bg-purple-100 dark:bg-purple-950/40 px-2 py-0.5 rounded-md">
                    NOW JAMMING
                  </span>
                </div>
                <h2 className="text-3xl font-black text-slate-800 dark:text-slate-50 font-handwritten mt-1.5 leading-tight truncate">
                  {currentTrack ? currentTrack.title : 'Choose a Sketch'}
                </h2>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                  ✏️ {currentTrack ? currentTrack.artist : 'Select a song from the notebook'}
                </p>
              </div>

              {/* Canvas Waveform */}
              <div className="mb-4 bg-purple-50/55 dark:bg-purple-950/10 border-2 border-slate-800 dark:border-slate-700 rounded-2xl p-1 relative shadow-block-sm">
                <InteractiveWaveform audioRef={audioRef} />
              </div>

              {/* Playback controls */}
              <PlaybackControls onTogglePlay={handlePlayPause} />
            </div>

          </div>

          {/* Local Song Upload Notebook Section */}
          <div className="w-full bg-yellow-50/45 dark:bg-yellow-950/15 border-3 border-dashed border-slate-800 dark:border-slate-500 rounded-3xl p-6 text-center relative overflow-hidden shadow-block-sm">
            <label className="cursor-pointer block group">
              <input
                type="file"
                multiple
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="text-5xl mb-2.5 transition-transform group-hover:scale-110 group-hover:rotate-6 inline-block">📁</div>
              <h3 className="text-xl font-black font-handwritten text-slate-800 dark:text-slate-100 mb-1">
                DRAG OR CHOOSE YOUR MUSIC FILE
              </h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">
                Click to add files (MP3, WAV, OGG, etc.) to the sketchbook playlist.
              </p>
              <button
                type="button"
                className="px-6 py-2.5 sketch-btn font-bold text-sm bg-gradient-to-r from-pink-400 to-purple-500 text-white"
                onClick={(e) => {
                  // Trigger input click
                  const input = e.currentTarget.parentElement?.querySelector('input');
                  if (input) input.click();
                }}
              >
                Choose Files
              </button>
            </label>
          </div>
        </section>

        {/* Right Columns: Sidebar Playlist panel & Info logs */}
        <section className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Tabs header Playlist */}
          <div className="bg-white dark:bg-zinc-900 sketch-card-static p-5 flex flex-col h-[350px]">
            <div className="flex border-b-2 border-slate-800 dark:border-slate-700 mb-4 pb-2 justify-between">
              <button
                onClick={() => setActiveTab('all')}
                className={`font-handwritten text-lg font-bold px-1.5 pb-1 relative transition-colors ${
                  activeTab === 'all' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'
                }`}
              >
                All Songs
                {activeTab === 'all' && (
                  <motion.div layoutId="activeTabIndicator" className="absolute bottom-[-6px] left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('favorites')}
                className={`font-handwritten text-lg font-bold px-1.5 pb-1 relative transition-colors ${
                  activeTab === 'favorites' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'
                }`}
              >
                Favorites ({favorites.length})
                {activeTab === 'favorites' && (
                  <motion.div layoutId="activeTabIndicator" className="absolute bottom-[-6px] left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`font-handwritten text-lg font-bold px-1.5 pb-1 relative transition-colors ${
                  activeTab === 'history' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'
                }`}
              >
                History
                {activeTab === 'history' && (
                  <motion.div layoutId="activeTabIndicator" className="absolute bottom-[-6px] left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400" />
                )}
              </button>
            </div>

            {/* Scrollable song index lists */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2">
              <AnimatePresence>
                {filteredSongs.length > 0 ? (
                  filteredSongs.map((song) => {
                    const isSelected = currentTrack?.id === song.id;
                    const isSongFav = favorites.includes(song.id);
                    return (
                      <motion.div
                        key={song.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        onClick={() => playTrack(song, songsList)}
                        className={`p-2.5 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-purple-100/75 dark:bg-purple-950/20 border-purple-500 shadow-block-sm scale-[0.99]'
                            : 'bg-white dark:bg-zinc-800 border-slate-800 dark:border-slate-700 hover:border-purple-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {isSelected ? (
                            <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 border border-slate-800">
                              {isPlaying ? (
                                <span className="flex gap-0.5 items-end justify-center w-2.5 h-2.5">
                                  <span className="w-0.5 bg-white h-2 animate-pulse" style={{ animationDelay: '0.1s' }}></span>
                                  <span className="w-0.5 bg-white h-3.5 animate-pulse" style={{ animationDelay: '0.3s' }}></span>
                                  <span className="w-0.5 bg-white h-1.5 animate-pulse" style={{ animationDelay: '0.5s' }}></span>
                                </span>
                              ) : (
                                <Play size={10} fill="white" />
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 shrink-0">
                              <Music size={15} />
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className={`text-sm font-bold truncate leading-tight ${isSelected ? 'text-purple-700 dark:text-purple-300' : 'text-slate-700 dark:text-slate-200'}`}>
                              {song.title}
                            </p>
                            <p className="text-[10px] font-semibold text-slate-400 truncate">
                              {song.artist}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => toggleFavOnSong(song, e)}
                            className={`p-1 text-slate-300 dark:text-slate-600 hover:text-rose-500`}
                          >
                            <Heart size={14} fill={isSongFav ? '#f43f5e' : 'none'} stroke={isSongFav ? '#f43f5e' : 'currentColor'} />
                          </button>
                          
                          {song.id.startsWith('local-') && (
                            <button
                              onClick={(e) => handleDeleteSong(song.id, e)}
                              className="p-1 text-slate-300 hover:text-red-500 dark:text-slate-600"
                              title="Delete local file reference"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 flex flex-col items-center">
                    <span className="text-4xl text-slate-300 mb-2">📓</span>
                    <p className="text-sm font-mono font-bold text-slate-400">Notebook list is empty</p>
                    <p className="text-[10px] text-slate-400/80 mt-1 max-w-[170px] leading-tight">
                      Try uploading files or adding favorites to display them here!
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Sketch Illustration guide 1: Retro boombox */}
          <div className="bg-purple-100/60 dark:bg-purple-950/20 sketch-card-static p-4 flex gap-4 items-center">
            <div className="w-[80px] shrink-0">
              <svg viewBox="0 0 80 60" fill="none" className="stroke-slate-800 dark:stroke-slate-200" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                {/* Radio body */}
                <rect x="5" y="15" width="70" height="40" rx="4" fill="var(--bg-paper)" />
                <line x1="10" y1="23" x2="35" y2="23" />
                <circle cx="20" cy="40" r="8" />
                <circle cx="60" cy="40" r="8" />
                <circle cx="20" cy="40" r="3" fill="currentColor" />
                <circle cx="60" cy="40" r="3" fill="currentColor" />
                <rect x="42" y="20" width="12" height="10" rx="1" />
                {/* Handle */}
                <path d="M 20 15 L 20 8 L 60 8 L 60 15" fill="none" />
                <path d="M 10 8 L 6 3" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 font-mono">1. Play Music</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Play sample sketch files or drag in your own audio.
              </p>
            </div>
          </div>

          {/* Sketch Illustration guide 2: Dancing guitar */}
          <div className="bg-pink-100/60 dark:bg-pink-950/20 sketch-card-static p-4 flex gap-4 items-center">
            <div className="w-[80px] shrink-0 text-center text-3xl">
              🎸
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 font-mono">2. Doodle Reactions</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Stick figure head-bobs, dances, and jumps depending on bass drops!
              </p>
            </div>
          </div>

          {/* Sketch Illustration guide 3: Interactive Waveform */}
          <div className="bg-yellow-100/60 dark:bg-yellow-950/20 sketch-card-static p-4 flex gap-4 items-center">
            <div className="w-[80px] shrink-0">
              <svg viewBox="0 0 80 50" fill="none" stroke="var(--ink)" strokeWidth="2.2" strokeLinecap="round">
                {/* Simulated waveforms */}
                <path d="M5 25 Q15 5 25 35 T45 25 T65 15 T75 25" />
                <circle cx="45" cy="25" r="4" fill="var(--accent)" />
                <path d="M 45 25 L 49 34 L 54 30 L 45 25" fill="var(--ink)" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 font-mono">3. Interactive Waveform</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Drag, click, or scrub the canvas to fast forward any track.
              </p>
            </div>
          </div>

        </section>

      </main>

      {/* Grid footer - How it looks in action cards */}
      <footer className="w-full max-w-5xl border-t-2 border-slate-800 dark:border-slate-700 pt-8 pb-16">
        <h3 className="text-2xl font-black font-handwritten text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
          <span>🎨</span> HOW IT LOOKS IN ACTION
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          
          <div className="bg-white dark:bg-zinc-900 p-5 sketch-card-static flex flex-col gap-2">
            <div className="bg-purple-50 dark:bg-zinc-800 p-3.5 rounded-xl border-2 border-slate-800 dark:border-slate-700 flex items-center justify-center text-3xl select-none">
              🎧
            </div>
            <h4 className="text-base font-black font-handwritten text-slate-800 dark:text-slate-50">♫ Music Playing</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
              Doodles wake up and start breathing or swaying automatically on active playback.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-5 sketch-card-static flex flex-col gap-2">
            <div className="bg-pink-50 dark:bg-zinc-800 p-3.5 rounded-xl border-2 border-slate-800 dark:border-slate-700 flex items-center justify-center text-3xl select-none animate-bounce" style={{ animationDuration: '0.8s' }}>
              ⚡
            </div>
            <h4 className="text-base font-black font-handwritten text-slate-800 dark:text-slate-50">⚡ Bass / Beat Drop</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
              Stick figure goes wild, jumping or throwing hands on intense bass beat drops.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-5 sketch-card-static flex flex-col gap-2">
            <div className="bg-sky-50 dark:bg-zinc-800 p-3.5 rounded-xl border-2 border-slate-800 dark:border-slate-700 flex items-center justify-center text-3xl select-none">
              ☁️
            </div>
            <h4 className="text-base font-black font-handwritten text-slate-800 dark:text-slate-50">☁️ Calm Part / Silence</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
              Character sits down cross-legged on a floating cloud. Goes to sleep after seconds of pause.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-5 sketch-card-static flex flex-col gap-2">
            <div className="bg-yellow-50 dark:bg-zinc-800 p-3.5 rounded-xl border-2 border-slate-800 dark:border-slate-700 flex items-center justify-center text-3xl select-none">
              👆
            </div>
            <h4 className="text-base font-black font-handwritten text-slate-800 dark:text-slate-50">👆 Dragging & Clicking</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
              Scrub canvas to seek. Click the doodle directly to trigger stars and wave reactions.
            </p>
          </div>

        </div>

        {/* Tech Stack used footer card */}
        <div className="bg-white dark:bg-zinc-900 sketch-card-static p-6 flex flex-col md:flex-row items-center justify-between gap-6 border-slate-800">
          <div>
            <h4 className="text-lg font-black font-mono text-slate-800 dark:text-slate-100">Tech Stack Overview</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
              This portfolio project showcases clean frontend components built with React 18, Framer Motion animations, a canvas visualization API, and a custom beat detection algorithm driving stick-figure states.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 items-center justify-center">
            <span className="flex items-center gap-1 bg-sky-100 dark:bg-sky-950/40 border border-sky-400 px-3 py-1.5 rounded-full text-xs font-mono font-bold text-sky-700 dark:text-sky-300">
              ⚛️ React 18
            </span>
            <span className="flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-400 px-3 py-1.5 rounded-full text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300">
              🔊 Web Audio API
            </span>
            <span className="flex items-center gap-1 bg-purple-100 dark:bg-purple-950/40 border border-purple-400 px-3 py-1.5 rounded-full text-xs font-mono font-bold text-purple-700 dark:text-purple-300">
              ✨ Framer Motion
            </span>
            <span className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-950/40 border border-yellow-400 px-3 py-1.5 rounded-full text-xs font-mono font-bold text-yellow-700 dark:text-yellow-300">
              🎨 Canvas
            </span>
          </div>
        </div>

      </footer>

      {/* Hidden Audio Player Native Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        crossOrigin="anonymous"
      />

      {/* Authentication Modal */}
      <AnimatePresence>
        {isAuthOpen && (
          <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};
export default AudioPlayer;
