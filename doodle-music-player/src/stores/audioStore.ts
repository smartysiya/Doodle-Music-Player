import { create } from 'zustand';

export interface Song {
  id: string;
  title: string;
  artist: string;
  fileUrl: string;
  duration: number;
  isFavorite?: boolean;
}

export type DoodleState = 'idle' | 'headBob' | 'dancing' | 'excited' | 'calm' | 'sleeping';

interface User {
  id: string;
  username: string;
}

interface AudioState {
  // Playback state
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  isRepeat: boolean;
  currentTrack: Song | null;
  queue: Song[];
  history: Song[];
  currentTrackIndex: number;
  favorites: string[]; // List of song IDs
  
  // Real-time analysis metrics
  doodleState: DoodleState;
  bassEnergy: number;
  midEnergy: number;
  trebleEnergy: number;
  isBeat: boolean;
  frequencyData: number[];

  // Authentication
  user: User | null;
  token: string | null;

  // Actions
  setPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  setMuted: (isMuted: boolean) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  
  // Queue Control
  playTrack: (track: Song, playlist?: Song[]) => void;
  setQueue: (tracks: Song[]) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  addToHistory: (track: Song) => void;
  
  // Favorites
  setFavorites: (favs: string[]) => void;
  toggleFavorite: (songId: string) => void;

  // Audio Analysis
  setDoodleState: (state: DoodleState) => void;
  setAudioMetrics: (metrics: {
    bassEnergy: number;
    midEnergy: number;
    trebleEnergy: number;
    isBeat: boolean;
    frequencyData: number[];
  }) => void;

  // Auth Actions
  setAuth: (user: User | null, token: string | null) => void;
  logout: () => void;
}

// Retrieve initial auth state from localStorage
const storedToken = localStorage.getItem('doodle_token');
const storedUser = localStorage.getItem('doodle_user');

export const useAudioStore = create<AudioState>((set, get) => ({
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: parseFloat(localStorage.getItem('doodle_volume') || '0.7'),
  isMuted: false,
  isShuffle: false,
  isRepeat: false,
  currentTrack: null,
  queue: [],
  history: [],
  currentTrackIndex: -1,
  favorites: [],

  doodleState: 'idle',
  bassEnergy: 0,
  midEnergy: 0,
  trebleEnergy: 0,
  isBeat: false,
  frequencyData: [],

  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken || null,

  setPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => {
    localStorage.setItem('doodle_volume', volume.toString());
    set({ volume });
  },
  setMuted: (isMuted) => set({ isMuted }),
  toggleShuffle: () => set((state) => ({ isShuffle: !state.isShuffle })),
  toggleRepeat: () => set((state) => ({ isRepeat: !state.isRepeat })),

  playTrack: (track, playlist) => {
    const { queue, history } = get();
    let newQueue = playlist ? [...playlist] : [...queue];
    
    // Add track to queue if not present
    if (!newQueue.some((s) => s.id === track.id)) {
      newQueue = [track, ...newQueue];
    }
    
    const index = newQueue.findIndex((s) => s.id === track.id);
    
    // Add to history
    const updatedHistory = [track, ...history.filter(s => s.id !== track.id)].slice(0, 50);

    set({
      currentTrack: track,
      currentTrackIndex: index,
      queue: newQueue,
      isPlaying: true,
      currentTime: 0,
      history: updatedHistory
    });
  },

  setQueue: (queue) => set({ queue }),

  nextTrack: () => {
    const { queue, currentTrackIndex, isRepeat, isShuffle } = get();
    if (queue.length === 0) return;

    let nextIndex = currentTrackIndex;
    if (isRepeat) {
      // Keep same track index, but reset time (done in audio player context)
      set({ currentTime: 0 });
      return;
    }

    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      nextIndex = (currentTrackIndex + 1) % queue.length;
    }

    set({
      currentTrackIndex: nextIndex,
      currentTrack: queue[nextIndex],
      currentTime: 0,
      isPlaying: true,
    });
  },

  prevTrack: () => {
    const { queue, currentTrackIndex } = get();
    if (queue.length === 0) return;

    const prevIndex = currentTrackIndex <= 0 ? queue.length - 1 : currentTrackIndex - 1;

    set({
      currentTrackIndex: prevIndex,
      currentTrack: queue[prevIndex],
      currentTime: 0,
      isPlaying: true,
    });
  },

  addToHistory: (track) => set((state) => ({
    history: [track, ...state.history.filter(s => s.id !== track.id)].slice(0, 50)
  })),

  setFavorites: (favorites) => set({ favorites }),
  toggleFavorite: (songId) => set((state) => {
    const isFav = state.favorites.includes(songId);
    const favorites = isFav 
      ? state.favorites.filter(id => id !== songId) 
      : [...state.favorites, songId];
    return { favorites };
  }),

  setDoodleState: (doodleState) => set({ doodleState }),
  
  setAudioMetrics: (metrics) => set({
    bassEnergy: metrics.bassEnergy,
    midEnergy: metrics.midEnergy,
    trebleEnergy: metrics.trebleEnergy,
    isBeat: metrics.isBeat,
    frequencyData: metrics.frequencyData
  }),

  setAuth: (user, token) => {
    if (token && user) {
      localStorage.setItem('doodle_token', token);
      localStorage.setItem('doodle_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('doodle_token');
      localStorage.removeItem('doodle_user');
    }
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem('doodle_token');
    localStorage.removeItem('doodle_user');
    set({ user: null, token: null, favorites: [] });
  }
}));
