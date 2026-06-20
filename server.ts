import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { db, SYSTEM_BADGES, calculateRank } from './src/backend/db.ts';
import { Review, ReviewComment } from './src/types.ts';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'naijareads_secret_2026_secure';

app.use(express.json({ limit: '10mb' }));

// Initial database load
db.getStore();

// ==========================================
// MIDDLEWARES
// ==========================================

// Authenticate JWT Middleware
export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }
    req.user = decoded as AuthRequest['user'];
    next();
  });
};

// ==========================================
// AUTH ENDPOINTS
// ==========================================

// Register
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { username, displayName, email, password, favoriteGenres } = req.body;

  if (!username || !displayName || !email || !password) {
    res.status(400).json({ error: 'Username, display name, email, and password are required' });
    return;
  }

  const existingByUsername = db.users.getByUsername(username);
  if (existingByUsername) {
    res.status(400).json({ error: 'Username is already taken' });
    return;
  }

  const existingByEmail = db.users.getByEmail(email);
  if (existingByEmail) {
    res.status(400).json({ error: 'Email is already registered' });
    return;
  }

  const userId = 'user_' + Math.random().toString(36).substring(2, 9);
  const passwordHash = bcrypt.hashSync(password, 10);
  
  // Random elegant avatar
  const avatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=150'
  ];
  const avatarUrl = avatars[Math.floor(Math.random() * avatars.length)];

  const newUser = {
    id: userId,
    username,
    displayName,
    email,
    avatarUrl,
    bio: 'Happy reader of beautiful stories.',
    favoriteGenres: favoriteGenres || [],
    joinedDate: new Date().toISOString(),
    readingStreak: 0,
    booksReadCount: 0,
    reviewsCount: 0,
    badges: [],
    readingRank: 'Reading Newbie',
    passwordHash
  };

  db.users.create(newUser);

  // Generate token
  const token = jwt.sign({ id: userId, username, email }, JWT_SECRET, { expiresIn: '7d' });
  const { passwordHash: _, ...userWithoutPassword } = newUser;

  // Add initial registration activity
  db.activities.add({
    id: 'act_reg_' + Math.random().toString(36).substring(2, 9),
    userId,
    username,
    userDisplayName: displayName,
    userAvatarUrl: avatarUrl,
    type: 'status_change',
    details: 'joined the NaijaReads literary community!',
    createdAt: new Date().toISOString()
  });

  res.status(201).json({ token, user: userWithoutPassword });
});

// Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { emailOrUsername, password } = req.body;

  if (!emailOrUsername || !password) {
    res.status(400).json({ error: 'Email/Username and password are required' });
    return;
  }

  // Find either by email or username
  let fullUser = db.users.getByEmail(emailOrUsername);
  if (!fullUser) {
    fullUser = db.users.getByUsername(emailOrUsername);
  }

  if (!fullUser || !bcrypt.compareSync(password, fullUser.passwordHash)) {
    res.status(400).json({ error: 'Invalid email/username or password' });
    return;
  }

  // Update streak / activity checking
  const today = new Date();
  const lastActive = fullUser.lastActiveDate ? new Date(fullUser.lastActiveDate) : null;
  let currentStreak = fullUser.readingStreak;

  if (lastActive) {
    const diffTime = Math.abs(today.getTime() - lastActive.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      currentStreak += 1;
    } else if (diffDays > 1) {
      currentStreak = 1; // streak broken, reset to 1
    }
  } else {
    currentStreak = 1;
  }

  db.users.update(fullUser.id, {
    readingStreak: currentStreak,
    lastActiveDate: today.toISOString()
  });

  // Re-check badges
  db.users.checkAndAwardBadges(fullUser.id);

  // Re-fetch
  const updatedUser = db.users.getById(fullUser.id);
  const { passwordHash: _, ...userWithoutPassword } = updatedUser as any;

  const token = jwt.sign(
    { id: updatedUser.id, username: updatedUser.username, email: updatedUser.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token, user: userWithoutPassword });
});

// Get Me
app.get('/api/auth/me', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const fullUser = db.users.getById(req.user.id);
  if (!fullUser) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const { passwordHash: _, ...userWithoutPassword } = fullUser as any;
  res.json(userWithoutPassword);
});

