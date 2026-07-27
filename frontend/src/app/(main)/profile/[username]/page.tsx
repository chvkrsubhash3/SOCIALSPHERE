'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import {
  Camera, MapPin, Link as LinkIcon, Calendar, Settings,
  Grid, Film, Heart, Bookmark, Users, Verified,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatDistanceToNow } from 'date-fns';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuthStore();
  const [profile, setProfile] = useState<any | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'media' | 'liked'>('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const isTraining = process.env.NEXT_PUBLIC_MODE === 'training';

  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get(`/users/${username}/profile`);
        setProfile(response.data.user);
        setIsFollowing(response.data.user.isFollowing);

        if (isTraining) {
          // ⚠️ Lab: Check if sensitive data is in the response
          console.log('🔍 Lab V47 — Check this response for sensitive data:', response.data.user);
        }
      } catch {
        setProfile(null);
      }
    };
    loadProfile();
  }, [username]);

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await api.delete(`/follow/${profile?.id}`);
      } else {
        await api.post(`/follow/${profile?.id}`);
      }
      setIsFollowing(!isFollowing);
    } catch {}
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* ─── Cover Photo ─── */}
      <div className="h-48 rounded-2xl overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81, #4c1d95)' }}>
        <div className="absolute inset-0 flex items-center justify-center opacity-10 text-[200px] font-black text-white select-none">
          {profile.displayName?.[0]}
        </div>
      </div>

      {/* ─── Profile Info ─── */}
      <div className="px-2 -mt-16 mb-6">
        <div className="flex items-end justify-between mb-4">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full border-4 border-[#0a0a0f] bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center text-white text-3xl font-black">
            {profile.displayName?.[0] || profile.username?.[0]}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-16">
            {isOwnProfile ? (
              <button className="px-5 py-2 rounded-xl text-sm font-semibold text-white border border-border hover:bg-surface-3 transition-colors">
                Edit Profile
              </button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleFollow}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  isFollowing
                    ? 'text-white border border-border hover:bg-surface-3 hover:border-red-500/30 hover:text-red-400'
                    : 'btn-brand'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </motion.button>
            )}
            <button className="p-2 rounded-xl border border-border text-gray-500 hover:text-white hover:bg-surface-3 transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Name and username */}
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white">{profile.displayName}</h1>
            {profile.isVerified && (
              <div className="w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center">
                <Verified className="w-3 h-3 text-white" />
              </div>
            )}
            {profile.role !== 'user' && (
              <span className={`tag text-[11px] ${
                profile.role === 'admin' ? 'text-amber-400 border-amber-500/20 bg-amber-500/10' : ''
              }`}>
                {profile.role}
              </span>
            )}
          </div>
          <div className="text-gray-500">@{profile.username}</div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-white text-sm leading-relaxed mb-3">{profile.bio}</p>
        )}

        {/* Meta info */}
        <div className="flex items-center flex-wrap gap-4 text-sm text-gray-500 mb-4">
          {profile.website && (
            <a href={profile.website} className="flex items-center gap-1 text-brand-400 hover:text-brand-300 transition-colors">
              <LinkIcon className="w-3.5 h-3.5" />
              {profile.website.replace('https://', '')}
            </a>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6">
          {[
            { label: 'Following', value: profile.followingCount || 0 },
            { label: 'Followers', value: profile.followersCount || 0 },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-1.5 cursor-pointer hover:opacity-75 transition-opacity">
              <span className="font-black text-white text-base">{stat.value.toLocaleString()}</span>
              <span className="text-gray-500 text-sm">{stat.label}</span>
            </div>
          ))}

          {/* Sensitive data exposure lab */}
          {isTraining && isOwnProfile && (
            <div className="ml-auto text-xs text-amber-400 flex items-center gap-1">
              ⚠️ V47: Check <code>/api/users/{username}/profile</code> response
            </div>
          )}
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <div className="flex border-b border-border mb-6">
        {[
          { id: 'posts', icon: Grid, label: 'Posts' },
          { id: 'media', icon: Film, label: 'Media' },
          { id: 'liked', icon: Heart, label: 'Liked' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-gray-500 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Posts Grid ─── */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center text-gray-500 py-16">
            <div className="text-4xl mb-3">📭</div>
            <div className="font-semibold text-white">No posts yet</div>
            <div className="text-sm mt-1">
              {isOwnProfile ? 'Share your first post!' : `@${username} hasn't posted yet`}
            </div>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="glass-card p-4">
              <p className="text-white text-sm">{post.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
