import React from 'react';
import { motion } from 'framer-motion';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Heart, Shuffle, Repeat 
} from 'lucide-react';
import { useAudioStore } from '../../stores/audioStore';

interface PlaybackControlsProps {
  onTogglePlay: () => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({ onTogglePlay }) => {
  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    isRepeat,
    currentTrack,
    favorites,
    setVolume,
    setMuted,
    toggleShuffle,
    toggleRepeat,
    nextTrack,
    prevTrack,
    toggleFavorite
  } = useAudioStore();

  const isFav = currentTrack ? favorites.includes(currentTrack.id) : false;

  const formatTime = (time: number) => {
    if (isNaN(time) || !time) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleFavoriteClick = async () => {
    if (!currentTrack) return;
    
    // Optimistic store update
    toggleFavorite(currentTrack.id);
    
    // Fire API sync to backend in background if logged in
    const token = localStorage.getItem('doodle_token');
    if (token) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/favorites/toggle`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ songId: currentTrack.id }),
        });
      } catch (err) {
        console.error('Failed to sync favorite with server:', err);
      }
    }
  };

  return (
    <div className="w-full flex flex-col gap-5">
      {/* Time Progress Details & Playback Duration */}
      <div className="flex justify-between items-center px-1 text-sm font-mono font-bold text-slate-500 dark:text-slate-400">
        <span>{formatTime(currentTime)}</span>
        <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 animate-ping"></div>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Main Control Panel */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Shuffle / Repeat */}
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleShuffle}
            title="Shuffle"
            className={`p-2.5 sketch-btn text-sm font-bold flex items-center justify-center ${
              isShuffle 
                ? 'bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300 border-purple-500' 
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Shuffle size={18} strokeWidth={2.5} />
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleRepeat}
            title="Repeat"
            className={`p-2.5 sketch-btn text-sm font-bold flex items-center justify-center ${
              isRepeat 
                ? 'bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300 border-purple-500' 
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Repeat size={18} strokeWidth={2.5} />
          </motion.button>
        </div>

        {/* Back, Play, Next */}
        <div className="flex items-center gap-3.5">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={prevTrack}
            disabled={!currentTrack}
            title="Previous Track"
            className="p-3 sketch-btn text-slate-700 dark:text-slate-200"
          >
            <SkipBack size={20} fill="currentColor" strokeWidth={2} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.08, rotate: [0, -3, 3, 0] }}
            whileTap={{ scale: 0.92 }}
            onClick={onTogglePlay}
            disabled={!currentTrack}
            title={isPlaying ? 'Pause' : 'Play'}
            className="p-5 border-3 border-slate-800 dark:border-slate-100 rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-block-sm hover:shadow-block transition-all flex items-center justify-center"
          >
            {isPlaying ? (
              <Pause size={28} fill="currentColor" strokeWidth={1} />
            ) : (
              <Play size={28} fill="currentColor" strokeWidth={1} className="ml-1" />
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={nextTrack}
            disabled={!currentTrack}
            title="Next Track"
            className="p-3 sketch-btn text-slate-700 dark:text-slate-200"
          >
            <SkipForward size={20} fill="currentColor" strokeWidth={2} />
          </motion.button>
        </div>

        {/* Favorite */}
        <motion.button
          whileHover={{ scale: 1.1, rotate: [0, -8, 8, 0] }}
          whileTap={{ scale: 0.9 }}
          onClick={handleFavoriteClick}
          disabled={!currentTrack}
          title={isFav ? 'Remove Favorite' : 'Mark Favorite'}
          className={`p-3 sketch-btn font-bold flex items-center justify-center ${
            isFav 
              ? 'bg-rose-100 dark:bg-rose-950 text-rose-500 border-rose-500' 
              : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <Heart size={20} fill={isFav ? 'currentColor' : 'none'} strokeWidth={2.5} />
        </motion.button>
      </div>

      {/* Volume Bar */}
      <div className="flex items-center gap-3.5 bg-yellow-50 dark:bg-yellow-950/45 p-3 rounded-2xl border-2 border-slate-800 dark:border-slate-100 shadow-block-sm">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setMuted(!isMuted)}
          className="text-slate-700 dark:text-slate-200"
        >
          {isMuted || volume === 0 ? <VolumeX size={18} strokeWidth={2.5} /> : <Volume2 size={18} strokeWidth={2.5} />}
        </motion.button>
        
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            setVolume(val);
            if (isMuted) setMuted(false);
          }}
          className="flex-1 h-2 rounded-full cursor-pointer appearance-none bg-slate-200 dark:bg-zinc-800 accent-purple-600 cursor-pointer outline-none border border-slate-800 dark:border-slate-600"
          style={{
            background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${
              (isMuted ? 0 : volume) * 100
            }%, rgb(229 231 235) ${(isMuted ? 0 : volume) * 100}%, rgb(229 231 235) 100%)`
          }}
        />
        <span className="text-xs font-mono font-bold w-10 text-slate-700 dark:text-slate-200 text-right">
          {isMuted ? 'Muted' : `${Math.round(volume * 100)}%`}
        </span>
      </div>
    </div>
  );
};
export default PlaybackControls;
