export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  bio: string;
  favoriteGenres: string[];
  joinedDate: string;
  readingStreak: number;
  lastActiveDate?: string;
  booksReadCount: number;
  reviewsCount: number;
  badges: string[]; // Badge ID references
  readingRank: string; // Reading Newbie, Casual Reader, etc.
}

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  coverUrl: string;
  publisher: string;
  publishYear: number;
  genre: string;
  isbn: string;
  ratingAverage: number;
  reviewCount: number;
  readingTimeEst: number; // in minutes
  categoryBadges: string[]; // Example: "🏆 Top 50 Nigerian Fiction"
}

export interface Review {
  id: string;
  bookId: string;
  userId: string;
  username: string;
  userDisplayName: string;
  userAvatarUrl: string;
  rating: number; // 1-5 stars
  title: string;
  body: string;
  isSpoiler: boolean;
  favoriteQuote?: string;
  likes: string[]; // List of user IDs who liked this review
  comments: ReviewComment[];
  createdAt: string;
}

export interface ReviewComment {
  id: string;
  userId: string;
  username: string;
  userDisplayName: string;
  userAvatarUrl: string;
  body: string;
  createdAt: string;
}

export interface ReadingProgress {
  userId: string;
  bookId: string;
  status: 'want_to_read' | 'currently_reading' | 'read';
  updatedAt: string;
  currentPage?: number;
  totalPages?: number;
  notes?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide icon name
  category: string; // e.g. "achievement" | "rank"
}

export interface Streak {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate?: string;
}

export interface Activity {
  id: string;
  userId: string;
  username: string;
  userDisplayName: string;
  userAvatarUrl: string;
  type: 'review' | 'status_change' | 'badge_earned';
  bookId?: string;
  bookTitle?: string;
  bookCover?: string;
  details: string; // e.g., "marked as Currently Reading", "wrote a review"
  createdAt: string;
}

export interface SearchFilters {
  query: string;
  genre: string;
  sortBy: 'highest_rated' | 'most_reviewed' | 'popular' | 'recently_added';
}