// Update Profile
app.put('/api/auth/update', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { displayName, bio, favoriteGenres, avatarUrl } = req.body;
  const updates: any = {};
  if (displayName) updates.displayName = displayName;
  if (bio !== undefined) updates.bio = bio;
  if (favoriteGenres) updates.favoriteGenres = favoriteGenres;
  if (avatarUrl) updates.avatarUrl = avatarUrl;

  db.users.update(req.user.id, updates);

  const fullUser = db.users.getById(req.user.id);
  const { passwordHash: _, ...userWithoutPassword } = fullUser as any;
  res.json(userWithoutPassword);
});

// ==========================================
// BOOK ENDPOINTS
// ==========================================

// Get All (Filter & Search)
app.get('/api/books', (req: Request, res: Response) => {
  const { search = '', genre = '', sortBy = 'popular' } = req.query;
  let booksList = db.books.getAll();

  // Search filter
  if (search) {
    const q = (search as string).toLowerCase();
    booksList = booksList.filter(
      b =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.publisher.toLowerCase().includes(q) ||
        b.isbn.includes(q)
    );
  }

  // Genre filter
  if (genre && genre !== 'All') {
    booksList = booksList.filter(b => b.genre.toLowerCase() === (genre as string).toLowerCase());
  }

  // Sorting
  if (sortBy === 'highest_rated') {
    booksList.sort((a, b) => b.ratingAverage - a.ratingAverage);
  } else if (sortBy === 'most_reviewed') {
    booksList.sort((a, b) => b.reviewCount - a.reviewCount);
  } else if (sortBy === 'recently_added') {
    // Treat higher ID numerical as recently added
    booksList.sort((a, b) => parseInt(b.id) - parseInt(a.id));
  } else {
    // 'popular'
    booksList.sort((a, b) => b.reviewCount + b.ratingAverage * 2 - (a.reviewCount + a.ratingAverage * 2));
  }

  res.json(booksList);
});

// Get specific Book
app.get('/api/books/:id', (req: Request, res: Response) => {
  const book = db.books.getById(req.params.id);
  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  // Fetch specific book reviews
  const reviews = db.reviews.getByBookId(book.id);
  res.json({ book, reviews });
});

// Set book reading status
app.post('/api/books/:id/status', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { status, currentPage, totalPages, notes } = req.body;
  if (!status || !['want_to_read', 'currently_reading', 'read'].includes(status)) {
    res.status(400).json({ error: 'Valid status is required' });
    return;
  }

  const book = db.books.getById(req.params.id);
  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  db.progress.update(req.user.id, book.id, {
    status,
    currentPage,
    totalPages,
    notes
  });

  res.json({ success: true, message: `Reading status updated to ${status}` });
});

// Get user reading status for a book
app.get('/api/users/me/books/:bookId/status', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const statusObj = db.progress.getUserBookStatus(req.user.id, req.params.bookId);
  res.json({ status: statusObj ? statusObj.status : null, detail: statusObj || null });
});

// Admin Add Book
app.post('/api/admin/books', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // Simple admin protection (the preseeded user Achi is an admin for testing)
  if (req.user.username !== 'achi_reads') {
    res.status(403).json({ error: 'Only admins can manage books' });
    return;
  }

  const { title, author, description, publisher, publishYear, genre, isbn, readingTimeEst, categoryBadges, coverUrl } = req.body;

  if (!title || !author || !description || !genre || !isbn) {
    res.status(400).json({ error: 'All fields are required' });
    return;
  }

  const bookId = String(db.books.getAll().length + 1);
  const newBook = {
    id: bookId,
    title,
    author,
    description,
    coverUrl: coverUrl || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400',
    publisher: publisher || 'Self-Published',
    publishYear: publishYear ? parseInt(publishYear) : new Date().getFullYear(),
    genre,
    isbn,
    ratingAverage: 0,
    reviewCount: 0,
    readingTimeEst: readingTimeEst ? parseInt(readingTimeEst) : 220,
    categoryBadges: categoryBadges || []
  };

  db.books.add(newBook);
  res.status(201).json(newBook);
});

// ==========================================
// REVIEW ENDPOINTS
// ==========================================

