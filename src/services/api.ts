import { User, Book, Review, ReadingProgress, Activity, SearchFilters } from '../types.ts';

const BASE_URL = '/api';

let tokenCache = localStorage.getItem('naijareads_token') || '';

export const api = {
  getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (tokenCache) {
      headers['Authorization'] = `Bearer ${tokenCache}`;
    }
    return headers;
  },

  setToken(token: string) {
    tokenCache = token;
    if (token) {
      localStorage.setItem('naijareads_token', token);
    } else {
      localStorage.removeItem('naijareads_token');
    }
  },

  getToken() {
    return tokenCache;
  },

  auth: {
    async register(payload: any) {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: api.getHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      api.setToken(data.token);
      return data;
    },

    async login(payload: any) {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: api.getHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      api.setToken(data.token);
      return data;
    },

    async me() {
      if (!tokenCache) return null;
      const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: api.getHeaders(),
      });
      if (res.status === 401 || res.status === 403) {
        api.setToken('');
        return null;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch user');
      return data;
    },

    async update(payload: any) {
      const res = await fetch(`${BASE_URL}/auth/update`, {
        method: 'PUT',
        headers: api.getHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user');
      return data;
    },

    logout() {
      api.setToken('');
    }
  },

  books: {
    async list(filters: Partial<SearchFilters>) {
      const params = new URLSearchParams();
      if (filters.query) params.append('search', filters.query);
      if (filters.genre) params.append('genre', filters.genre);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);

      const res = await fetch(`${BASE_URL}/books?${params.toString()}`, {
        headers: api.getHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to list books');
      return data as Book[];
    },

    async get(id: string) {
      const res = await fetch(`${BASE_URL}/books/${id}`, {
        headers: api.getHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get book');
      return data as { book: Book; reviews: Review[] };
    },

    async setStatus(id: string, payload: { status: string; currentPage?: number; totalPages?: number; notes?: string }) {
      const res = await fetch(`${BASE_URL}/books/${id}/status`, {
        method: 'POST',
        headers: api.getHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update reading status');
      return data;
    },

    async getUserBookStatus(bookId: string) {
      if (!tokenCache) return { status: null, detail: null };
      const res = await fetch(`${BASE_URL}/users/me/books/${bookId}/status`, {
        headers: api.getHeaders(),
      });
      if (!res.ok) return { status: null, detail: null };
      return await res.json();
    },

    async adminAdd(payload: any) {
      const res = await fetch(`${BASE_URL}/admin/books`, {
        method: 'POST',
        headers: api.getHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add book');
      return data as Book;
    }
  },

  reviews: {
    async add(payload: { bookId: string; rating: number; title: string; body: string; isSpoiler: boolean; favoriteQuote?: string }) {
      const res = await fetch(`${BASE_URL}/reviews`, {
        method: 'POST',
        headers: api.getHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit review');
      return data;
    },

    async toggleLike(reviewId: string) {
      const res = await fetch(`${BASE_URL}/reviews/${reviewId}/like`, {
        method: 'POST',
        headers: api.getHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to like/unlike review');
      return data;
    },

    async comment(reviewId: string, body: string) {
      const res = await fetch(`${BASE_URL}/reviews/${reviewId}/comment`, {
        method: 'POST',
        headers: api.getHeaders(),
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to comment');
      return data;
    }
  },

  users: {
    async getProfile(username: string) {
      const res = await fetch(`${BASE_URL}/users/${username}`, {
        headers: api.getHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load user profile');
      return data as { user: User; shelves: { read: any[]; currently_reading: any[]; want_to_read: any[] }; reviews: any[]; badgesResolved: any[] };
    },

    async getLeaderboard() {
      const res = await fetch(`${BASE_URL}/leaderboard`, {
        headers: api.getHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load leaderboard');
      return data;
    }
  },

  activities: {
    async list() {
      const res = await fetch(`${BASE_URL}/activities`, {
        headers: api.getHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch activity feed');
      return data as Activity[];
    }
  },

  badges: {
    async list() {
      const res = await fetch(`${BASE_URL}/badges`, {
        headers: api.getHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to list badges');
      return data;
    }
  },

  ai: {
    async recommend() {
      const res = await fetch(`${BASE_URL}/artificial-intelligence/recommendations`, {
        method: 'POST',
        headers: api.getHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate recommendations');
      return data as { recommendationsMarkup: string };
    }
  }
};
