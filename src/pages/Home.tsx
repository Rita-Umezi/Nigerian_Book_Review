import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { api } from '../services/api.ts';
import { Book, Activity } from '../types.ts';
import BookCard from '../components/BookCard.tsx';
import { Sparkles, ArrowRight, Star, Heart, TrendingUp, Users, Flame, BookMarked, Quote } from 'lucide-react';

const FEATURED_AUTHORS = [
  { name: 'Chinua Achebe', role: 'Grandfather of African Lit', books: 'Things Fall Apart, Arrow of God', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150' },
  { name: 'Chimamanda Adichie', role: 'Contemporary Voice', books: 'Half of a Yellow Sun, Americanah', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150' },
  { name: 'Wole Soyinka', role: 'Nobel Laureate in Literature', books: 'Death and the King\'s Horseman', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150' },
  { name: 'Buchi Emecheta', role: 'Feminist Pioneer', books: 'The Joys of Motherhood, Second Class Citizen', img: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?auto=format&fit=crop&q=80&w=150' }
];

const TOP_CATEGORIES = [
  { name: 'African Literature', count: 4, desc: 'Rich cultural narratives' },
  { name: 'Historical Fiction', count: 2, desc: 'Revisiting Nigeria’s past' },
  { name: 'Comedy', count: 2, desc: 'Farcical & dry humor accounts' },
  { name: 'Romance / Drama', count: 2, desc: 'Deep romantic relationships' },
  { name: 'Fantasy', count: 1, desc: 'Magic & local folklore worlds' },
  { name: 'Drama / Poetry', count: 1, desc: 'Performance art & verse' }
];

export default function Home() {
  const navigate = useNavigate();
  const [trending, setTrending] = useState<Book[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const books = await api.books.list({});
        // Sort by average rating and review count
        setTrending(books.slice(0, 3));
        
        const acts = await api.activities.list();
        setActivities(acts.slice(0, 5));
      } catch (err) {
        console.error('Error loading home data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHomeData();
  }, []);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section styled with Natural Tones sand & clay details */}
      <section className="relative overflow-hidden py-20 px-8 bg-[#EAE7DE] border border-[#DCD9CE] rounded-[32px] mt-6 max-w-7xl mx-auto">
        {/* Background clay circles from Design HTML */}
        <div className="absolute right-[-40px] bottom-[-40px] w-72 h-72 bg-[#C05E42] rounded-full opacity-10 mix-blend-multiply" />
        <div className="absolute top-[-40px] left-[10%] w-72 h-72 bg-[#5A5A40] rounded-full opacity-5 mix-blend-multiply" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white border border-[#EAE7DE] rounded-full text-[#C05E42] text-[10px] font-bold uppercase tracking-[0.2em] shadow-sm animate-fade-in"
          >
            <Sparkles className="w-3 h-3 text-[#C05E42]" />
            Discover African Literature
          </motion.span>
          
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-serif italic text-[#1A1A1A] tracking-tight leading-[1.15]"
          >
            Where Nigerian Stories <br />
            <span className="text-[#C05E42]">Meet Their Passionate Readers</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-[#5A5A40] text-sm sm:text-base max-w-2xl mx-auto font-medium leading-relaxed"
          >
            Join NaijaReads to explore, review, and organize books that capture the spirit, humor, and depth of modern and classic African voices.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center pt-4"
          >
            <button
              onClick={() => navigate('/books')}
              className="px-6 py-3 bg-[#1A1A1A] text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#C05E42] shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <BookMarked className="w-4 h-4" />
              Browse Collections
            </button>
            <button
              onClick={() => navigate('/recommendations')}
              className="px-6 py-3 bg-white border border-[#EAE7DE] text-[#5A5A40] rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#F5F2ED] shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#C05E42]" />
              AI curator Advisor
            </button>
          </motion.div>
        </div>
      </section>

      {/* Grid: Trending + Community feed */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Trending books */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-serif italic text-[#1A1A1A] flex items-center gap-2.5">
              <TrendingUp className="text-[#C05E42] w-5 h-5" />
              Top Books on NaijaReads
            </h2>
            <Link to="/books" className="text-xs font-bold text-[#C05E42] border-b border-[#C05E42]/30 pb-1 uppercase tracking-widest hover:text-[#A94A2F]">
              Explore all
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map(n => (
                <div key={n} className="bg-white border border-[#EAE7DE] h-80 rounded-2xl animate-pulse shadow-sm" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {trending.map(book => (
                <div key={book.id}>
                  <BookCard book={book} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Column: Activity Feed */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-serif italic text-[#1A1A1A] flex items-center gap-2.5">
              <Users className="text-[#C05E42] w-5 h-5" />
              Community Feed
            </h2>
            <p className="text-[#5A5A40]/70 text-xs mt-1">Live updates from readers across Naija</p>
          </div>

          <div className="bg-white border border-[#EAE7DE] rounded-2xl p-5 space-y-4 max-h-[420px] overflow-y-auto shadow-sm">
            {activities.length === 0 ? (
              <p className="text-[#5A5A40]/60 text-xs text-center py-8">No community updates yet.</p>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="flex gap-3 text-xs text-gray-700 pb-3.5 border-b border-[#F0EFE9] last:border-0 last:pb-0">
                  <img
                    src={act.userAvatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&h=100'}
                    alt={act.username}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full object-cover bg-[#F5F2ED]"
                  />
                  <div className="flex-1 space-y-1">
                    <div>
                      <span className="font-bold text-[#1A1A1A] hover:text-[#C05E42] transition-colors cursor-pointer mr-1">
                        {act.userDisplayName}
                      </span>
                      <span className="text-gray-400 font-medium">@{act.username}</span>
                    </div>
                    <p className="text-gray-600 leading-relaxed font-sans">
                      {act.details}
                      {act.bookTitle && (
                        <Link to={`/books/${act.bookId}`} className="text-[#C05E42] font-semibold hover:underline block mt-0.5">
                          {act.bookTitle}
                        </Link>
                      )}
                    </p>
                    <span className="text-[10px] text-gray-400 block font-normal">
                      {new Date(act.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Top Categories */}
      <section className="bg-[#F5F2ED] border-y border-[#EAE7DE] py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-3xl font-serif italic text-[#1A1A1A]">Literature Shelves</h2>
            <p className="text-[#5A5A40]/80 text-sm">Follow genres and discover targeted books matching your reading profile</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {TOP_CATEGORIES.map((cat, idx) => (
              <div
                key={idx}
                onClick={() => navigate(`/books?genre=${encodeURIComponent(cat.name)}`)}
                className="bg-white hover:bg-[#FDFCF8] border border-[#EAE7DE] hover:border-[#C05E42]/50 p-5 rounded-2xl cursor-pointer transition-all hover:shadow-md group text-center"
              >
                <div className="bg-[#F5F2ED] w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#EAE7DE] group-hover:bg-[#C05E42] group-hover:border-[#C05E42] transition-all">
                  <Star className="w-4 h-4 text-[#C05E42] group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-[#1A1A1A] font-bold text-xs tracking-tight group-hover:text-[#C05E42] transition-colors truncate">
                  {cat.name}
                </h3>
                <p className="text-[#5A5A40]/60 text-[10px] mt-1 line-clamp-1">{cat.desc}</p>
                <span className="text-[10px] font-bold text-[#C05E42] mt-2 inline-block">
                  {cat.count} {cat.count === 1 ? 'Book' : 'Books'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Authors Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <h2 className="text-2xl font-serif italic text-[#1A1A1A]">Popular Authors</h2>
          <p className="text-[#5A5A40]/80 text-sm">Iconic storytellers charting African history and modernity</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURED_AUTHORS.map((author, idx) => (
            <div
              key={idx}
              onClick={() => navigate(`/books?search=${encodeURIComponent(author.name)}`)}
              className="bg-white border border-[#EAE7DE] rounded-2xl p-5 flex items-center gap-4 hover:border-[#C05E42]/30 hover:shadow-md cursor-pointer transition-all"
            >
              <img
                src={author.img}
                alt={author.name}
                className="w-14 h-14 rounded-full object-cover border border-[#EAE7DE] shrink-0 shadow-sm"
              />
              <div className="text-left min-w-0">
                <h3 className="text-[#1A1A1A] font-bold text-sm truncate">{author.name}</h3>
                <p className="text-[#C05E42] text-[10px] uppercase tracking-wider font-semibold">{author.role}</p>
                <p className="text-gray-500 text-xs truncate mt-0.5">e.g. {author.books}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Gamification highlight quote from Design HTML Wole Soyinka reference */}
      <section className="max-w-4xl mx-auto px-4 text-center py-12">
        <div className="bg-[#F5F2ED] border border-[#EAE7DE] p-8 rounded-3xl space-y-4 shadow-sm relative overflow-hidden">
          <div className="absolute right-[-20px] bottom-[-20px] w-24 h-24 bg-[#C05E42]/5 rounded-full" />
          <Quote className="w-8 h-8 text-[#C05E42] mx-auto" strokeWidth={1.5} />
          <p className="text-[#1A1A1A] italic text-md leading-relaxed font-serif max-w-2xl mx-auto">
            "We must teach our children that writing is as much an act of freedom as reading."
          </p>
          <span className="text-[#5A5A40] text-[10px] font-bold block uppercase tracking-widest">
            — Wole Soyinka • NaijaReads 2026
          </span>
        </div>
      </section>
    </div>
  );
}
