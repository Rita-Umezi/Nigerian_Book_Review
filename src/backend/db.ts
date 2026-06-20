import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { User, Book, Review, ReadingProgress, Activity, Badge } from '../types.ts';

const DB_FILE = path.join(process.cwd(), 'database.json');

export interface DBStore {
  users: Record<string, User & { passwordHash: string }>;
  books: Record<string, Book>;
  reviews: Record<string, Review>;
  progress: Record<string, ReadingProgress[]>; // Key: userId
  activities: Activity[];
}

// In-memory cache
let dbState: DBStore = {
  users: {},
  books: {},
  reviews: {},
  progress: {},
  activities: [],
};

// Preset badges
export const SYSTEM_BADGES: Badge[] = [
  { id: 'first_review', name: 'First Review', description: 'Wrote your first book review!', icon: 'Bookmark', category: 'achievement' },
  { id: '10_books_read', name: 'Book Devourer', description: 'Completed reading 10 books!', icon: 'Award', category: 'achievement' },
  { id: '7_day_streak', name: 'Daily Devotee', description: 'Maintained a 7-day reading streak!', icon: 'Flame', category: 'achievement' },
  { id: 'top_reviewer', name: 'Critic Laureate', description: 'Wrote 5 or more comprehensive reviews!', icon: 'PenTool', category: 'achievement' },
  { id: 'naija_lover', name: 'Naija Lit Connoisseur', description: 'Read at least 3 books in African/Nigerian Literature!', icon: 'Heart', category: 'special' }
];

