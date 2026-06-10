import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { useAudioStore } from '../../stores/audioStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { setAuth, setFavorites } = useAudioStore();
  const [isLogin, setIsLogin] = useState(true);
  
  // Form values
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // UI Status
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    const payload = isLogin 
      ? { email, password } 
      : { username, email, password };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed. Please check your credentials.');
      }

      // Save credentials in store & storage
      setAuth(data.user, data.token);

      // If logging in, retrieve current user's favorites from server
      if (data.token) {
        try {
          const favResponse = await fetch(`${import.meta.env.VITE_API_URL}/favorites`, {
            headers: {
              'Authorization': `Bearer ${data.token}`
            }
          });
          if (favResponse.ok) {
            const favData = await favResponse.json();
            setFavorites(favData.favorites || []);
          }
        } catch (e) {
          console.error('Failed to pre-fetch user favorites:', e);
        }
      }

      onClose();
    } catch (err: any) {
      setError(err.message || 'Server error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 15, rotate: -2 }}
        animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10, rotate: 1 }}
        transition={{ type: 'spring', duration: 0.4 }}
        className="w-full max-w-md bg-white dark:bg-zinc-900 p-8 sketch-card-static relative overflow-hidden"
      >
        {/* Hand drawn margins/lines pattern inside card */}
        <div className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r from-pink-300 to-purple-400 opacity-60"></div>
        <div className="absolute top-4 right-4 text-slate-400 flex items-center gap-1">
          <Sparkles size={16} className="text-yellow-400 animate-spin" style={{ animationDuration: '6s' }} />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 sketch-btn text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <X size={18} strokeWidth={2.5} />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-black font-handwritten text-slate-800 dark:text-slate-50 mt-2">
            {isLogin ? '✏️ WELCOME BACK' : '🖍️ SIGN UP TODAY'}
          </h2>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            {isLogin ? 'Sync your custom doodles, playlists, and likes' : 'Create an account to keep your playlist bookmarks'}
          </p>
        </div>

        {/* Error Message Box */}
        {error && (
          <div className="mb-5 p-3.5 bg-rose-50 dark:bg-rose-950/35 border-2 border-rose-500 text-rose-600 dark:text-rose-400 rounded-xl font-medium text-sm text-center font-handwritten text-lg leading-tight">
            ⚠️ {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="doodler123"
                className="w-full px-4 py-2.5 sketch-input"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doodle@music.com"
              className="w-full px-4 py-2.5 sketch-input"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 sketch-input"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 mt-4 bg-gradient-to-r from-pink-400 via-purple-500 to-purple-600 text-white rounded-full font-bold hover:shadow-lg transition-all border-2 border-slate-800 disabled:opacity-50 font-handwritten text-xl tracking-wider"
          >
            {isLoading ? 'Loading...' : isLogin ? 'LOGIN' : 'REGISTER'}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="text-center mt-6">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="underline font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 font-handwritten text-lg inline-block"
            >
              {isLogin ? 'Register here' : 'Login instead'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
export default AuthModal;
