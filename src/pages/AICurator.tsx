import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { motion } from 'motion/react';
import { Sparkles, Compass, AlertCircle, Quote, Star, BookOpen, Send } from 'lucide-react';

export default function AICurator() {
  const { user } = useAuth();
  
  const [recommendations, setRecommendations] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchRecommendations = async () => {
    if (!user) {
      setError('Please sign in or create an account to activate your personal AI Curator!');
      return;
    }
    
    setError('');
    setLoading(true);
    setRecommendations('');

    try {
      const data = await api.ai.recommend();
      setRecommendations(data.recommendationsMarkup);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'AI engine is currently rebooting. Please try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  // Safe custom simple parser to render Markdown beautifully on a dark canvas
  const parseMarkdownToJsx = (markdownText: string) => {
    if (!markdownText) return null;
    
    const lines = markdownText.split('\n');
    return lines.map((line, idx) => {
      // H3 Headers
      if (line.startsWith('###')) {
        return (
          <h3 key={idx} className="text-xl font-bold text-white mt-6 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            {line.replace('###', '').trim()}
          </h3>
        );
      }
      
      // H2 Headers
      if (line.startsWith('##')) {
        return (
          <h2 key={idx} className="text-2xl font-extrabold text-emerald-400 tracking-tight mt-8 mb-4 border-b border-emerald-950 pb-2">
            {line.replace('##', '').trim()}
          </h2>
        );
      }

      // Blockquote quotes
      if (line.startsWith('*Note:') || line.startsWith('*')) {
        if (line.includes('Note:')) {
          return (
            <div key={idx} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-xs text-zinc-400 italic leading-relaxed my-4">
              {line.replace(/\*|Note:/g, '').trim()}
            </div>
          );
        }
      }

      // Standard list items with bolding
      if (line.trim().match(/^\d+\./) || line.trim().startsWith('-')) {
        const text = line.replace(/^\d+\.|\-/, '').trim();
        // Check for bold double asterisks **title**
        const boldMatch = text.match(/\*\*(.*?)\*\*(.*)/);
        
        if (boldMatch) {
          return (
            <div key={idx} className="bg-zinc-900/40 border border-zinc-900 p-4 rounded-2xl mb-3 space-y-1">
              <span className="font-extrabold text-zinc-100 text-sm block">
                {boldMatch[1]}
              </span>
              <p className="text-zinc-400 text-xs leading-relaxed">
                {boldMatch[2].replace(/\*\*|:/g, '').trim()}
              </p>
            </div>
          );
        }
        
        return (
          <li key={idx} className="text-zinc-300 text-xs py-1 leading-relaxed">
            {text}
          </li>
        );
      }

      // Fallback standard paragraphs with inline bold matching
      if (line.trim() === '') return <div key={idx} className="h-2" />;
      
      const inlineBoldParts = line.split('**');
      if (inlineBoldParts.length > 1) {
        return (
          <p key={idx} className="text-zinc-300 text-xs leading-relaxed my-2">
            {inlineBoldParts.map((part, pIdx) => 
              pIdx % 2 === 1 ? <strong key={pIdx} className="text-emerald-400 font-bold">{part}</strong> : part
            )}
          </p>
        );
      }

      return (
        <p key={idx} className="text-zinc-300 text-xs leading-relaxed my-2">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 pb-16 text-left">
      {/* Introduction banner */}
      <section className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl" />
        
        <div className="flex gap-4 items-start relative z-10">
          <div className="bg-emerald-600 p-2.5 rounded-2xl shrink-0 hidden sm:block shadow-md">
            <Compass className="w-6 h-6 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">AI Literary Curator</h1>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Unlock highly personalized book recommendations from across classic Nigerian literature and modern African writers. Our algorithm parses your reading logs and genre preferences to chart a dynamic suggestions roadmap.
            </p>
          </div>
        </div>
      </section>

      {/* Main operational view */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left column: Quick user stats summary */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-5 h-fit space-y-4">
          <h3 className="font-extrabold text-white text-sm uppercase tracking-wide">Reader Context</h3>
          
          {user ? (
            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-2.5 p-2 bg-zinc-900 border border-zinc-800 rounded-xl">
                <img
                  src={user.avatarUrl}
                  alt={user.displayName}
                  className="w-8 h-8 rounded-lg object-cover"
                />
                <div>
                  <span className="font-bold text-white block">{user.displayName}</span>
                  <span className="text-zinc-500">@{user.username}</span>
                </div>
              </div>

              <div className="space-y-1 bg-zinc-900/40 p-3 rounded-xl border border-zinc-900">
                <span className="text-zinc-500 font-bold block">Favored Genres</span>
                <p className="text-zinc-300 font-medium">
                  {user.favoriteGenres && user.favoriteGenres.length > 0
                    ? user.favoriteGenres.join(', ')
                    : 'African Literature, classic historical books'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-900">
                  <span className="text-zinc-500 font-bold block mb-0.5">Read</span>
                  <strong className="text-white text-lg">{user.booksReadCount || 0}</strong>
                </div>
                <div className="bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-900">
                  <span className="text-zinc-500 font-bold block mb-0.5">Streak</span>
                  <strong className="text-amber-500 text-lg flex items-center justify-center gap-0.5">
                    ● {user.readingStreak || 0}
                  </strong>
                </div>
              </div>

              <button
                onClick={fetchRecommendations}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-3 rounded-2l transition-all shadow-md mt-2 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-[11px] uppercase tracking-wider rounded-xl"
              >
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                {loading ? 'Consulting Curator...' : 'Request Recommendations'}
              </button>
            </div>
          ) : (
            <div className="text-center py-6 space-y-3">
              <AlertCircle className="w-8 h-8 text-zinc-650 mx-auto" />
              <p className="text-zinc-500 text-xs leading-relaxed">
                Connect your user profile to activate personal, context-aware AI curation!
              </p>
            </div>
          )}
        </div>

        {/* Right column: Curated results markdown panel */}
        <div className="md:col-span-2 bg-zinc-950 border border-zinc-900 rounded-3xl p-6 min-h-[340px] flex flex-col justify-between">
          
          {loading ? (
            <div className="space-y-4 animate-pulse flex-1 flex flex-col justify-center">
              <div className="h-5 bg-zinc-900 rounded-lg w-1/3" />
              <div className="space-y-2">
                <div className="h-3 bg-zinc-900 rounded w-full" />
                <div className="h-3 bg-zinc-900 rounded w-11/12" />
                <div className="h-3 bg-zinc-900 rounded w-4/5" />
              </div>
              <div className="h-44 bg-zinc-905 border border-zinc-900 rounded-2xl w-full" />
            </div>
          ) : recommendations ? (
            <div className="space-y-2 text-zinc-300">
              {parseMarkdownToJsx(recommendations)}
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-rose-950/20 border border-rose-900/40 rounded-2xl">
              <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
              <h4 className="text-rose-200 font-bold text-sm">Curation Error</h4>
              <p className="text-rose-400 text-xs mt-1 max-w-sm">{error}</p>
              <button
                onClick={fetchRecommendations}
                className="mt-3 bg-rose-900/30 text-rose-200 hover:bg-rose-900/50 border border-rose-800 text-[10px] uppercase font-bold tracking-wider px-4 py-2 rounded-lg"
              >
                Retry request
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-500 py-10">
              <Sparkles className="w-10 h-10 text-emerald-500 animate-bounce mb-3" />
              <h4 className="text-zinc-300 font-bold text-sm">Ask the Literary Advisor</h4>
              <p className="text-zinc-550 text-xs max-w-sm mt-1 leading-relaxed">
                Click "Request Recommendations" to scan libraries and receive professional literature matches and explanations.
              </p>
            </div>
          )}

          {/* Prompt guide notes */}
          <div className="mt-6 pt-4 border-t border-zinc-900 text-[10px] text-zinc-500 flex items-center justify-between">
            <span>Powered by Gemini 3.5 Flash Model</span>
            <span>Refreshes dynamically with your logs</span>
          </div>
        </div>

      </section>
    </div>
  );
}
