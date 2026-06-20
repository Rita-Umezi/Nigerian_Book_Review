import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { User, Book, ReadingProgress } from '../types.ts';
import { Star, Flame, BookOpen, Clock, Calendar, Pencil, Check, Award, AlignLeft, Sparkles } from 'lucide-react';

interface ShelvedBook {
  id: string;
  bookId: string;
  status: string;
  currentPage: number;
  totalPages: number;
  notes?: string;
  book: Book;
}

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const { user: loggedInUser, updateUser } = useAuth();
  const isOwnProfile = loggedInUser?.username === username;

  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [shelves, setShelves] = useState<{ read: ShelvedBook[]; currently_reading: ShelvedBook[]; want_to_read: ShelvedBook[] }>({
    read: [],
    currently_reading: [],
    want_to_read: []
  });
  const [reviews, setReviews] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Active Shelving tab
  const [activeTab, setActiveTab] = useState<'read' | 'currently_reading' | 'want_to_read'>('currently_reading');

  // Edit fields profile states
  const [isEditing, setIsEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  const loadProfile = async () => {
    if (!username) return;
    try {
      const data = await api.users.getProfile(username);
      setTargetUser(data.user);
      setShelves(data.shelves);
      setReviews(data.reviews);
      setBadges(data.badgesResolved);

      // Synced defaults for editable bios
      setEditDisplayName(data.user.displayName);
      setEditBio(data.user.bio || '');
    } catch (err) {
      console.error(err);
      setError('Unable to load this user. They might not exist.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [username, loggedInUser]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditSuccess('');
    try {
      await updateUser({
        displayName: editDisplayName,
        bio: editBio
      });
      setEditSuccess('Profile saved successfully!');
      setTimeout(() => {
        setIsEditing(false);
        setEditSuccess('');
      }, 1000);
      loadProfile();
    } catch (err: any) {
      alert(err.message || 'Error updating profile');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#C05E42] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[#5A5A40] text-sm">Gathering reader credentials and shelf progress records...</p>
      </div>
    );
  }

  if (error || !targetUser) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-[#1A1A1A] space-y-4">
        <p className="font-serif italic font-bold text-lg">{error || 'Unable to locate this user.'}</p>
        <Link to="/" className="text-[#C05E42] mt-4 block font-bold hover:underline">
          Return to home board
        </Link>
      </div>
    );
  }

  const activeShelfList = shelves[activeTab] || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 pb-16 pt-6 text-left">
      {/* Profile Header Block rendered in White/Sand with clay badges */}
      <section className="bg-white border border-[#EAE7DE] rounded-[32px] p-6 md:p-8 relative overflow-hidden shadow-sm">
        
        <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
          
          {/* Left: Avatar Column */}
          <div className="space-y-4 flex flex-col items-center">
            <img
              src={targetUser.avatarUrl}
              alt={targetUser.displayName}
              referrerPolicy="no-referrer"
              className="w-24 h-24 rounded-full object-cover border-2 border-[#EAE7DE] shadow-sm"
            />

            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#F5F2ED] border border-[#EAE7DE] rounded-full text-[#C05E42] font-bold text-xs shadow-inner" title="Daily streak rating">
              <Flame className="w-4 h-4 fill-red-100" />
              <span>{targetUser.readingStreak} Day Streak</span>
            </div>
          </div>

          {/* Right: Core Meta Details */}
          <div className="flex-1 space-y-4 w-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-serif italic font-bold text-[#1A1A1A] tracking-tight">
                    {targetUser.displayName}
                  </h1>
                  <span className="text-[9px] bg-[#C05E42] text-white font-bold px-2.5 py-0.5 rounded-full uppercase tracking-widest shadow-sm">
                    {targetUser.readingRank}
                  </span>
                </div>
                <span className="text-gray-400 text-sm">@{targetUser.username}</span>
              </div>

              {/* Edit toggle button with Clay outline style */}
              {isOwnProfile && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="bg-white hover:bg-[#FDFCF8] text-[#5A5A40] font-bold text-xs px-4 py-2.5 rounded-full border border-[#EAE7DE] flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto shadow-sm"
                >
                  <Pencil className="w-3.5 h-3.5 text-[#C05E42]" />
                  {isEditing ? 'Cancel Edit' : 'Edit Bio'}
                </button>
              )}
            </div>

            {/* Profile editable states */}
            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl text-left bg-[#F5F2ED] border border-[#EAE7DE] p-5 rounded-3xl shadow-inner">
                {editSuccess && <p className="text-[#C05E42] font-bold text-xs mb-2">{editSuccess}</p>}
                
                <div>
                  <label className="text-xs font-bold text-[#5A5A40] block mb-1">Display Name</label>
                  <input
                    type="text"
                    required
                    value={editDisplayName}
                    onChange={e => setEditDisplayName(e.target.value)}
                    className="w-full bg-white border border-[#EAE7DE] focus:border-[#C05E42] rounded-xl p-2.5 text-xs text-[#1A1A1A] focus:outline-none focus:ring-0"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#5A5A40] block mb-1">Bio Description</label>
                  <textarea
                    rows={2}
                    value={editBio}
                    onChange={e => setEditBio(e.target.value)}
                    className="w-full bg-white border border-[#EAE7DE] focus:border-[#C05E42] rounded-xl p-2.5 text-xs text-[#1A1A1A] focus:outline-none focus:ring-0 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-[#C05E42] hover:bg-[#A94A2F] text-white font-bold p-2.5 py-3 px-5 rounded-full text-xs flex items-center gap-1.5 uppercase tracking-wider shadow-sm transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save Changes
                </button>
              </form>
            ) : (
              <p className="text-gray-650 text-sm leading-relaxed max-w-2xl italic font-medium">
                "{targetUser.bio || 'Happy reader, logs achievements on NaijaReads!'}"
              </p>
            )}

            {/* Favorite Genre tags */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs py-2 border-t border-[#F0EFE9] text-gray-500">
              <span className="text-[#5A5A40] font-bold uppercase tracking-wider text-[10px] mr-1">Favorite Genres:</span>
              {targetUser.favoriteGenres && targetUser.favoriteGenres.length > 0 ? (
                targetUser.favoriteGenres.map((g, idx) => (
                  <span key={idx} className="bg-[#F5F2ED] text-[#5A5A40] text-[11px] font-semibold px-2.5 py-1 rounded-md border border-[#EAE7DE]">
                    {g}
                  </span>
                ))
              ) : (
                <span className="text-[#5A5A40] italic text-[11px]">Unset</span>
              )}
            </div>

            {/* Joining Logs */}
            <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#5A5A40]" />
              <span>Joined NaijaReads: {new Date(targetUser.joinedDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>

          </div>
        </div>
      </section>

      {/* Grid: Badges container + Shelving books tab views */}
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column: Badges Rack (1 col) */}
        <div className="space-y-4">
          <h2 className="text-lg font-serif italic font-bold text-[#1A1A1A] flex items-center gap-2 border-b border-[#EAE7DE] pb-3">
            <Award className="text-[#C05E42] w-5 h-5 animate-pulse" />
            Earned Badges ({badges.length})
          </h2>

          {badges.length === 0 ? (
            <div className="p-6 bg-white border border-[#EAE7DE] rounded-2xl text-center text-[#5A5A40] text-xs shadow-sm">
              This reader hasn't unlocked any community achievements yet. Keep tracking to claim medals!
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3.5">
              {badges.map(badge => (
                <div
                  key={badge.id}
                  className="bg-white border border-[#EAE7DE] p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-1.5 hover:border-[#C05E42]/40 transition-all group shadow-sm"
                  title={`${badge.name}: ${badge.description}`}
                >
                  <span className="text-3xl filter drop-shadow hover:scale-110 transition-transform cursor-default">
                    {badge.icon}
                  </span>
                  <span className="text-[10px] font-bold text-[#1A1A1A] tracking-tight line-clamp-1 group-hover:text-[#C05E42]">
                    {badge.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Columns: Tab shelves (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Tab lists buttons rendered in sandy rounded rail */}
          <div className="flex flex-wrap gap-2 p-1 bg-[#F5F2ED] border border-[#EAE7DE] rounded-2xl w-fit shadow-inner">
            <button
              onClick={() => setActiveTab('currently_reading')}
              className={`text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'currently_reading'
                  ? 'bg-[#C05E42] text-white shadow-sm'
                  : 'text-[#5A5A40] hover:text-[#1A1A1A]'
              }`}
            >
              📖 Reading Shelf ({shelves.currently_reading?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('read')}
              className={`text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'read'
                  ? 'bg-[#C05E42] text-white shadow-sm'
                  : 'text-[#5A5A40] hover:text-[#1A1A1A]'
              }`}
            >
              ✓ Finished ({shelves.read?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('want_to_read')}
              className={`text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'want_to_read'
                  ? 'bg-[#C05E42] text-white shadow-sm'
                  : 'text-[#5A5A40] hover:text-[#1A1A1A]'
              }`}
            >
              ⭐ Wishlist ({shelves.want_to_read?.length || 0})
            </button>
          </div>

          {/* Active items shelf lists */}
          {activeShelfList.length === 0 ? (
            <div className="text-center py-16 bg-white border border-[#EAE7DE] rounded-3xl text-[#5A5A40] text-xs shadow-sm">
              No list items logged under this shelf.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeShelfList.map(record => {
                if (!record.book) return null;
                const percentInt = record.totalPages > 0 ? Math.round((record.currentPage / record.totalPages) * 100) : 0;
                return (
                  <div key={record.id} className="bg-white border border-[#EAE7DE] rounded-3xl p-4 flex gap-4 hover:border-[#C05E42]/30 transition-all shadow-sm">
                    
                    {/* Tiny cover image */}
                    <img
                      src={record.book.coverUrl}
                      alt={record.book.title}
                      referrerPolicy="no-referrer"
                      className="w-16 h-22 rounded-xl object-cover shrink-0 bg-[#F5F2ED] border border-[#EAE7DE] shadow-inner"
                    />

                    {/* Book statistics details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="text-left">
                        <Link to={`/books/${record.bookId}`} className="text-[#1A1A1A] hover:text-[#C05E42] font-bold text-sm line-clamp-1 transition-colors">
                          {record.book.title}
                        </Link>
                        <p className="text-gray-400 text-xs mt-0.5 font-medium line-clamp-1">By {record.book.author}</p>
                      </div>

                      {/* Display page number metrics info if matching 'currently_reading' or general status */}
                      <div className="space-y-1.5 pt-2">
                        <div className="flex items-center justify-between text-[10px] text-[#5A5A40] font-bold">
                          <span>PROGRESS: {percentInt}%</span>
                          <span>{record.currentPage} / {record.totalPages} pages</span>
                        </div>
                        <div className="h-1.5 bg-[#F5F2ED] rounded-full overflow-hidden border border-[#EAE7DE]">
                          <div className="bg-[#C05E42] h-full rounded-full" style={{ width: `${percentInt}%` }} />
                        </div>
                        {record.notes && (
                          <p className="text-[10px] text-[#5A5A40] italic line-clamp-1 mt-1">"{record.notes}"</p>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </section>

      {/* User reviews archive feeds */}
      <section className="space-y-6">
        <h2 className="text-lg font-serif italic font-bold text-[#1A1A1A] border-b border-[#EAE7DE] pb-3 flex items-center gap-1.5">
          <AlignLeft className="w-5 h-5 text-[#C05E42]" />
          Review Archive ({reviews.length})
        </h2>

        {reviews.length === 0 ? (
          <p className="text-[#5A5A40] text-xs py-8 text-center bg-white border border-[#EAE7DE] rounded-3xl shadow-sm">No written reviews archived under this user.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map(rev => {
              if (!rev.book) return null;
              return (
                <div key={rev.id} className="bg-white border border-[#EAE7DE] p-5 rounded-3xl space-y-3 relative text-left shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <Link to={`/books/${rev.bookId}`} className="text-[#1A1A1A] hover:text-[#C05E42] text-sm font-bold block line-clamp-1 transition-colors">
                        {rev.book.title}
                      </Link>
                      <span className="text-[10px] text-gray-400">By {rev.book.author}</span>
                    </div>

                    <div className="flex items-center text-amber-500">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" strokeWidth={1} />
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#F5F2ED] p-4 rounded-2xl border border-[#EAE7DE] mt-1 space-y-1.5">
                    <strong className="text-[#1A1A1A] text-xs block truncate font-serif italic">"{rev.title}"</strong>
                    <p className="text-gray-700 text-[11px] leading-relaxed line-clamp-3 whitespace-pre-line font-sans">{rev.body}</p>
                  </div>

                  <span className="text-[10px] text-gray-400 font-bold block pt-1 uppercase tracking-widest">
                    Logged: {new Date(rev.createdAt).toLocaleDateString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
