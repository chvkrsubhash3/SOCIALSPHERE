'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, TrendingUp, Users, Hash, Flame } from 'lucide-react';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function ExplorePage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const isTraining = process.env.NEXT_PUBLIC_MODE === 'training';

  const handleSearch = async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const [users, posts] = await Promise.all([
        api.get('/search/users', { params: { q } }),
        api.get('/search/posts', { params: { q } }),
      ]);
      setResults([
        ...users.data.users.map((u: any) => ({ ...u, type: 'user' })),
        ...posts.data.posts.map((p: any) => ({ ...p, type: 'post' })),
      ]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => handleSearch(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-white">Explore</h1>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search posts, people, hashtags..."
          className="input-dark pl-12 text-base py-4"
        />
        {isTraining && (
          <div className="text-xs text-amber-400 mt-1.5 flex items-center gap-1">
            ⚠️ Reflected XSS lab: try <code className="text-amber-300">{"<img src=x onerror=alert(1)>"}</code>
          </div>
        )}
      </div>

      {/* Search results */}
      {results.length > 0 ? (
        <div className="space-y-3">
          {results.map((result) => (
            <div key={`${result.type}-${result.id}`} className="glass-card p-4">
              {result.type === 'user' ? (
                <Link href={`/profile/${result.username}`} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center text-white font-bold">
                    {result.display_name?.[0] || 'U'}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{result.display_name}</div>
                    <div className="text-sm text-gray-500">@{result.username}</div>
                  </div>
                  <div className="ml-auto tag">user</div>
                </Link>
              ) : (
                <Link href={`/posts/${result.id}`}>
                  {/* ⚠️ VULN: Reflected XSS in search result rendering */}
                  {isTraining ? (
                    <p className="text-white text-sm" dangerouslySetInnerHTML={{ __html: result.content }} />
                  ) : (
                    <p className="text-white text-sm">{result.content}</p>
                  )}
                  <div className="text-xs text-gray-500 mt-1">by @{result.username}</div>
                </Link>
              )}
            </div>
          ))}
        </div>
      ) : !query ? (
        /* Default explore content */
        <div className="space-y-6">
          {/* Trending topics */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-brand-400" />
              <h2 className="text-base font-bold text-white">Trending Now</h2>
            </div>
            <div className="space-y-3">
              {[
                { tag: 'cybersecurity', posts: '12,400', hot: true },
                { tag: 'webdev', posts: '8,900', hot: false },
                { tag: 'bugbounty', posts: '6,200', hot: true },
                { tag: 'programming', posts: '5,100', hot: false },
                { tag: 'startup', posts: '4,800', hot: false },
              ].map((item, i) => (
                <motion.div
                  key={item.tag}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between py-2 hover:bg-surface-3/50 px-2 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 text-sm font-bold">#{i + 1}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">#{item.tag}</span>
                        {item.hot && <Flame className="w-3.5 h-3.5 text-orange-400" />}
                      </div>
                      <div className="text-xs text-gray-500">{item.posts} posts</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* People to discover */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-accent-purple" />
              <h2 className="text-base font-bold text-white">People to Discover</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {['alice', 'bob', 'charlie', 'diana'].map((user) => (
                <Link key={user} href={`/profile/${user}`}>
                  <div className="p-3 rounded-xl hover:bg-surface-3/50 transition-colors text-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center text-white font-bold text-lg mx-auto mb-2">
                      {user[0].toUpperCase()}
                    </div>
                    <div className="text-sm font-semibold text-white">@{user}</div>
                    <button className="mt-2 text-xs px-3 py-1 rounded-full text-brand-400 border border-brand-500/30 hover:bg-brand-500/10 transition-colors">
                      Follow
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