// Seed books
const SEED_BOOKS: Book[] = [
  {
    id: '1',
    title: 'Things Fall Apart',
    author: 'Chinua Achebe',
    description: 'A classic novel that chronicles the life of Okonkwo, an Igbo leader and local wrestling champion in Umuofia, detailing the impact of British colonialism and Christian missionaries on traditional Igbo society.',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780385474542-L.jpg',
    publisher: 'Heinemann',
    publishYear: 1958,
    genre: 'African Literature',
    isbn: '9780385474542',
    ratingAverage: 4.8,
    reviewCount: 3,
    readingTimeEst: 200,
    categoryBadges: ['🏆 Top 50 Nigerian Fiction', '🎖️ Classic Literature']
  },
  {
    id: '2',
    title: 'Half of a Yellow Sun',
    author: 'Chimamanda Ngozi Adichie',
    description: 'Set during the Nigerian civil war of the late 1960s, the novel traces the lives of twins Olanna and Kainene, an English writer Richard, and Ugwu, a houseboy, as their lives collide and are forever altered by war.',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9781400095209-L.jpg',
    publisher: 'Alfred A. Knopf',
    publishYear: 2006,
    genre: 'Historical Fiction',
    isbn: '9781400095209',
    ratingAverage: 4.9,
    reviewCount: 2,
    readingTimeEst: 430,
    categoryBadges: ['🏆 Top 50 Nigerian Fiction', '🔥 Popular Literature']
  },
  {
    id: '3',
    title: 'My Sister, the Serial Killer',
    author: 'Oyinkan Braithwaite',
    description: 'A dark, comedic thriller set in Lagos, Nigeria, about Korede, a nurse whose younger sister Ayoola has a highly inconvenient habit of murdering her boyfriends in "self-defense" – leaving Korede to clean up the messes.',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780385544238-L.jpg',
    publisher: 'Doubleday',
    publishYear: 2018,
    genre: 'Comedy / Thriller',
    isbn: '9780385544238',
    ratingAverage: 4.5,
    reviewCount: 1,
    readingTimeEst: 180,
    categoryBadges: ['🏆 Top 50 in Comedy', '🔪 Noir Thriller']
  },
  {
    id: '4',
    title: 'The Joys of Motherhood',
    author: 'Buchi Emecheta',
    description: 'A poignant and critical look at the lives of Nigerian women. The novel tells the life story of Nnu Ego, a woman who overcomes initial struggles to bear children, only to find that motherhood does not bring the happiness she expected.',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780807609507-L.jpg',
    publisher: 'George Allison & Busby',
    publishYear: 1979,
    genre: 'African Literature',
    isbn: '9780807609507',
    ratingAverage: 4.6,
    reviewCount: 1,
    readingTimeEst: 224,
    categoryBadges: ['🎖️ Feminist Classic', '🏆 Top 50 Nigerian Fiction']
  },
  {
    id: '5',
    title: 'Stay With Me',
    author: 'Ayobami Adebayo',
    description: 'A devastatingly beautiful novel exploring marriage, maternal heartbreak, and the destructive power of secrets in 1980s Nigeria, focusing on Yejide and Akin, a young couple building their lives amidst social crises.',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9781786890153-L.jpg',
    publisher: 'Canongate Books',
    publishYear: 2017,
    genre: 'Romance / Drama',
    isbn: '9781786890153',
    ratingAverage: 4.4,
    reviewCount: 1,
    readingTimeEst: 260,
    categoryBadges: ['❤️ Relational Drama']
  },
  {
    id: '6',
    title: 'The Secret Lives of Baba Segi\'s Wives',
    author: 'Lola Shoneyin',
    description: 'A rich, multi-perspective novel detailing the intricate polygamous household of Baba Segi in modern-day Ibadan, Nigeria, which is threatened by the arrival of Bolanle, a university graduate.',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9789784851879-L.jpg',
    publisher: 'Cassava Republic Press',
    publishYear: 2010,
    genre: 'Comedy',
    isbn: '9789784851879',
    ratingAverage: 4.7,
    reviewCount: 1,
    readingTimeEst: 245,
    categoryBadges: ['🏆 Top 50 in Comedy', '🎭 Satire']
  },
  {
    id: '7',
    title: 'Akata Witch',
    author: 'Nnedi Okorafor',
    description: 'A young adult fantasy centering on Sunny Nwazue, an American-born albino girl living in Aba, Nigeria, who discovers she is a Leopard Person, possessing ancient magical powers that she must master to stop a killer.',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780670012213-L.jpg',
    publisher: 'Viking',
    publishYear: 2011,
    genre: 'Fantasy',
    isbn: '9780670012213',
    ratingAverage: 4.3,
    reviewCount: 0,
    readingTimeEst: 350,
    categoryBadges: ['✨ YA Fantasy', '🦄 Speculative Fiction']
  },
  {
    id: '8',
    title: 'Freshwater',
    author: 'Akwaeke Emezi',
    description: 'A startling, poetic, and surreal debut exploring the metaphysics of mental illness and identity, charting Ada’s fragmented, multiple consciousness as she navigates life between Nigeria and America.',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780802127357-L.jpg',
    publisher: 'Grove Press',
    publishYear: 2018,
    genre: 'Fiction / Surrealist',
    isbn: '9780802127357',
    ratingAverage: 4.5,
    reviewCount: 1,
    readingTimeEst: 230,
    categoryBadges: ['🌀 Surrealist Lit', '🎖️ Award Finalist']
  },
  {
    id: '9',
    title: 'The Fishermen',
    author: 'Chigozie Obioma',
    description: 'A tragic modern myth following four brothers in 1990s Akure, Nigeria. While skipping school, they catch a dangerous fish at an ominous river and encounter a madman who utters a prophecy that sets a course of fratricide.',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780316338370-L.jpg',
    publisher: 'ONE / Pushkin Press',
    publishYear: 2015,
    genre: 'African Literature',
    isbn: '9780316338370',
    ratingAverage: 4.6,
    reviewCount: 0,
    readingTimeEst: 300,
    categoryBadges: ['🏆 Booker Prize Nominee']
  },
  {
    id: '10',
    title: 'Death and the King\'s Horseman',
    author: 'Wole Soyinka',
    description: 'The Nobel Laureate\'s masterful, intense stage play exploring ritual suicide, duty, cultural collision, and the tragic consequences of colonial intervention in Yoruba royal society during World War II.',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780393322996-L.jpg',
    publisher: 'Methuen',
    publishYear: 1975,
    genre: 'Drama / Poetry',
    isbn: '9780393322996',
    ratingAverage: 4.8,
    reviewCount: 1,
    readingTimeEst: 110,
    categoryBadges: ['👑 Nobel Classic', '🇳🇬 Nigerian Literature Giant']
  }
];

