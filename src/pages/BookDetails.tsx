import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { Book, Review, ReviewComment } from '../types.ts';
import { Star, Eye, EyeOff, ThumbsUp, MessageSquare, BookOpen, Clock, Calendar, Hash, Milestone, FileText, Send, Sparkles } from 'lucide-react';

export default function BookDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // User reading shelf progress states
  const [readingStatus, setReadingStatus] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(200);
  const [readingNotes, setReadingNotes] = useState<string>('');
  const [showProgressForm, setShowProgressForm] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');

  // Sibling review form states
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewBody, setReviewBody] = useState('');
  const [reviewSpoiler, setReviewSpoiler] = useState(false);
  const [reviewQuote, setReviewQuote] = useState('');
  const [reviewMsg, setReviewMsg] = useState('');
  const [reviewFormLoading, setReviewFormLoading] = useState(false);

  // Spoilers revealed tracker (set of reviewIds)
  const [revealedSpoilers, setRevealedSpoilers] = useState<Set<string>>(new Set());

  // Review Comment inputs (key: reviewId, value: commentText)
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const loadBookData = async () => {
    if (!id) return;
    try {
      const data = await api.books.get(id);
      setBook(data.book);
      setReviews(data.reviews);
      setTotalPages(data.book.readingTimeEst || 200);

      // Check current user's reading status if logged in
      if (user) {
        const uStatus = await api.books.getUserBookStatus(id);
        if (uStatus && uStatus.status) {
          setReadingStatus(uStatus.status);
          if (uStatus.detail) {
            setCurrentPage(uStatus.detail.currentPage || 0);
            setTotalPages(uStatus.detail.totalPages || data.book.readingTimeEst || 200);
            setReadingNotes(uStatus.detail.notes || '');
          }
        }
      }
    } catch (err) {
      console.error(err);
      setError('Unable to locate this literary work. Please reload the dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookData();
  }, [id, user]);

  const handleUpdateStatus = async (status: string) => {
    if (!user) {
      alert('Please log in or sign up to shelf this book!');
      return;
    }
    setProgressMsg('');
    try {
      await api.books.setStatus(book!.id, {
        status,
        currentPage: status === 'read' ? totalPages : currentPage,
        totalPages,
        notes: readingNotes
      });
      setReadingStatus(status);
      if (status === 'read') {
        setCurrentPage(totalPages);
      }
      setProgressMsg('Library shelf updated successfully!');
      setTimeout(() => setProgressMsg(''), 2000);
      loadBookData(); // reload stats
    } catch (err: any) {
      alert(err.message || 'Failed to update progress status');
    }
  };

  const handleSavePageProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProgressMsg('');
    try {
      const payload: any = {
        status: readingStatus || 'currently_reading',
        currentPage,
        totalPages,
        notes: readingNotes
      };
      if (currentPage >= totalPages) {
        payload.status = 'read';
        setReadingStatus('read');
      }
      await api.books.setStatus(book!.id, payload);
      setProgressMsg('Pages logged successfully!');
      setTimeout(() => setProgressMsg(''), 2000);
      loadBookData();
    } catch (err: any) {
      alert(err.message || 'Error updating progress metrics');
    }
  };

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setReviewMsg('');
    setReviewFormLoading(true);

    try {
      await api.reviews.add({
        bookId: book!.id,
        rating: reviewRating,
        title: reviewTitle,
        body: reviewBody,
        isSpoiler: reviewSpoiler,
        favoriteQuote: reviewQuote
      });
      setReviewMsg('Your review is now public!');
      setReviewTitle('');
      setReviewBody('');
      setReviewSpoiler(false);
      setReviewQuote('');
      loadBookData(); // refresh list
    } catch (err: any) {
      setReviewMsg(`Error: ${err.message}`);
    } finally {
      setReviewFormLoading(false);
    }
  };

  const handleLikeReview = async (reviewId: string) => {
    if (!user) {
      alert('Sign in to leave a supportive like!');
      return;
    }
    try {
      await api.reviews.toggleLike(reviewId);
      loadBookData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (reviewId: string) => {
    if (!user) {
      alert('Sign in to comment!');
      return;
    }
    const text = commentInputs[reviewId];
    if (!text || text.trim() === '') return;

    try {
      await api.reviews.comment(reviewId, text);
      setCommentInputs(prev => ({ ...prev, [reviewId]: '' }));
      loadBookData();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSpoiler = (reviewId: string) => {
    setRevealedSpoilers(prev => {
      const copy = new Set(prev);
      if (copy.has(reviewId)) copy.delete(reviewId);
      else copy.add(reviewId);
      return copy;
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#C05E42] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[#5A5A40] text-sm font-medium">Gathering literary reviews and book metadata...</p>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-[#1A1A1A] space-y-4">
        <p className="font-serif italic font-bold text-lg">{error || 'Unable to locate this literary work.'}</p>
        <Link to="/books" className="text-[#C05E42] mt-4 block font-bold hover:underline">
          Return to Explore Library
        </Link>
      </div>
    );
  }

  // Calculate Breakdown percentages
  const ratingSum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const totalReviews = reviews.length;
  const ratingDistribution = [0, 0, 0, 0, 0]; // Index 0 is 1 star, 4 is 5 stars
  reviews.forEach(r => {
    if (r.rating >= 1 && r.rating <= 5) {
      ratingDistribution[r.rating - 1]++;
    }
  });

  return (
    <div className="pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 text-left" id={`book-page-${book.id}`}>
      {/* Upper Book Header Card Grid */}
      <section className="bg-white border border-[#EAE7DE] rounded-[32px] p-6 md:p-8 mt-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Cover image Column */}
          <div className="space-y-4">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-[#F5F2ED] border border-[#EAE7DE] shadow-sm">
              <img
                src={book.coverUrl}
                alt={book.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Badges rack */}
            <div className="flex flex-wrap gap-1.5 justify-center">
              {book.categoryBadges?.map((b, idx) => (
                <span
                  key={idx}
                  className="bg-[#C05E42] text-white text-[9px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shadow-sm"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Book core metadata Column */}
          <div className="md:col-span-3 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <span className="text-xs uppercase tracking-widest text-[#C05E42] font-bold block mb-1">
                  {book.genre}
                </span>
                <h1 className="text-3xl md:text-4xl font-serif italic font-bold text-[#1A1A1A] leading-tight">
                  {book.title}
                </h1>
                <p className="text-gray-600 text-lg md:text-xl font-medium mt-1">
                  By <span className="text-[#1A1A1A] font-bold hover:text-[#C05E42] cursor-pointer transition-colors">{book.author}</span>
                </p>
              </div>

              {/* Dynamic Rating metrics */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 py-2 border-y border-[#EAE7DE]">
                <div className="flex items-center text-amber-500 gap-1.5">
                  <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                  <span className="text-[#1A1A1A] font-bold text-lg">{book.ratingAverage || 'Unrated'}</span>
                  <span className="text-gray-400">/ 5.0</span>
                </div>
                <span className="text-gray-300">|</span>
                <span className="font-medium">{book.reviewCount} Member {book.reviewCount === 1 ? 'review' : 'reviews'}</span>
                <span className="text-gray-300">|</span>
                <div className="flex items-center gap-1 font-medium">
                  <Clock className="w-4 h-4 text-[#5A5A40]" />
                  <span>~{book.readingTimeEst || 200} pages</span>
                </div>
              </div>

              {/* Description summary */}
              <div className="space-y-2">
                <h3 className="text-[#5A5A40] text-xs font-bold uppercase tracking-widest text-[10px]">Book Summary</h3>
                <p className="text-gray-700 text-sm leading-relaxed max-w-3xl">
                  {book.description}
                </p>
              </div>

              {/* Extended publisher lists */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs pt-4 border-t border-[#F0EFE9]">
                <div className="space-y-0.5">
                  <span className="text-[#5A5A40]/70 font-bold block">ISBN-13</span>
                  <span className="font-mono text-[#1A1A1A] font-medium">{book.isbn}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[#5A5A40]/70 font-bold block">Publisher</span>
                  <span className="text-[#1A1A1A] font-semibold">{book.publisher}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[#5A5A40]/70 font-bold block">Publish Year</span>
                  <span className="text-[#1A1A1A] font-semibold">{book.publishYear}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[#5A5A40]/70 font-bold block">Language</span>
                  <span className="text-[#1A1A1A] font-semibold">English / Dialects</span>
                </div>
              </div>
            </div>

            {/* Shelf & Reading state button grids */}
            <div className="bg-[#F5F2ED] border border-[#EAE7DE] p-5 rounded-[24px] relative space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#5A5A40] block">Personal Shelf Status</span>
                  <h4 className="text-sm font-bold text-[#1A1A1A]">
                    {readingStatus === 'read' && '✓ Read & Completed'}
                    {readingStatus === 'currently_reading' && '📖 Currently Reading'}
                    {readingStatus === 'want_to_read' && '⭐ On Wishlist'}
                    {!readingStatus && 'Unshelved'}
                  </h4>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleUpdateStatus('want_to_read')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      readingStatus === 'want_to_read'
                        ? 'bg-[#C05E42] text-white border border-[#C05E42] shadow-sm'
                        : 'bg-white hover:bg-[#FDFCF8] border border-[#EAE7DE] text-[#5A5A40]'
                    }`}
                  >
                    Want to Read
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('currently_reading')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      readingStatus === 'currently_reading'
                        ? 'bg-[#5A5A40] text-white border border-[#5A5A40] shadow-sm'
                        : 'bg-white hover:bg-[#FDFCF8] border border-[#EAE7DE] text-[#5A5A40]'
                    }`}
                  >
                    Currently Reading
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('read')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      readingStatus === 'read'
                        ? 'bg-emerald-800 text-white border border-emerald-850 shadow-sm'
                        : 'bg-white hover:bg-[#FDFCF8] border border-[#EAE7DE] text-[#5A5A40]'
                    }`}
                  >
                    Mark as Read
                  </button>
                </div>
              </div>

              {progressMsg && (
                <p className="text-[#C05E42] font-semibold text-xs text-center border border-[#EAE7DE] p-2 bg-white rounded-xl shadow-sm">
                  {progressMsg}
                </p>
              )}

              {/* Progress dynamic input sliders for tracking */}
              {user && (readingStatus === 'currently_reading' || readingStatus === 'read' || showProgressForm) && (
                <div className="border-t border-[#EAE7DE] pt-4 mt-2">
                  <form onSubmit={handleSavePageProgress} className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                      <div className="flex-1 w-full space-y-1">
                        <div className="flex justify-between text-xs font-bold text-[#5A5A40]">
                          <span>Log pages read: <strong className="text-[#1A1A1A]">{currentPage}</strong></span>
                          <span>Total: {totalPages} pages</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={totalPages}
                          value={currentPage}
                          onChange={e => setCurrentPage(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-white border border-[#EAE7DE] rounded-full appearance-none cursor-pointer accent-[#C05E42]"
                        />
                      </div>

                      <div className="w-full sm:w-48">
                        <label className="text-[10px] text-[#5A5A40] uppercase tracking-wider font-bold block mb-1">Direct page input</label>
                        <div className="relative">
                          <Milestone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5A5A40]/70" />
                          <input
                            type="number"
                            min="0"
                            max={totalPages}
                            value={currentPage}
                            onChange={e => {
                              const v = parseInt(e.target.value) || 0;
                              setCurrentPage(v > totalPages ? totalPages : v);
                            }}
                            className="bg-white border border-[#EAE7DE] pl-8 pr-3 py-2 text-xs rounded-xl focus:outline-none w-full text-[#1A1A1A] font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-[#5A5A40] uppercase tracking-wider font-bold block mb-1">Private reading notes</label>
                      <input
                        type="text"
                        value={readingNotes}
                        onChange={e => setReadingNotes(e.target.value)}
                        placeholder="e.g. Really loving Achebe's characterizations at this chapter..."
                        className="bg-white border border-[#EAE7DE] px-3.5 py-2.5 text-xs rounded-xl focus:outline-none w-full text-[#1A1A1A] placeholder:text-gray-400"
                      />
                    </div>

                    <button
                      type="submit"
                      className="text-xs bg-[#1A1A1A] text-white hover:bg-[#C05E42] font-bold py-2.5 px-5 rounded-full transition-colors uppercase tracking-widest shadow-sm"
                    >
                      Save Reading Metrics
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* Grid: Ratings breakdown & Review form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Ratings Breakdown progress charts - 1 Column */}
        <div className="bg-white border border-[#EAE7DE] p-6 rounded-[32px] h-fit space-y-6 shadow-sm">
          <h3 className="font-serif italic font-bold text-[#5A5A40] text-lg border-b border-[#EAE7DE] pb-3">Ratings Summary</h3>
          
          <div className="flex items-center gap-4">
            <div className="text-center space-y-1 bg-[#F5F2ED] p-4 rounded-2xl border border-[#EAE7DE] shrink-0">
              <span className="text-[#1A1A1A] text-4xl font-serif italic font-bold">{book.ratingAverage || 'No'}</span>
              <p className="text-[10px] text-[#5A5A40] font-bold uppercase tracking-widest">Average</p>
            </div>
            <div className="text-xs text-gray-600">
              <p className="font-bold text-[#1A1A1A]">Community Voice</p>
              <p className="text-[#5A5A40]/80 mt-1">Calculated across {totalReviews} total rating entries on NaijaReads.</p>
            </div>
          </div>

          {/* Staggered progress breakdown bars */}
          <div className="space-y-2.5 text-xs text-[#5A5A40]">
            {ratingDistribution.map((cnt, index) => {
              const starNum = index + 1;
              const percent = totalReviews > 0 ? (cnt / totalReviews) * 100 : 0;
              return (
                <div key={index} className="flex items-center gap-3">
                  <span className="w-10 text-right font-bold text-gray-500">{starNum} Star</span>
                  <div className="flex-1 h-2 bg-[#F5F2ED] rounded-full overflow-hidden border border-[#EAE7DE]">
                    <div
                      className="bg-[#C05E42] h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="w-8 text-gray-400 text-left font-bold">{cnt}</span>
                </div>
              );
            }).reverse()}
          </div>
        </div>

        {/* Written Review Form - 2 Columns */}
        <div className="lg:col-span-2 bg-white border border-[#EAE7DE] p-6 rounded-[32px] h-fit space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#EAE7DE] pb-3">
            <h3 className="font-serif italic font-bold text-[#1A1A1A] text-lg">Writings & Editorial Logs</h3>
            <span className="text-xs text-[#C05E42] font-semibold flex items-center gap-1 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#C05E42]" />
              Express yourself
            </span>
          </div>

          {user ? (
            <form onSubmit={handleCreateReview} className="space-y-4">
              {reviewMsg && (
                <div className="p-3 bg-red-50 border border-red-150 text-red-700 text-xs rounded-xl flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C05E42] shrink-0" />
                  <span>{reviewMsg}</span>
                </div>
              )}

              {/* Star rating selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#5A5A40] block mb-1">Your rating: <strong className="text-[#C05E42]">{reviewRating} Stars</strong></label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          star <= reviewRating ? 'fill-amber-500 text-amber-500' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#5A5A40] block mb-1">Review Title</label>
                <input
                  type="text"
                  required
                  value={reviewTitle}
                  onChange={e => setReviewTitle(e.target.value)}
                  placeholder="e.g. An absolute masterpiece of Nigerian fiction!"
                  className="w-full bg-[#F5F2ED] border border-[#EAE7DE] focus:border-[#C05E42] rounded-xl p-3 text-xs text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#5A5A40] block mb-1">Detailed Review Body</label>
                <textarea
                  required
                  rows={4}
                  value={reviewBody}
                  onChange={e => setReviewBody(e.target.value)}
                  placeholder="Share details on your emotional response, favorite characters, lessons learned, and general themes..."
                  className="w-full bg-[#F5F2ED] border border-[#EAE7DE] focus:border-[#C05E42] rounded-xl p-3 text-xs text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Spoilers & Quotes toggle grids in form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#5A5A40] block mb-1">Favorite Quotations (Optional)</label>
                  <input
                     type="text"
                     value={reviewQuote}
                     onChange={e => setReviewQuote(e.target.value)}
                    placeholder="e.g. 'Things held us together...'"
                    className="w-full bg-[#F5F2ED] border border-[#EAE7DE] focus:border-[#C05E42] rounded-xl p-2.5 text-xs text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2.5 bg-[#F5F2ED] p-3 border border-[#EAE7DE] rounded-xl max-h-[44px] self-end shadow-sm">
                  <input
                    type="checkbox"
                    id="spoiler_warn_check"
                    checked={reviewSpoiler}
                    onChange={e => setReviewSpoiler(e.target.checked)}
                    className="w-4 h-4 accent-[#C05E42] rounded cursor-pointer"
                  />
                  <label htmlFor="spoiler_warn_check" className="text-xs font-bold text-[#5A5A40] select-none cursor-pointer">
                    Warn readers: Spoiler included
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={reviewFormLoading}
                className="bg-[#C05E42] hover:bg-[#A94A2F] text-white font-bold text-xs uppercase tracking-widest py-3 py-3.5 px-6 rounded-full shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                Log Review entry
              </button>
            </form>
          ) : (
            <div className="text-center py-10 bg-[#F5F2ED] border border-[#EAE7DE] rounded-2xl space-y-3 shadow-sm">
              <span className="w-10 h-10 bg-white border border-[#EAE7DE] rounded-full flex items-center justify-center mx-auto text-[#5A5A40] font-bold">?</span>
              <h4 className="text-sm font-bold text-[#1A1A1A]">Sign in to write reviews</h4>
              <p className="text-[#5A5A40]/75 text-xs max-w-xs mx-auto">Share your beautiful perspective and earn progress levels dynamically.</p>
            </div>
          )}
        </div>
      </div>

      {/* Community reviews shelf segment */}
      <section className="space-y-6">
        <h3 className="text-xl font-serif italic font-bold text-[#1A1A1A]">Community Reviews ({reviews.length})</h3>

        {reviews.length === 0 ? (
          <div className="text-center py-16 bg-white border border-[#EAE7DE] rounded-[32px] text-[#5A5A40]/70 text-sm shadow-sm">
            No reviews have been logged yet for {book.title}. Be the first reader to express thoughts!
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map(review => {
              const displaySpoiler = review.isSpoiler && !revealedSpoilers.has(review.id);
              return (
                <div key={review.id} className="bg-white border border-[#EAE7DE] p-6 rounded-[32px] space-y-4 shadow-sm">
                  {/* Reviewer line */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={review.userAvatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&h=100'}
                        alt={review.username}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-[#EAE7DE]"
                      />
                      <div>
                        <span className="text-xs text-[#1A1A1A] font-bold">{review.userDisplayName}</span>
                        <span className="text-[10px] text-gray-400 block font-medium">@{review.username}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <div className="flex items-center text-amber-500">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        ))}
                      </div>
                      <span className="text-[10px] text-gray-200 font-bold">•</span>
                      <span className="font-semibold">{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Spoiler banner warning */}
                  {review.isSpoiler && (
                    <button
                      onClick={() => toggleSpoiler(review.id)}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1.5 uppercase tracking-widest transition-all cursor-pointer ${
                        displaySpoiler
                          ? 'bg-red-50 text-red-650 border-red-200'
                          : 'bg-[#F5F2ED] text-[#5A5A40] border-[#EAE7DE]'
                      }`}
                    >
                      {displaySpoiler ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {displaySpoiler ? 'Book Spoilers contained. Reveal?' : 'Hide Spoilers'}
                    </button>
                  )}

                  {/* Body text & Quotes */}
                  <div className={`space-y-3 ${displaySpoiler ? 'blur-md select-none pointer-events-none' : ''}`}>
                    <h4 className="text-[#1A1A1A] font-bold text-base">{review.title}</h4>
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line font-sans">{review.body}</p>

                    {review.favoriteQuote && (
                      <div className="p-4 bg-[#F5F2ED] border-l-4 border-[#C05E42] text-gray-700 rounded-r-2xl italic text-xs leading-relaxed space-y-1 shadow-sm">
                        <span className="text-[#C05E42] font-bold uppercase tracking-widest text-[9px] block">Favorite Quote</span>
                        <p className="font-serif">"{review.favoriteQuote}"</p>
                      </div>
                    )}
                  </div>

                  {/* Likes & Comments segment */}
                  <div className="pt-4 border-t border-[#F0EFE9] flex flex-wrap items-center gap-6 text-xs text-gray-400">
                    <button
                      onClick={() => handleLikeReview(review.id)}
                      className={`flex items-center gap-1.5 transition-colors cursor-pointer font-bold ${
                        user && review.likes.includes(user.id) ? 'text-[#C05E42]' : 'hover:text-[#1A1A1A]'
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>{review.likes.length} Likes</span>
                    </button>

                    <span className="text-gray-200 font-bold">•</span>

                    <span className="flex items-center gap-1.5 text-gray-500 hover:text-[#1A1A1A] transition-colors cursor-pointer font-bold">
                      <MessageSquare className="w-4 h-4" />
                      <span>{review.comments?.length || 0} Replies</span>
                    </span>
                  </div>

                  {/* Comments/Replies list */}
                  {review.comments && review.comments.length > 0 && (
                    <div className="bg-[#F5F2ED] border border-[#EAE7DE] p-4 rounded-2xl ml-4 sm:ml-8 space-y-3 mt-4 shadow-sm">
                      {review.comments.map(comment => (
                        <div key={comment.id} className="text-xs text-[#1A1A1A] space-y-1 pb-2 border-b border-[#E3DEC3] last:border-0 last:pb-0">
                          <div className="flex items-center justify-between">
                            <div className="font-bold text-[#1A1A1A] hover:text-[#C05E42] transition-colors cursor-pointer">
                              {comment.userDisplayName} <span className="font-normal text-gray-400 text-[10px]">@{comment.username}</span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium">{new Date(comment.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-gray-750 font-sans leading-relaxed">{comment.body}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Comment box reply */}
                  {user && (
                    <div className="ml-4 sm:ml-8 flex gap-2 mt-4">
                      <input
                        type="text"
                        placeholder="Write a supportive community comment..."
                        value={commentInputs[review.id] || ''}
                        onChange={e => setCommentInputs({ ...commentInputs, [review.id]: e.target.value })}
                        onKeyDown={e => { if (e.key === 'Enter') handleAddComment(review.id); }}
                        className="flex-1 bg-[#F5F2ED] border border-[#EAE7DE] rounded-xl px-4 py-2.5 text-xs text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none"
                      />
                      <button
                        onClick={() => handleAddComment(review.id)}
                        className="bg-[#C05E42] hover:bg-[#A94A2F] transition-colors text-white font-bold px-4 py-2 rounded-xl"
                        title="Submit reply"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
