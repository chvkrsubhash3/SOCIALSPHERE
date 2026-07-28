'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, MessageCircle, Share2, Bookmark, MoreHorizontal,
  Image, Video, Smile, Send, Globe, Users, Lock, X,
  Repeat2, ChevronDown, Verified,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Post {
  id: number;
  content: string;
  media_urls: string[];
  privacy: 'public' | 'followers' | 'private';
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  user_id: number;
  username: string;
  display_name: string;
  avatar_url: string | null;
  is_liked: boolean;
  is_saved: boolean;
}

// ─────────────────────────────────────────────
// Feed Page
// ─────────────────────────────────────────────
export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const { user } = useAuthStore();

  const isTraining = process.env.NEXT_PUBLIC_MODE === 'training';

  const loadPosts = async (reset = false) => {
    try {
      const params: any = { limit: 10 };
      if (!reset && cursor) params.cursor = cursor;

      const response = await api.get('/posts/feed', { params });
      const { posts: newPosts, nextCursor } = response.data;

      setPosts((prev) => reset ? newPosts : [...prev, ...newPosts]);
      setCursor(nextCursor);
      setHasMore(!!nextCursor);
    } catch {
      toast.error('Failed to load feed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPosts(true);
  }, []);

  return (
    <div className="space-y-6">
      {/* ─── Stories Bar ─── */}
      <StoriesBar />

      {/* ─── Create Post ─── */}
      <CreatePostCard onPost={() => loadPosts(true)} />

      {/* ─── Feed Posts ─── */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full skeleton" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 skeleton rounded-full w-32" />
                  <div className="h-2 skeleton rounded-full w-20" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 skeleton rounded-full" />
                <div className="h-3 skeleton rounded-full w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <AnimatePresence>
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <PostCard
                post={post}
                onLike={() => handleLike(post.id, setPosts)}
                onSave={() => handleSave(post.id, setPosts)}
                isTraining={isTraining}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      {/* Load More */}
      {hasMore && !isLoading && (
        <button
          onClick={() => loadPosts()}
          className="w-full py-3 text-sm text-brand-400 hover:text-brand-300 transition-colors"
        >
          Load more posts ↓
        </button>
      )}

      {!hasMore && posts.length > 0 && (
        <div className="text-center text-sm text-gray-500 py-6">
          You&apos;ve seen all posts! Follow more people to see more. 🎉
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Create Post Card
// ─────────────────────────────────────────────
function CreatePostCard({ onPost }: { onPost: () => void }) {
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'followers' | 'private'>('public');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isTraining = process.env.NEXT_PUBLIC_MODE === 'training';

  const handlePost = async () => {
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await api.post('/posts', { content, privacy });
      setContent('');
      toast.success('Post published! ✨');
      onPost();
    } catch {
      toast.error('Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const privacyIcons = { public: Globe, followers: Users, private: Lock };
  const PrivacyIcon = privacyIcons[privacy];

  return (
    <div className="glass-card p-5">
      <div className="flex gap-4">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center text-white font-bold flex-shrink-0">
          {user?.displayName?.[0] || 'U'}
        </div>

        {/* Input area */}
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening in your world?"
            rows={3}
            className="w-full bg-transparent text-white placeholder-gray-500 resize-none outline-none text-base leading-relaxed"
            // ⚠️ TRAINING: Stored XSS — content rendered as HTML
            // 🔒 SECURE: Content encoded before rendering
          />

          {isTraining && content.includes('<') && (
            <div className="text-xs text-amber-400 mb-2 flex items-center gap-1">
              ⚠️ Lab: HTML detected in content — Stored XSS vulnerable in training mode
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg text-gray-500 hover:text-brand-400 hover:bg-brand-500/10 transition-all">
                <Image className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-lg text-gray-500 hover:text-brand-400 hover:bg-brand-500/10 transition-all">
                <Video className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-lg text-gray-500 hover:text-brand-400 hover:bg-brand-500/10 transition-all">
                <Smile className="w-5 h-5" />
              </button>

              {/* Privacy selector */}
              <div className="relative">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-brand-400 border border-brand-500/30 hover:bg-brand-500/10 transition-all">
                  <PrivacyIcon className="w-3.5 h-3.5" />
                  {privacy.charAt(0).toUpperCase() + privacy.slice(1)}
                </button>
              </div>
            </div>

            {/* Character count */}
            <div className="flex items-center gap-3">
              <span className={`text-xs ${content.length > 280 ? 'text-red-400' : 'text-gray-500'}`}>
                {content.length}/280
              </span>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handlePost}
                disabled={!content.trim() || isSubmitting}
                className="btn-brand px-5 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Posting...' : 'Post'}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Post Card
// ─────────────────────────────────────────────
function PostCard({
  post,
  onLike,
  onSave,
  isTraining,
}: {
  post: Post;
  onLike: () => void;
  onSave: () => void;
  isTraining: boolean;
}) {
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [likeCount, setLikeCount] = useState(post.likes_count);
  const [isSaved, setIsSaved] = useState(post.is_saved);

  const handleLikeClick = async () => {
    setIsLiked(!isLiked);
    setLikeCount((c) => isLiked ? c - 1 : c + 1);
    onLike();
  };

  return (
    <article className="post-card">
      {/* ─── Header ─── */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="story-ring">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center text-white font-bold m-0.5 bg-[#0a0a0f]">
              {post.display_name?.[0] || 'U'}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-white text-sm">{post.display_name}</span>
              <Verified className="w-3.5 h-3.5 text-brand-400" />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span>@{post.username}</span>
              <span>·</span>
              <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
              <span>·</span>
              {post.privacy === 'public' && <Globe className="w-3 h-3" />}
              {post.privacy === 'followers' && <Users className="w-3 h-3" />}
              {post.privacy === 'private' && <Lock className="w-3 h-3" />}
            </div>
          </div>
        </div>

        <button className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-surface-3 transition-all">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* ─── Content ─── */}
      {/* ⚠️ TRAINING: dangerouslySetInnerHTML — Stored XSS execution point */}
      {/* 🔒 SECURE: Use {post.content} as text (no HTML rendering) */}
      <div className="mb-4">
        {isTraining ? (
          <p
            className="text-white leading-relaxed whitespace-pre-wrap"
            // ⚠️ VULN #3: XSS — renders stored HTML
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        ) : (
          <p className="text-white leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
        )}
      </div>

      {/* ─── Hashtags ─── */}
      {post.content && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {(post.content.match(/#[a-zA-Z0-9_]+/g) || []).map((tag) => (
            <span key={tag} className="tag cursor-pointer hover:bg-brand-500/20 transition-colors">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* ─── Action Bar ─── */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-1">
          {/* Like */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleLikeClick}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all text-sm font-medium ${
              isLiked
                ? 'text-rose-500 bg-rose-500/10'
                : 'text-gray-500 hover:text-rose-400 hover:bg-rose-500/10'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            <span>{likeCount > 0 ? likeCount : ''}</span>
          </motion.button>

          {/* Comment */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-gray-500 hover:text-brand-400 hover:bg-brand-500/10 transition-all text-sm font-medium"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{post.comments_count > 0 ? post.comments_count : ''}</span>
          </button>

          {/* Repost */}
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all text-sm font-medium">
            <Repeat2 className="w-4 h-4" />
            <span>{post.shares_count > 0 ? post.shares_count : ''}</span>
          </button>
        </div>

        {/* Bookmark */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onSave}
          className={`p-2 rounded-lg transition-all ${
            isSaved ? 'text-brand-400 bg-brand-500/10' : 'text-gray-500 hover:text-brand-400 hover:bg-brand-500/10'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
        </motion.button>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────
// Stories Bar
// ─────────────────────────────────────────────
function StoriesBar() {
  const stories = [
    { username: 'alice', name: 'Alice', color: 'from-brand-500 to-accent-purple' },
    { username: 'bob', name: 'Bob', color: 'from-accent-pink to-accent-amber' },
    { username: 'diana', name: 'Diana', color: 'from-accent-cyan to-brand-500' },
    { username: 'charlie', name: 'Charlie', color: 'from-accent-emerald to-accent-cyan' },
    { username: 'frank', name: 'Frank', color: 'from-accent-amber to-accent-pink' },
  ];

  return (
    <div className="glass-card p-4">
      <div className="flex gap-4 overflow-x-auto no-scrollbar">
        {/* Your story */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group">
          <div className="relative w-16 h-16">
            <div className="w-16 h-16 rounded-full bg-surface-3 border-2 border-dashed border-brand-500/50 flex items-center justify-center group-hover:border-brand-500 transition-colors">
              <span className="text-2xl font-bold text-brand-400">+</span>
            </div>
          </div>
          <span className="text-[11px] text-gray-400 font-medium">Your story</span>
        </div>

        {/* Other stories */}
        {stories.map((story) => (
          <div key={story.username} className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group">
            <div className="avatar-ring-story">
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${story.color} flex items-center justify-center text-white font-bold text-lg m-0.5`}>
                {story.name[0]}
              </div>
            </div>
            <span className="text-[11px] text-gray-400 font-medium">{story.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
async function handleLike(postId: number, setPosts: React.Dispatch<React.SetStateAction<Post[]>>) {
  try {
    await api.post(`/posts/${postId}/like`);
  } catch {
    toast.error('Failed to like post');
  }
}

async function handleSave(postId: number, setPosts: React.Dispatch<React.SetStateAction<Post[]>>) {
  try {
    await api.post(`/posts/${postId}/save`);
    setPosts((prev) =>
      prev.map((p) => p.id === postId ? { ...p, is_saved: !p.is_saved } : p)
    );
  } catch {
    toast.error('Failed to save post');
  }
}
