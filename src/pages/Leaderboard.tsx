import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.ts';
import { Trophy, Star, Shield, Flame, Medal, Compass, Award, ExternalLink } from 'lucide-react';

interface LeaderboardUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  readingRank: string;
  booksReadCount: number;
  reviewsCount: number;
  readingStreak: number;
  totalActivityScore: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: string;
}

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const lb = await api.users.getLeaderboard();
        setLeaderboard(lb);

        const bList = await api.badges.list();
        setBadges(bList);
      } catch (err) {
        console.error('Leaderboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#C05E42] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[#5A5A40] text-sm">Calculating leaderboard ranks and polishing achievements...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 pb-16 pt-6 text-left">
      {/* Banner introduction styled with Natural Tones sand & clay */}
      <section className="bg-[#EAE7DE] border border-[#DCD9CE] rounded-[32px] p-6 md:p-8 relative overflow-hidden shadow-sm animate-fade-in">
        <div className="absolute right-[-40px] bottom-[-40px] w-48 h-48 bg-[#C05E42] rounded-full opacity-5 mix-blend-multiply" />
        <div className="flex gap-4 items-start relative z-10">
          <div className="bg-[#C05E42] p-2.5 rounded-2xl shrink-0 hidden sm:block shadow-sm border border-[#C05E42]/10">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-serif italic text-[#1A1A1A]">Trophy Circle & Leaderboard</h1>
            <p className="text-[#5A5A40] text-sm leading-relaxed max-w-4xl font-medium">
              Earn cultural titles and custom badges by tracking your reading progress, keeping a daily logging streak, and leaving thoughtful reviews for Nigerian and African writers.
            </p>
          </div>
        </div>
      </section>

      {/* Ranks & Leaderboard lists */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Leaderboard Table - 2 Columns */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-[#EAE7DE] pb-3">
            <h2 className="text-xl font-serif italic font-bold text-[#1A1A1A] flex items-center gap-2.5">
              <Shield className="text-[#C05E42] w-5 h-5" />
              Community Top Readers
            </h2>
            <span className="text-xs text-[#5A5A40]/70 font-semibold uppercase tracking-wider">Experience points basis</span>
          </div>

          <div className="bg-white border border-[#EAE7DE] rounded-[32px] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F5F2ED] border-b border-[#EAE7DE] text-[#5A5A40] font-bold uppercase tracking-widest text-[10px]">
                    <th className="py-4 px-5 w-16 text-center">Rank</th>
                    <th className="py-4 px-4">Reader Details</th>
                    <th className="py-4 px-4 text-center">Completed</th>
                    <th className="py-4 px-4 text-center">Reviews</th>
                    <th className="py-4 px-4 text-center text-[#C05E42]">Streak</th>
                    <th className="py-4 px-5 text-right text-[#C05E42]">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2EFE8]">
                  {leaderboard.map((u, index) => {
                    const isTopThree = index < 3;
                    const placeColors = [
                      'bg-[#C05E42] text-white border-[#C05E42] shadow-sm',
                      'bg-[#5A5A40] text-white border-[#5A5A40] shadow-sm',
                      'bg-[#EAE7DE] text-[#1A1A1A] border-[#DCD9CE] shadow-sm'
                    ];
                    return (
                      <tr key={u.id} className="hover:bg-[#FDFCF8] transition-colors">
                        {/* Custom rank badge */}
                        <td className="py-4 px-5 text-center">
                          {isTopThree ? (
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black border ${placeColors[index]}`}>
                              {index + 1}
                            </span>
                          ) : (
                            <span className="text-[#5A5A40] font-bold">{index + 1}</span>
                          )}
                        </td>

                        {/* Public profiles metrics */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={u.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&h=100'}
                              alt={u.displayName}
                              referrerPolicy="no-referrer"
                              className="w-9 h-9 rounded-full object-cover border border-[#EAE7DE] bg-[#F5F2ED] shrink-0 shadow-sm"
                            />
                            <div className="min-w-0">
                              <Link
                                to={`/profile/${u.username}`}
                                className="font-bold text-[#1A1A1A] hover:text-[#C05E42] text-sm flex items-center gap-1.5 transition-colors"
                              >
                                {u.displayName}
                                <ExternalLink className="w-3 h-3 text-gray-300" />
                              </Link>
                              <span className="text-[10px] text-gray-400 block font-normal">{u.readingRank}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 text-center text-gray-700 font-semibold">{u.booksReadCount || 0}</td>
                        <td className="py-4 px-4 text-center text-gray-600 font-medium">{u.reviewsCount || 0}</td>
                        <td className="py-4 px-4 text-center text-[#C05E42] font-bold flex items-center justify-center gap-1">
                          <Flame className="w-3.5 h-3.5 fill-red-100" />
                          <span>{u.readingStreak || 0}d</span>
                        </td>
                        <td className="py-4 px-5 text-right font-extrabold text-[#C05E42] text-[13px]">{u.totalActivityScore || 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Available Badges / Achievements list - 1 Column */}
        <div className="space-y-4">
          <div className="flex items-center border-b border-[#EAE7DE] pb-3">
            <h2 className="text-xl font-serif italic font-bold text-[#1A1A1A] flex items-center gap-2.5">
              <Award className="text-[#C05E42] w-5 h-5" />
              Trophy Catalog
            </h2>
          </div>

          <div className="space-y-3.5 overflow-y-auto max-h-[500px] pr-1">
            {badges.map(badge => (
              <div
                key={badge.id}
                className="bg-white border border-[#EAE7DE] rounded-2xl p-4 flex gap-4 hover:border-[#C05E42]/40 hover:shadow-md transition-all text-left shadow-sm"
              >
                <div className="text-3xl p-2 bg-[#F5F2ED] border border-[#EAE7DE] rounded-2xl flex items-center justify-center shrink-0 h-12 w-12 shadow-inner">
                  {badge.icon}
                </div>
                <div className="space-y-1 min-w-0">
                  <h3 className="font-bold text-[#1A1A1A] text-sm tracking-tight">{badge.name}</h3>
                  <p className="text-gray-500 text-[11px] leading-relaxed">{badge.description}</p>
                  <span className="inline-flex text-[9px] uppercase tracking-wider text-[#C05E42] bg-red-50 border border-red-150 font-bold px-2.5 py-0.5 rounded-full mt-1.5 shadow-inner">
                    Goal: {badge.requirement}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </section>
    </div>
  );
}
