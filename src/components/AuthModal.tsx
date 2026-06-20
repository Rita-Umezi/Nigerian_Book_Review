import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, Sparkles, LogIn, UserPlus } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register';
}

const AVAILABLE_GENRES = [
  'African Literature',
  'Historical Fiction',
  'Comedy / Thriller',
  'Romance / Drama',
  'Fantasy',
  'Fiction / Surrealist',
  'Comedy',
  'Drama / Poetry'
];

export default function AuthModal({ isOpen, onClose, initialTab = 'login' }: AuthModalProps) {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (tab === 'login') {
        await login({ emailOrUsername, password });
        setSuccess('Logged in successfully!');
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        await register({
          username,
          displayName,
          email,
          password,
          favoriteGenres: selectedGenres
        });
        setSuccess('Account created successfully!');
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal box */}
      <motion.div
        initial={{ scale: 0.95, y: 15, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 15, opacity: 0 }}
        className="relative bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden p-6 z-10 text-zinc-100"
        id="auth-modal-container"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-100 transition-colors p-1 bg-zinc-900 border border-zinc-800 rounded-lg"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Tab selector */}
        <div className="flex gap-2 p-1 bg-zinc-900 border border-zinc-800 rounded-xl mb-6 w-fit">
          <button
            onClick={() => { setTab('login'); setError(''); }}
            className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg transition-all ${
              tab === 'login'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            id="auth-tab-login"
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In
          </button>
          <button
            onClick={() => { setTab('register'); setError(''); }}
            className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg transition-all ${
              tab === 'register'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            id="auth-tab-register"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Join Community
          </button>
        </div>

        {/* Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Sparkles className="text-emerald-400 w-5 h-5" />
            {tab === 'login' ? 'Welcome back to NaijaReads' : 'Step into Naija\'s Library'}
          </h2>
          <p className="text-zinc-400 text-sm mt-1">
            {tab === 'login'
              ? 'Enter your details to rejoin the reading circle.'
              : 'Discover amazing African stories and log your achievements.'}
          </p>
        </div>

        {/* Error / Success feedback warnings */}
        {error && (
          <div className="mb-4 bg-rose-950/40 border border-rose-800/50 text-rose-200 text-xs p-3 rounded-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 bg-emerald-950/40 border border-emerald-800/50 text-emerald-200 text-xs p-3 rounded-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'login' ? (
            <>
              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1.5 uppercase tracking-wider">
                  Email or Username
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    required
                    value={emailOrUsername}
                    onChange={e => setEmailOrUsername(e.target.value)}
                    placeholder="adebayo@gmail.com or achi_reads"
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl focus:outline-none text-sm text-zinc-100 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl focus:outline-none text-sm text-zinc-100 transition-colors"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1.5 uppercase tracking-wider">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="chi_reads"
                      className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl focus:outline-none text-xs text-zinc-100 placeholder:text-zinc-600 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1.5 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Chinedu Okafor"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl focus:outline-none text-xs text-zinc-100 placeholder:text-zinc-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="chinedu@yahoo.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl focus:outline-none text-sm text-zinc-100 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl focus:outline-none text-sm text-zinc-100 transition-colors"
                  />
                </div>
              </div>

              {/* Genre Selector */}
              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-2 uppercase tracking-wider">
                  Select Favorite Genres (Optional)
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto pr-1">
                  {AVAILABLE_GENRES.map(genre => {
                    const isSelected = selectedGenres.includes(genre);
                    return (
                      <button
                        type="button"
                        key={genre}
                        onClick={() => handleGenreToggle(genre)}
                        className={`text-left text-[11px] font-medium px-3 py-1.5 rounded-lg border transition-all truncate ${
                          isSelected
                            ? 'bg-emerald-900/35 text-emerald-400 border-emerald-500/80'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-805'
                        }`}
                      >
                        {isSelected && '✓ '} {genre}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-700/60 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            {tab === 'login' ? 'Sign In Now' : 'Create Account'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