// Add comprehensive Review
app.post('/api/reviews', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { bookId, rating, title, body, isSpoiler, favoriteQuote } = req.body;

  if (!bookId || !rating || !title || !body) {
    res.status(400).json({ error: 'bookId, rating, title, and body are required' });
    return;
  }

  const book = db.books.getById(bookId);
  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  const user = db.users.getById(req.user.id);
  if (!user) {
    res.status(404).json({ error: 'User profiles unresolvable' });
    return;
  }

  // Assert user doesn't rewrite reviews for the identical book to keep listings pristine
  const userBookReviews = db.reviews.getByBookId(bookId).filter(r => r.userId === userId);
  const userId = req.user.id;
  
  const reviewId = 'rev_' + Math.random().toString(36).substring(2, 9);
  const newReview: Review = {
    id: reviewId,
    bookId,
    userId,
    username: user.username,
    userDisplayName: user.displayName,
    userAvatarUrl: user.avatarUrl,
    rating: parseInt(rating),
    title,
    body,
    isSpoiler: !!isSpoiler,
    favoriteQuote,
    likes: [],
    comments: [],
    createdAt: new Date().toISOString()
  };

  db.reviews.add(newReview);

  // Set reader status to "read" automatically when they write a review as a convenience
  const currentStatus = db.progress.getUserBookStatus(userId, bookId);
  if (!currentStatus || currentStatus.status !== 'read') {
    db.progress.update(userId, bookId, { status: 'read' });
  }

  db.activities.add({
    id: 'act_' + Math.random().toString(36).substring(2, 9),
    userId,
    username: user.username,
    userDisplayName: user.displayName,
    userAvatarUrl: user.avatarUrl,
    type: 'review',
    bookId,
    bookTitle: book.title,
    bookCover: book.coverUrl,
    details: `wrote a ${rating}-star review: "${title}"`,
    createdAt: new Date().toISOString()
  });

  res.status(201).json({ review: newReview, success: true });
});

// Toggle Like
app.post('/api/reviews/:id/like', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const success = db.reviews.toggleLike(req.params.id, req.user.id);
  const review = db.reviews.getById(req.params.id);
  res.json({ success, likesCount: review ? review.likes.length : 0 });
});

// Comment on Review
app.post('/api/reviews/:id/comment', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { body } = req.body;
  if (!body || body.trim() === '') {
    res.status(400).json({ error: 'Comment body is required' });
    return;
  }

  const review = db.reviews.getById(req.params.id);
  if (!review) {
    res.status(404).json({ error: 'Review not found' });
    return;
  }

  const user = db.users.getById(req.user.id);
  if (!user) {
    res.status(404).json({ error: 'User profiles unresolved' });
    return;
  }

  const newComment: ReviewComment = {
    id: 'c_' + Math.random().toString(36).substring(2, 9),
    userId: user.id,
    username: user.username,
    userDisplayName: user.displayName,
    userAvatarUrl: user.avatarUrl,
    body,
    createdAt: new Date().toISOString()
  };

  db.reviews.addComment(req.params.id, newComment);
  res.status(201).json(newComment);
});

// ==========================================
// PROFILE & LEADERBOARD ENDPOINTS
// ==========================================

// Get User public profile stats
app.get('/api/users/:username', (req: Request, res: Response) => {
  const user = db.users.getByUsername(req.params.username);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  // Compile active shelves
  const shelfRecords = db.progress.getByUser(user.id);
  const shelves = {
    read: shelfRecords.filter(p => p.status === 'read').map(p => ({
      ...p,
      book: db.books.getById(p.bookId)
    })),
    currently_reading: shelfRecords.filter(p => p.status === 'currently_reading').map(p => ({
      ...p,
      book: db.books.getById(p.bookId)
    })),
    want_to_read: shelfRecords.filter(p => p.status === 'want_to_read').map(p => ({
      ...p,
      book: db.books.getById(p.bookId)
    }))
  };

  const userReviews = Object.values(db.getStore().reviews).filter(r => r.userId === user.id).map(r => ({
    ...r,
    book: db.books.getById(r.bookId)
  }));

  const userBadges = SYSTEM_BADGES.filter(b => user.badges.includes(b.id));

  const { passwordHash: _, ...profileWithoutPassword } = user as any;

  res.json({
    user: profileWithoutPassword,
    shelves,
    reviews: userReviews,
    badgesResolved: userBadges
  });
});

// Leaderboard Top Readers
app.get('/api/leaderboard', (req: Request, res: Response) => {
  const allUsers = Object.values(db.getStore().users);
  
  // Sort by count of read books + reviews count
  const sorted = allUsers.map(u => {
    const { passwordHash: _, ...userNoPass } = u as any;
    return {
      ...userNoPass,
      totalActivityScore: u.booksReadCount * 3 + u.reviewsCount * 5 + u.readingStreak * 2
    };
  }).sort((a, b) => b.totalActivityScore - a.totalActivityScore);

  res.json(sorted.slice(0, 10));
});

