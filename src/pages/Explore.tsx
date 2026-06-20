import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { Book } from '../types.ts';
import BookCard from '../components/BookCard.tsx';
import { Search, SlidersHorizontal, Plus, Star, Tag, X, FilePlus } from 'lucide-react';

const GENRES = [
  'All',
  'African Literature',
  'Historical Fiction',
  'Comedy / Thriller',
  'Romance / Drama',
  'Fantasy',
  'Fiction / Surrealist',
  'Comedy',
  'Drama / Poetry'
];

export default function Explore() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // States
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(searchParams.get('search') || '');
  const [selectedGenre, setSelectedGenre] = useState(searchParams.get('genre') || 'All');
  const [sortBy, setSortBy] = useState<'highest_rated' | 'most_reviewed' | 'popular' | 'recently_added'>('popular');
  
  // Admin form modal states
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminTitle, setAdminTitle] = useState('');
  const [adminAuthor, setAdminAuthor] = useState('');
  const [adminDesc, setAdminDesc] = useState('');
  const [adminPublisher, setAdminPublisher] = useState('');
  const [adminYear, setAdminYear] = useState('');
  const [adminSelectedGenre, setAdminSelectedGenre] = useState('African Literature');
  const [adminIsbn, setAdminIsbn] = useState('');
  const [adminTimeEst, setAdminTimeEst] = useState('');
  const [adminBadges, setAdminBadges] = useState<string[]>([]);
  const [adminCoverUrl, setAdminCoverUrl] = useState('');
  const [adminBadgeInput, setAdminBadgeInput] = useState('');
  
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  // Sync Search URL parameters
  useEffect(() => {
    const searchUrl = searchParams.get('search') || '';
    const genreUrl = searchParams.get('genre') || 'All';
    setQuery(searchUrl);
    setSelectedGenre(genreUrl);
  }, [searchParams]);

  // Load books on state updates
  const fetchLocalBooks = async () => {
    setLoading(true);
    try {
      const data = await api.books.list({
        query: query,
        genre: selectedGenre,
        sortBy: sortBy,
      });
      setBooks(data);
    } catch (err) {
      console.error('Error fetching filtered books:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocalBooks();
  }, [query, selectedGenre, sortBy]);

  const updateSearchFilters = (newQuery: string, newGenre: string) => {
    const params: Record<string, string> = {};
    if (newQuery) params.search = newQuery;
    if (newGenre && newGenre !== 'All') params.genre = newGenre;
    setSearchParams(params);
  };

  const handleAdminAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    setAdminSuccess('');
    setAdminLoading(true);

    try {
      await api.books.adminAdd({
        title: adminTitle,
        author: adminAuthor,
        description: adminDesc,
        publisher: adminPublisher,
        publishYear: adminYear,
        genre: adminSelectedGenre,
        isbn: adminIsbn,
        readingTimeEst: adminTimeEst,
        categoryBadges: adminBadges,
        coverUrl: adminCoverUrl
      });
      
      setAdminSuccess('Book added successfully to NaijaReads library!');
      fetchLocalBooks(); // reload
      
      // Reset form
      setAdminTitle('');
      setAdminAuthor('');
      setAdminDesc('');
      setAdminPublisher('');
      setAdminYear('');
      setAdminIsbn('');
      setAdminTimeEst('');
      setAdminCoverUrl('');
      setAdminBadges([]);
      
      setTimeout(() => {
        setIsAdminOpen(false);
        setAdminSuccess('');
      }, 1000);
    } catch (err: any) {
      setAdminError(err.message || 'Failed to register the book.');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleAddBadgeInput = () => {
    if (adminBadgeInput.trim() && !adminBadges.includes(adminBadgeInput.trim())) {
      setAdminBadges([...adminBadges, adminBadgeInput.trim()]);
      setAdminBadgeInput('');
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-6">
        <div>
          <h1 className="text-3xl font-serif italic text-[#1A1A1A] tracking-tight">Explore the Library</h1>
          <p className="text-[#5A5A40] text-sm mt-1">Discover, filter, and track contemporary and classical Nigerian literature.</p>
        </div>

        {/* Admin triggering action */}
        {user?.username === 'achi_reads' && (
          <button
            onClick={() => setIsAdminOpen(true)}
            className="bg-[#C05E42] hover:bg-[#A94A2F] text-white font-bold text-xs uppercase tracking-widest px-5 py-3 rounded-full flex items-center gap-2 shadow-sm transition-all cursor-pointer self-start md:self-auto"
            id="admin-add-book-trigger"
          >
            <Plus className="w-4 h-4" />
            Admin: Import New Book
          </button>
        )}
      </div>

      {/* Filter toolbar */}
      <div className="bg-[#F5F2ED] border border-[#EAE7DE] rounded-3xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-5 text-[#5A5A40]" />
            <input
              type="text"
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                updateSearchFilters(e.target.value, selectedGenre);
              }}
              placeholder="Search by book title, author, isbn, publisher or topics..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-[#EAE7DE] focus:border-[#C05E42] focus:ring-1 focus:ring-[#C05E42] rounded-2xl focus:outline-none text-sm text-[#1A1A1A] placeholder:text-[#5A5A40]/40 transition-colors shadow-sm"
              id="search-input-field"
            />
          </div>

          {/* Sort selection */}
          <div className="flex items-center gap-2.5 bg-white border border-[#EAE7DE] px-4 py-3 rounded-2xl shadow-sm">
            <SlidersHorizontal className="w-4 h-4 text-[#5A5A40] shrink-0" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-transparent text-sm font-semibold text-[#5A5A40] hover:text-[#C05E42] focus:outline-none cursor-pointer"
            >
              <option value="popular">Popularity Score</option>
              <option value="highest_rated">Highest Rated</option>
              <option value="most_reviewed">Most Reviewed</option>
              <option value="recently_added">Recently Imported</option>
            </select>
          </div>
        </div>

        {/* Genre filtering chips */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-[#5A5A40] text-xs font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
            <Tag className="w-3 h-3 text-[#C05E42]" />
            Genres:
          </span>
          <div className="flex gap-2">
            {GENRES.map(genre => {
              const isSel = selectedGenre === genre;
              return (
                <button
                  key={genre}
                  onClick={() => {
                    setSelectedGenre(genre);
                    updateSearchFilters(query, genre);
                  }}
                  className={`text-xs px-4 py-2 font-bold rounded-xl transition-all whitespace-nowrap border cursor-pointer ${
                    isSel
                      ? 'bg-[#C05E42] text-white border-[#C05E42] shadow-sm'
                      : 'bg-white hover:bg-[#FDFCF8] text-[#5A5A40] border-[#EAE7DE] shadow-sm'
                  }`}
                  id={`genre-chip-${genre.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  {genre}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid container */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="bg-white border border-[#EAE7DE] h-96 rounded-2xl animate-pulse shadow-sm" />
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-20 bg-white border border-[#EAE7DE] rounded-3xl space-y-3 shadow-sm">
          <SlidersHorizontal className="w-12 h-12 text-[#5A5A40]/30 mx-auto" />
          <h3 className="text-lg font-serif italic font-bold text-[#1A1A1A]">No matching books found</h3>
          <p className="text-[#5A5A40]/70 text-sm max-w-sm mx-auto">Try clarifying your spelling, adjusting the query keyword filters, or choosing a different genre shelf.</p>
          <button
            onClick={() => {
              setQuery('');
              setSelectedGenre('All');
              updateSearchFilters('', 'All');
            }}
            className="text-xs text-[#C05E42] font-bold hover:underline uppercase tracking-wider"
          >
            Clear current filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {books.map(book => (
            <div key={book.id}>
              <BookCard book={book} />
            </div>
          ))}
        </div>
      )}

      {/* ==========================================
          ADMIN REGISTER BOOK MODAL
          ========================================== */}
      {isAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAdminOpen(false)} />
          
          <div
            className="relative bg-white border border-[#EAE7DE] rounded-[32px] p-8 shadow-2xl max-w-xl w-full text-[#1A1A1A] z-10 max-h-[90vh] overflow-y-auto"
            id="admin-add-book-modal"
          >
            <button
              onClick={() => setIsAdminOpen(false)}
              className="absolute top-6 right-6 text-[#5A5A40]/70 p-1.5 hover:text-[#C05E42] bg-[#F5F2ED] rounded-full border border-[#EAE7DE]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <FilePlus className="w-5 h-5 text-[#C05E42]" />
              <h2 className="text-xl font-serif italic font-bold text-[#1A1A1A]">Import Book into Library</h2>
            </div>

            <p className="text-gray-500 text-xs mb-4">
              Authorized admin addition. Authenticated as <span className="text-[#C05E42] font-bold">@{user?.username}</span>
            </p>

            {adminError && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl mb-4">{adminError}</div>}
            {adminSuccess && <div className="p-3 bg-[#F5F2ED] border border-[#EAE7DE] text-[#C05E42] text-xs rounded-xl mb-4">{adminSuccess}</div>}

            <form onSubmit={handleAdminAddBook} className="space-y-4 text-left">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#5A5A40] block mb-1">Book Title</label>
                  <input
                    type="text"
                    required
                    value={adminTitle}
                    onChange={e => setAdminTitle(e.target.value)}
                    placeholder="e.g. Efuru"
                    className="w-full bg-[#F5F2ED] border border-[#EAE7DE] focus:border-[#C05E42] rounded-xl p-2.5 text-xs text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#5A5A40] block mb-1">Author Name</label>
                  <input
                    type="text"
                    required
                    value={adminAuthor}
                    onChange={e => setAdminAuthor(e.target.value)}
                    placeholder="e.g. Flora Nwapa"
                    className="w-full bg-[#F5F2ED] border border-[#EAE7DE] focus:border-[#C05E42] rounded-xl p-2.5 text-xs text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#5A5A40] block mb-1">Book Description</label>
                <textarea
                  required
                  rows={3}
                  value={adminDesc}
                  onChange={e => setAdminDesc(e.target.value)}
                  placeholder="Insert book outline, thematic settings or plot summaries..."
                  className="w-full bg-[#F5F2ED] border border-[#EAE7DE] focus:border-[#C05E42] rounded-xl p-2.5 text-xs text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#5A5A40] block mb-1">Publisher</label>
                  <input
                    type="text"
                    required
                    value={adminPublisher}
                    onChange={e => setAdminPublisher(e.target.value)}
                    placeholder="Heinemann"
                    className="w-full bg-[#F5F2ED] border border-[#EAE7DE] focus:border-[#C05E42] rounded-xl p-2.5 text-xs text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#5A5A40] block mb-1">Publish Year</label>
                  <input
                    type="number"
                    required
                    value={adminYear}
                    onChange={e => setAdminYear(e.target.value)}
                    placeholder="1966"
                    className="w-full bg-[#F5F2ED] border border-[#EAE7DE] focus:border-[#C05E42] rounded-xl p-2.5 text-xs text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#5A5A40] block mb-1">Est. Reading (Min)</label>
                  <input
                    type="number"
                    required
                    value={adminTimeEst}
                    onChange={e => setAdminTimeEst(e.target.value)}
                    placeholder="220"
                    className="w-full bg-[#F5F2ED] border border-[#EAE7DE] focus:border-[#C05E42] rounded-xl p-2.5 text-xs text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#5A5A40] block mb-1">Genre</label>
                  <select
                    value={adminSelectedGenre}
                    onChange={e => setAdminSelectedGenre(e.target.value)}
                    className="w-full bg-[#F5F2ED] border border-[#EAE7DE] focus:border-[#C05E42] rounded-xl p-2.5 text-xs text-[#5A5A40] focus:outline-none"
                  >
                    {GENRES.filter(g => g !== 'All').map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#5A5A40] block mb-1">ISBN Code</label>
                  <input
                    type="text"
                    required
                    value={adminIsbn}
                    onChange={e => setAdminIsbn(e.target.value)}
                    placeholder="9780385474..."
                    className="w-full bg-[#F5F2ED] border border-[#EAE7DE] focus:border-[#C05E42] rounded-xl p-2.5 text-xs text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#5A5A40] block mb-1">Book Cover URL</label>
                <input
                  type="url"
                  value={adminCoverUrl}
                  onChange={e => setAdminCoverUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full bg-[#F5F2ED] border border-[#EAE7DE] focus:border-[#C05E42] rounded-xl p-2.5 text-xs text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#5A5A40] block mb-1">Add Library Hot Badges</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={adminBadgeInput}
                    onChange={e => setAdminBadgeInput(e.target.value)}
                    placeholder="e.g. 🏆 Top 50 Nigerian Fiction"
                    className="flex-1 bg-[#F5F2ED] border border-[#EAE7DE] focus:border-[#C05E42] rounded-xl p-2 text-xs text-[#1A1A1A] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddBadgeInput}
                    className="bg-[#F5F2ED] hover:bg-[#EAE7DE] text-[#5A5A40] text-xs font-bold px-4 rounded-xl border border-[#EAE7DE]"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {adminBadges.map((badge, idx) => (
                    <span key={idx} className="bg-[#C05E42] text-white text-[9px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                      {badge}
                      <X className="w-3 h-3 cursor-pointer hover:opacity-80" onClick={() => setAdminBadges(adminBadges.filter(b => b !== badge))} />
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={adminLoading}
                className="w-full bg-[#C05E42] hover:bg-[#A94A2F] text-white font-bold text-xs uppercase tracking-widest py-3.5 rounded-full transition-all mt-4 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {adminLoading ? 'Structuring & Registering...' : 'Register Book Asset'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
