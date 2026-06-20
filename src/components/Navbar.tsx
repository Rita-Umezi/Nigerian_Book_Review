import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import AuthModal from './AuthModal.tsx';
import { BookOpen, Flame, Sparkles, Trophy, LogOut, LogIn, User } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [initialTab, setInitialTab] = useState<'login' | 'register'>('login');

  const openAuth = (tab: 'login' | 'register') => {
    setInitialTab(tab);
    setAuthModalOpen(true);
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'text-[#C05E42] font-semibold border-b-2 border-[#C05E42] pb-1' : 'text-[#5A5A40]/80 hover:text-[#C05E42] transition-colors';
  };

  return (
    <>
      <nav className="border-b border-[#EAE7DE] bg-[#FDFCF8]/90 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="bg-[#C05E42] p-1.5 rounded-full group-hover:bg-[#A94A2F] transition-colors">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[#5A5A40] font-display font-extrabold text-lg tracking-tight group-hover:text-[#C05E42] transition-colors">
                    NaijaReads
                  </span>
                  <span className="text-[9px] text-[#C05E42] font-bold tracking-wider -mt-1 uppercase">
                    Nigerian Literature
                  </span>
                </div>
              </Link>

              {/* Links */}
              <div className="hidden md:flex items-center gap-6 text-sm">
                <Link to="/books" className={isActive('/books')}>
                  Explore Library
                </Link>
                <Link to="/recommendations" className={`${isActive('/recommendations')} flex items-center gap-1.5`}>
                  <Sparkles className="w-3.5 h-3.5 text-[#C05E42]" />
                  AI Curator
                </Link>
                <Link to="/leaderboard" className={isActive('/leaderboard')}>
                  Trophy & Leaderboard
                </Link>
              </div>
            </div>

            {/* Right items */}
            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                  {/* Streak indicator */}
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F2ED] border border-[#EAE7DE] rounded-xl text-[#C05E42] font-bold text-sm"
                    title="Your current active reading streak"
                  >
                    <Flame className="w-4 h-4 fill-[#C05E42]/80 text-[#C05E42]" />
                    <span>{user.readingStreak} Day Streak</span>
                  </div>

                  {/* Profile avatar link */}
                  <Link
                    to={`/profile/${user.username}`}
                    className="flex items-center gap-2.5 p-1 px-3 bg-white border border-[#EAE7DE] rounded-xl hover:border-[#C05E42] transition-all shadow-sm"
                  >
                    <img
                      src={user.avatarUrl}
                      alt={user.displayName}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-lg object-cover"
                    />
                    <div className="hidden sm:flex flex-col text-left">
                      <span className="text-xs text-[#1A1A1A] font-semibold line-clamp-1">{user.displayName}</span>
                      <span className="text-[10px] text-[#5A5A40] font-medium">{user.readingRank}</span>
                    </div>
                  </Link>

                  <button
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                    className="text-[#5A5A40]/70 hover:text-[#C05E42] transition-colors p-2 rounded-lg hover:bg-[#F5F2ED]"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => openAuth('login')}
                    className="text-[#5A5A40] hover:text-[#C05E42] text-xs font-semibold px-4 py-2 hover:bg-[#F5F2ED] rounded-xl transition-all"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => openAuth('register')}
                    className="bg-[#C05E42] hover:bg-[#A94A2F] text-white text-xs font-semibold px-4 py-2 rounded-full transition-all shadow-sm"
                  >
                    Join Free
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile navigation links */}
          <div className="md:hidden flex items-center justify-around py-3 border-t border-[#EAE7DE] text-xs bg-[#FDFCF8]">
            <Link to="/books" className={isActive('/books')}>
              Explore
            </Link>
            <Link to="/recommendations" className={`${isActive('/recommendations')} flex items-center gap-1`}>
              <Sparkles className="w-3.5 h-3.5 text-[#C05E42]" />
              AI Curator
            </Link>
            <Link to="/leaderboard" className={isActive('/leaderboard')}>
              Leaderboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Auth modal triggers */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={initialTab}
      />
    </>
  );
}
