import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Book } from '../types.ts';
import { Star, BookOpen, Clock } from 'lucide-react';

interface BookCardProps {
  book: Book;
}

export default function BookCard({ book }: BookCardProps) {
  return (
    <motion.div
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="bg-white border border-[#EAE7DE] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col h-full"
      id={`book-card-${book.id}`}
    >
      {/* Cover Image container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[#F5F2ED] group">
        <img
          src={book.coverUrl}
          alt={book.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-100 flex flex-col justify-end p-4">
          <div className="flex flex-wrap gap-1 mb-1">
            {book.categoryBadges?.map((b, idx) => (
              <span
                key={idx}
                className="bg-[#C05E42] text-white text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full"
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1 justify-between bg-white">
        <div>
          <span className="text-[10px] text-[#5A5A40] font-bold tracking-widest uppercase block mb-1">
            {book.genre}
          </span>
          <Link
            to={`/books/${book.id}`}
            className="text-[#1A1A1A] font-serif italic font-bold text-lg line-clamp-1 hover:text-[#C05E42] transition-colors"
          >
            {book.title}
          </Link>
          <p className="text-[#5A5A40]/80 text-xs mt-0.5 mb-2 font-medium">By {book.author}</p>
          <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed mb-4">
            {book.description}
          </p>
        </div>

        <div>
          {/* Metrics */}
          <div className="flex items-center justify-between pt-3 border-t border-[#F0EFE9] text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center text-[#C05E42] gap-0.5">
                <Star className="w-3.5 h-3.5 fill-[#C05E42]" />
                <span className="font-bold text-[#1A1A1A]">{book.ratingAverage || 'No rating'}</span>
              </div>
              <span className="text-gray-300">•</span>
              <span>{book.reviewCount} {book.reviewCount === 1 ? 'review' : 'reviews'}</span>
            </div>

            <div className="flex items-center gap-1 text-gray-400">
              <Clock className="w-3.5 h-3.5" />
              <span>~{book.readingTimeEst || 200}m</span>
            </div>
          </div>

          <Link
            to={`/books/${book.id}`}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-[#5A5A40] text-white text-[10px] font-bold tracking-widest uppercase py-2.5 px-4 rounded-full hover:bg-[#C05E42] transition-colors text-center"
            id={`book-action-btn-${book.id}`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Explore Book
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