// Get Public System Badges List
app.get('/api/badges', (req: Request, res: Response) => {
  res.json(SYSTEM_BADGES);
});

// Latest Global Activities
app.get('/api/activities', (req: Request, res: Response) => {
  res.json(db.activities.getAll());
});

// ==========================================
// AI RECOMMENDATION ENGINE (GEMINI INTEGRATION)
// ==========================================

app.post('/api/artificial-intelligence/recommendations', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const user = db.users.getById(req.user.id);
  if (!user) {
    res.status(404).json({ error: 'User profile unresolvable' });
    return;
  }

  const userShelving = db.progress.getByUser(user.id);
  const readBooks = userShelving.filter(p => p.status === 'read').map(p => db.books.getById(p.bookId)?.title).filter(Boolean);
  const currentlyReadingBooks = userShelving.filter(p => p.status === 'currently_reading').map(p => db.books.getById(p.bookId)?.title).filter(Boolean);

  const key = process.env.GEMINI_API_KEY;
  const isKeyUnset = !key || key === 'MY_GEMINI_API_KEY' || key.trim() === '';

  const userGenres = user.favoriteGenres && user.favoriteGenres.length > 0
    ? user.favoriteGenres.join(', ')
    : 'African Literature, Historical Fiction';

  if (isKeyUnset) {
    // Generate high-fidelity heuristic recommendations offline!
    const offlineRecText = `### 🇳🇬 Your Personalized NaijaReads Literary Guide

Since you enjoy **${userGenres}** and have liked books like *${readBooks.length > 0 ? readBooks.join(', ') : 'Things Fall Apart'}*, our local AI curator recommends these brilliant titles from Nigerian and African literature:

1. **Efuru** by Flora Nwapa  
   **Why:** Often celebrated as the first internationally published book by a black African woman, Efuru delves into Igbo culture, independent female entrepreneurship, and divine feminine mysticism. It’s perfect for fans of Chinua Achebe.

2. **The Famished Road** by Ben Okri  
   **Why:** A Booker Prize-winning classic that weaves Yoruba magical realism into a beautiful narrative of a spirit child residing between life and death. If you enjoyed Akata Witch or Freshwater, the surreal imagery here will captivate you.

3. **Buchi Emecheta's works** (e.g. *Second Class Citizen*)  
   **Why:** An deeply moving autobiographical journey following an ambitious young Nigerian woman who fights migration challenges, marital strife, and social barriers in 1960s London to write her way into existence.

*Note: Configure a real **GEMINI_API_KEY** in the AI Studio Secrets panel to activate full-blown deep model suggestions!*`;

    res.json({ recommendationsMarkup: offlineRecText });
    return;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const targetModel = 'gemini-3.5-flash';
    const instructions = `You are a warm, eloquent literary curator specializing in West African, Nigerian, and contemporary African literature.
Your task is to analyze a reader's literary preferences and provide 3 highly specific, beautiful book recommendations.

Reader Context:
- Favorite Genres: ${userGenres}
- Completed Shelley Books: ${readBooks.join(', ') || 'Only Classics (e.g. Things Fall Apart)'}
- Currently Reading: ${currentlyReadingBooks.join(', ') || 'Searching for a new favorite'}
- Bio: ${user.bio || 'Avid Nigerian literature enthusiast.'}

Return a gorgeous, personal markdown-formatted response with:
- A polite, cultural greeting in English or Yoruba/Igbo/Hausa slang (e.g. "Aba! Greetings, Page-turner").
- 3 distinct recommendations. For each book include: Title, Author, Genre, and a descriptive paragraph under "Why you'll love it" emphasizing the stylistic connection to their reading list.
- A closing supportive quote by a famous African author.
Only suggest real, critically acclaimed African or international books. Ensure the layout is highly typographic and neat.`;

    const response = await ai.models.generateContent({
      model: targetModel,
      contents: instructions,
    });

    res.json({ recommendationsMarkup: response.text || 'Unable to generate recommendation at this stage.' });
  } catch (error) {
    console.error('Gemini Recommendation Error:', error);
    res.status(500).json({ error: 'AI server encountered a generation issue.', details: String(error) });
  }
});

// ==========================================
// VITE DEV MIDDLEWARE & ASSET SERVING
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[NaijaReads] Server running successfully on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start NaijaReads Server:', err);
});