// Helper to calculate rank based on number of completed books
export function calculateRank(booksRead: number): string {
  if (booksRead <= 5) return 'Reading Newbie';
  if (booksRead <= 15) return 'Casual Reader';
  if (booksRead <= 30) return 'Book Explorer';
  if (booksRead <= 60) return 'Page Turner';
  if (booksRead <= 100) return 'Literary Enthusiast';
  if (booksRead <= 200) return 'Expert Reader';
  return 'Book Sage';
}

// Get numeric rank upper bound for progress bar
export function getNextRankTarget(currentRank: string): { target: number; label: string } {
  switch (currentRank) {
    case 'Reading Newbie': return { target: 6, label: 'Casual Reader' };
    case 'Casual Reader': return { target: 16, label: 'Book Explorer' };
    case 'Book Explorer': return { target: 31, label: 'Page Turner' };
    case 'Page Turner': return { target: 61, label: 'Literary Enthusiast' };
    case 'Literary Enthusiast': return { target: 101, label: 'Expert Reader' };
    case 'Expert Reader': return { target: 201, label: 'Book Sage' };
    default: return { target: 300, label: 'Ultimate Scholar' };
  }
}

// Load and seed database
export function loadDB(): DBStore {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      dbState = JSON.parse(data);
      
      // Perform automated book cover URL updates/migrations on load
      let migrated = false;
      SEED_BOOKS.forEach(b => {
        if (dbState.books[b.id] && dbState.books[b.id].coverUrl !== b.coverUrl) {
          dbState.books[b.id].coverUrl = b.coverUrl;
          migrated = true;
        }
      });
      
      dbState.activities.forEach(act => {
        if (act.bookId) {
          const matchingBook = SEED_BOOKS.find(b => b.id === act.bookId);
          if (matchingBook && act.bookCover !== matchingBook.coverUrl) {
            act.bookCover = matchingBook.coverUrl;
            migrated = true;
          }
        }
      });

      if (migrated) {
        console.log('Book covers migrated to actual images successfully in database.json');
        saveDB();
      }
      return dbState;
    }
  } catch (err) {
    console.error('Error reading DB, re-initializing...', err);
  }

  // Build seed configuration
  const defaultUser = {
    id: 'user_achi',
    username: 'achi_reads',
    displayName: 'Adebayo Chinedu',
    email: 'adebayo@naijareads.com',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150',
    bio: 'Avid reader of West African thrillers and historical fiction. Always down for coffee and a heavy Chinua Achebe discussion.',
    favoriteGenres: ['African Literature', 'Historical Fiction', 'Comedy / Thriller'],
    joinedDate: new Date('2026-01-10').toISOString(),
    readingStreak: 5,
    booksReadCount: 12,
    reviewsCount: 3,
    badges: ['first_review'],
    readingRank: 'Casual Reader',
    passwordHash: bcrypt.hashSync('password123', 10),
  };

  const defaultUser2 = {
    id: 'user_chi',
    username: 'chi_m_reads',
    displayName: 'Chinenye Okafor',
    email: 'chinenye@naijareads.com',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    bio: 'Romance lover and poet based in Lagos. Fan of beautiful words and complicated relationships.',
    favoriteGenres: ['Romance / Drama', 'African Literature'],
    joinedDate: new Date('2026-02-14').toISOString(),
    readingStreak: 12,
    booksReadCount: 22,
    reviewsCount: 2,
    badges: ['first_review', '7_day_streak'],
    readingRank: 'Book Explorer',
    passwordHash: bcrypt.hashSync('password123', 10),
  };

  dbState = {
    users: {
      [defaultUser.id]: defaultUser,
      [defaultUser2.id]: defaultUser2,
    },
    books: {},
    reviews: {},
    progress: {},
    activities: [],
  };

  // Populate pre-loaded books
  SEED_BOOKS.forEach(b => {
    dbState.books[b.id] = b;
  });

  // Seed default reviews
  const reviewSeeds: Review[] = [
    {
      id: 'rev_1',
      bookId: '1',
      userId: 'user_achi',
      username: 'achi_reads',
      userDisplayName: 'Adebayo Chinedu',
      userAvatarUrl: defaultUser.avatarUrl,
      rating: 5,
      title: 'A towering, foundational text of modern African fiction',
      body: 'Okonkwo is one of the most compelling tragic heroes in all of literary history. Achebe’s brilliance lies in how simply he writes while portraying immense complexity. The depiction of Umuofia’s culture is beautiful, and the colonial clash is heartbreakingly devastating. A must-read for every human.',
      isSpoiler: false,
      favoriteQuote: '"The white man is very clever. He came quietly and peaceably with his religion. We were amused at his foolishness and allowed him to stay. Now he has won our brothers, and our clan can no longer act like one. He has put a knife on the things that held us together and we have fallen apart."',
      likes: ['user_chi'],
      comments: [
        {
          id: 'c_1',
          userId: 'user_chi',
          username: 'chi_m_reads',
          userDisplayName: 'Chinenye Okafor',
          userAvatarUrl: defaultUser2.avatarUrl,
          body: 'Beautifully put. The tragedy feels almost Shakespearean, but uniquely and powerfully Igbo.',
          createdAt: new Date('2026-03-20T10:15:00Z').toISOString()
        }
      ],
      createdAt: new Date('2026-03-19T14:22:00Z').toISOString()
    },
    {
      id: 'rev_2',
      bookId: '2',
      userId: 'user_chi',
      username: 'chi_m_reads',
      userDisplayName: 'Chinenye Okafor',
      userAvatarUrl: defaultUser2.avatarUrl,
      rating: 5,
      title: 'Devastating yet exceptionally beautiful',
      body: 'Half of a Yellow Sun is a work of genius. It moves with a terrifying grace from the domestic security of the university town Nsukka to the horrors of refugee camps. Olanna and Richard are brilliant, but Ugwu steal the show. His writing is the absolute soul of this book.',
      isSpoiler: false,
      favoriteQuote: '"This was love: a string of coincidences that gathered significance and became miracles."',
      likes: ['user_achi'],
      comments: [],
      createdAt: new Date('2026-04-05T08:30:00Z').toISOString()
    },
    {
      id: 'rev_3',
      bookId: '3',
      userId: 'user_achi',
      username: 'achi_reads',
      userDisplayName: 'Adebayo Chinedu',
      userAvatarUrl: defaultUser.avatarUrl,
      rating: 4,
      title: 'Extremely witty, punchy and dark!',
      body: 'I read this in a single afternoon sitting at a Lagos cafe. It is unbelievably fast-paced and satirical. Korede’s dry cynicism is hilarious, and the sibling dynamic is so dysfunctional yet real. A perfect entry for Nigerian comedy/noir. Highly recommended for when you need a fun, slightly twisted read.',
      isSpoiler: false,
      likes: [],
      comments: [],
      createdAt: new Date('2026-05-12T19:00:00Z').toISOString()
    }
  ];

  reviewSeeds.forEach(r => {
    dbState.reviews[r.id] = r;
  });

  // Seed progress
  dbState.progress['user_achi'] = [
    { userId: 'user_achi', bookId: '1', status: 'read', updatedAt: new Date('2026-03-19').toISOString() },
    { userId: 'user_achi', bookId: '2', status: 'read', updatedAt: new Date('2026-03-24').toISOString() },
    { userId: 'user_achi', bookId: '3', status: 'read', updatedAt: new Date('2026-05-12').toISOString() },
    { userId: 'user_achi', bookId: '5', status: 'currently_reading', updatedAt: new Date('2026-06-15').toISOString(), currentPage: 120, totalPages: 260 }
  ];

  dbState.progress['user_chi'] = [
    { userId: 'user_chi', bookId: '1', status: 'read', updatedAt: new Date('2026-03-20').toISOString() },
    { userId: 'user_chi', bookId: '2', status: 'read', updatedAt: new Date('2026-04-05').toISOString() },
    { userId: 'user_chi', bookId: '6', status: 'currently_reading', updatedAt: new Date('2026-06-12').toISOString(), currentPage: 85, totalPages: 245 }
  ];

  // Seed activities
  dbState.activities = [
    {
      id: 'act_1',
      userId: 'user_achi',
      username: 'achi_reads',
      userDisplayName: 'Adebayo Chinedu',
      userAvatarUrl: defaultUser.avatarUrl,
      type: 'review',
      bookId: '1',
      bookTitle: 'Things Fall Apart',
      bookCover: SEED_BOOKS[0].coverUrl,
      details: 'wrote a 5-star review: "A towering, foundational text..."',
      createdAt: new Date('2026-03-19T14:22:00Z').toISOString()
    },
    {
      id: 'act_2',
      userId: 'user_chi',
      username: 'chi_m_reads',
      userDisplayName: 'Chinenye Okafor',
      userAvatarUrl: defaultUser2.avatarUrl,
      type: 'review',
      bookId: '2',
      bookTitle: 'Half of a Yellow Sun',
      bookCover: SEED_BOOKS[1].coverUrl,
      details: 'wrote a 5-star review: "Devastating yet exceptionally..."',
      createdAt: new Date('2026-04-05T08:30:00Z').toISOString()
    },
    {
      id: 'act_3',
      userId: 'user_achi',
      username: 'achi_reads',
      userDisplayName: 'Adebayo Chinedu',
      userAvatarUrl: defaultUser.avatarUrl,
      type: 'status_change',
      bookId: '5',
      bookTitle: 'Stay With Me',
      bookCover: SEED_BOOKS[4].coverUrl,
      details: 'marked as Currently Reading',
      createdAt: new Date('2026-06-15T16:00:00Z').toISOString()
    },
    {
      id: 'act_4',
      userId: 'user_chi',
      username: 'chi_m_reads',
      userDisplayName: 'Chinenye Okafor',
      userAvatarUrl: defaultUser2.avatarUrl,
      type: 'badge_earned',
      details: 'earned the Daily Devotee badge!',
      createdAt: new Date('2026-06-18T22:30:00Z').toISOString()
    }
  ];

  saveDB();
  return dbState;
}

export function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing DB:', err);
  }
}

// Global actions to interact with DB
export const db = {
  getStore: () => dbState,
  
  users: {
    getById: (id: string) => dbState.users[id],
    getByUsername: (username: string) => Object.values(dbState.users).find(u => u.username.toLowerCase() === username.toLowerCase()),
    getByEmail: (email: string) => Object.values(dbState.users).find(u => u.email.toLowerCase() === email.toLowerCase()),
    create: (user: User & { passwordHash: string }) => {
      dbState.users[user.id] = user;
      saveDB();
    },
    update: (id: string, updates: Partial<User>) => {
      if (dbState.users[id]) {
        dbState.users[id] = { ...dbState.users[id], ...updates };
        saveDB();
      }
    },
    checkAndAwardBadges: (id: string) => {
      const user = dbState.users[id];
      if (!user) return [];
      
      const userProgress = dbState.progress[id] || [];
      const userReviews = Object.values(dbState.reviews).filter(r => r.userId === id);
      
      const earnedBadges = [...user.badges];
      const newlyEarned: string[] = [];
      
      // first_review
      if (userReviews.length >= 1 && !earnedBadges.includes('first_review')) {
        earnedBadges.push('first_review');
        newlyEarned.push('first_review');
      }
      
      // 10_books_read
      const readBooksCount = userProgress.filter(p => p.status === 'read').length;
      if (readBooksCount >= 10 && !earnedBadges.includes('10_books_read')) {
        earnedBadges.push('10_books_read');
        newlyEarned.push('10_books_read');
      }
      
      // top_reviewer (5+ reviews)
      if (userReviews.length >= 5 && !earnedBadges.includes('top_reviewer')) {
        earnedBadges.push('top_reviewer');
        newlyEarned.push('top_reviewer');
      }
      
      // 7_day_streak (streak >= 7)
      if (user.readingStreak >= 7 && !earnedBadges.includes('7_day_streak')) {
        earnedBadges.push('7_day_streak');
        newlyEarned.push('7_day_streak');
      }

      // naija_lover (African / Nigerian Books Read >= 3)
      const readBooks = userProgress.filter(p => p.status === 'read').map(p => p.bookId);
      const naijaBooksCount = readBooks.filter(bookId => {
        const book = dbState.books[bookId];
        return book && (book.genre === 'African Literature' || book.categoryBadges.some(b => b.includes('Nigerian') || b.includes('Naija')));
      }).length;

      if (naijaBooksCount >= 3 && !earnedBadges.includes('naija_lover')) {
        earnedBadges.push('naija_lover');
        newlyEarned.push('naija_lover');
      }
      
      if (newlyEarned.length > 0) {
        user.badges = earnedBadges;
        newlyEarned.forEach(badgeId => {
          const badge = SYSTEM_BADGES.find(b => b.id === badgeId);
          db.activities.add({
            id: 'act_' + Math.random().toString(36).substring(2, 9),
            userId: user.id,
            username: user.username,
            userDisplayName: user.displayName,
            userAvatarUrl: user.avatarUrl,
            type: 'badge_earned',
            details: `earned the "${badge?.name}" badge!`,
            createdAt: new Date().toISOString()
          });
        });
        saveDB();
      }
      
      return newlyEarned;
    }
  },
  
  books: {
    getAll: () => Object.values(dbState.books),
    getById: (id: string) => dbState.books[id],
    add: (book: Book) => {
      dbState.books[book.id] = book;
      saveDB();
    },
    update: (id: string, updates: Partial<Book>) => {
      if (dbState.books[id]) {
        dbState.books[id] = { ...dbState.books[id], ...updates };
        saveDB();
      }
    },
    delete: (id: string) => {
      delete dbState.books[id];
      saveDB();
    },
    recalculateRating: (bookId: string) => {
      const bookReviews = Object.values(dbState.reviews).filter(r => r.bookId === bookId);
      if (bookReviews.length === 0) {
        dbState.books[bookId].ratingAverage = 0;
        dbState.books[bookId].reviewCount = 0;
      } else {
        const total = bookReviews.reduce((acc, r) => acc + r.rating, 0);
        dbState.books[bookId].ratingAverage = parseFloat((total / bookReviews.length).toFixed(1));
        dbState.books[bookId].reviewCount = bookReviews.length;
      }
      saveDB();
    }
  },
  
  reviews: {
    getAll: () => Object.values(dbState.reviews),
    getById: (id: string) => dbState.reviews[id],
    getByBookId: (bookId: string) => Object.values(dbState.reviews).filter(r => r.bookId === bookId),
    add: (review: Review) => {
      dbState.reviews[review.id] = review;
      
      // Update book average dynamic ratings
      db.books.recalculateRating(review.bookId);
      
      // Update user reviews count
      const user = dbState.users[review.userId];
      if (user) {
        user.reviewsCount += 1;
        // Check for badges
        db.users.checkAndAwardBadges(review.userId);
      }
      
      saveDB();
    },
    delete: (id: string) => {
      const review = dbState.reviews[id];
      if (review) {
        delete dbState.reviews[id];
        db.books.recalculateRating(review.bookId);
        
        const user = dbState.users[review.userId];
        if (user && user.reviewsCount > 0) {
          user.reviewsCount -= 1;
        }
        saveDB();
      }
    },
    toggleLike: (id: string, userId: string) => {
      const r = dbState.reviews[id];
      if (r) {
        const hasLiked = r.likes.includes(userId);
        if (hasLiked) {
          r.likes = r.likes.filter(uid => uid !== userId);
        } else {
          r.likes.push(userId);
        }
        saveDB();
        return !hasLiked;
      }
      return false;
    },
    addComment: (id: string, comment: any) => {
      const r = dbState.reviews[id];
      if (r) {
        if (!r.comments) r.comments = [];
        r.comments.push(comment);
        saveDB();
      }
    }
  },
  
  progress: {
    getByUser: (userId: string) => dbState.progress[userId] || [],
    getUserBookStatus: (userId: string, bookId: string) => {
      const list = dbState.progress[userId] || [];
      return list.find(p => p.bookId === bookId);
    },
    update: (userId: string, bookId: string, updates: Partial<ReadingProgress> & { status: 'want_to_read' | 'currently_reading' | 'read' }) => {
      if (!dbState.progress[userId]) {
        dbState.progress[userId] = [];
      }
      
      const records = dbState.progress[userId];
      const existingIdx = records.findIndex(r => r.bookId === bookId);
      const now = new Date().toISOString();
      const prevRecord = existingIdx >= 0 ? records[existingIdx] : null;

      if (existingIdx >= 0) {
        records[existingIdx] = {
          ...records[existingIdx],
          ...updates,
          updatedAt: now
        };
      } else {
        records.push({
          userId,
          bookId,
          status: updates.status,
          currentPage: updates.currentPage || 0,
          totalPages: updates.totalPages || dbState.books[bookId]?.readingTimeEst || 200,
          notes: updates.notes || '',
          updatedAt: now
        });
      }
      
      // Update reading metrics if status changed to 'read'
      const user = dbState.users[userId];
      if (user) {
        // Recount books read total
        const readCount = records.filter(p => p.status === 'read').length;
        user.booksReadCount = readCount;
        user.readingRank = calculateRank(readCount);
        
        // Handle streak logic
        const lastActiveDate = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
        const today = new Date();
        const diffTime = lastActiveDate ? Math.abs(today.getTime() - lastActiveDate.getTime()) : null;
        const diffDays = diffTime ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : null;

        if (!lastActiveDate) {
          user.readingStreak = 1;
        } else if (diffDays === 1) {
          user.readingStreak += 1;
        } else if (diffDays !== null && diffDays > 1) {
          user.readingStreak = 1; // broken streak
        }
        
        user.lastActiveDate = today.toISOString();
        
        // Check for badges
        db.users.checkAndAwardBadges(userId);
      }
      
      // Log activity
      const book = dbState.books[bookId];
      if (book && user && (!prevRecord || prevRecord.status !== updates.status)) {
        let statusLabel = '';
        if (updates.status === 'read') statusLabel = 'completed reading';
        else if (updates.status === 'currently_reading') statusLabel = 'marked as Currently Reading';
        else if (updates.status === 'want_to_read') statusLabel = 'added to Wishlist';

        db.activities.add({
          id: 'act_' + Math.random().toString(36).substring(2, 9),
          userId,
          username: user.username,
          userDisplayName: user.displayName,
          userAvatarUrl: user.avatarUrl,
          type: 'status_change',
          bookId,
          bookTitle: book.title,
          bookCover: book.coverUrl,
          details: statusLabel,
          createdAt: now
        });
      }
      
      saveDB();
    }
  },
  
  activities: {
    getAll: () => dbState.activities,
    add: (activity: Activity) => {
      dbState.activities.unshift(activity); // Add to beginning of array
      // Cap at 50 activities for performance
      if (dbState.activities.length > 50) {
        dbState.activities = dbState.activities.slice(0, 50);
      }
      saveDB();
    }
  }
};

// Auto-load on database load
loadDB();
