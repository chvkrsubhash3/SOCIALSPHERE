'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Home, Search, Bell, MessageSquare, Bookmark, Users,
  ShoppingBag, Globe, Settings, LogOut, PlusSquare, Zap,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Avatar } from '@/components/ui/Avatar';

const navItems = [
  { href: '/feed', icon: Home, label: 'Home' },
  { href: '/explore', icon: Search, label: 'Explore' },
  { href: '/notifications', icon: Bell, label: 'Notifications', badge: true },
  { href: '/messages', icon: MessageSquare, label: 'Messages', badge: true },
  { href: '/bookmarks', icon: Bookmark, label: 'Bookmarks' },
  { href: '/communities', icon: Users, label: 'Communities' },
  { href: '/marketplace', icon: ShoppingBag, label: 'Marketplace' },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* ─── Left Sidebar ─── */}
      <aside className="fixed left-0 top-0 h-full w-64 flex flex-col px-4 py-6 border-r border-border z-40 bg-[#0a0a0f]">
        {/* Logo */}
        <Link href="/feed" className="flex items-center gap-2 px-4 mb-8">
          <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">SocialSphere</span>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={{ x: 2 }}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                >
                  <div className="relative">
                    <item.icon className="w-5 h-5" />
                    {item.badge && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-brand-500 rounded-full text-[10px] flex items-center justify-center text-white">
                        3
                      </span>
                    )}
                  </div>
                  <span>{item.label}</span>
                </motion.div>
              </Link>
            );
          })}

          {/* Admin / Moderator links */}
          {(user?.role === 'admin' || user?.role === 'superadmin') && (
            <Link href="/admin">
              <motion.div whileHover={{ x: 2 }} className="nav-item">
                <Zap className="w-5 h-5 text-amber-400" />
                <span className="text-amber-400">Admin Panel</span>
              </motion.div>
            </Link>
          )}
          {user?.role === 'moderator' && (
            <Link href="/moderator">
              <motion.div whileHover={{ x: 2 }} className="nav-item">
                <Zap className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-400">Mod Dashboard</span>
              </motion.div>
            </Link>
          )}
        </nav>

        {/* ─── Create Post Button ─── */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn-brand flex items-center gap-2 justify-center mb-6 py-3"
          onClick={() => {/* Open create post modal */}}
        >
          <PlusSquare className="w-5 h-5" />
          New Post
        </motion.button>

        {/* ─── User Profile ─── */}
        <div className="border-t border-border pt-4">
          <Link href={`/profile/${user?.username}`}>
            <div className="flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-surface-3 transition-colors cursor-pointer group">
              <Avatar src={user?.avatar} name={user?.displayName || user?.username || ''} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">{user?.displayName}</div>
                <div className="text-xs text-gray-500 truncate">@{user?.username}</div>
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-1 mt-2">
            <Link href="/settings" className="flex-1">
              <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-white hover:bg-surface-3 transition-all">
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main className="flex-1 ml-64 mr-80">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {children}
        </div>
      </main>

      {/* ─── Right Sidebar ─── */}
      <RightSidebar />
    </div>
  );
}

function RightSidebar() {
  const isTraining = process.env.NEXT_PUBLIC_MODE === 'training';

  return (
    <aside className="fixed right-0 top-0 h-full w-80 px-4 py-6 border-l border-border overflow-y-auto no-scrollbar bg-[#0a0a0f]">
      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search SocialSphere..."
          className="input-dark pl-10 text-sm"
        />
      </div>

      {/* Trending */}
      <div className="glass-card p-4 mb-6">
        <h3 className="text-sm font-bold text-white mb-4">Trending</h3>
        <div className="space-y-3">
          {[
            { tag: '#cybersecurity', posts: '12.4K posts' },
            { tag: '#webdev', posts: '8.9K posts' },
            { tag: '#bugbounty', posts: '6.2K posts' },
            { tag: '#photography', posts: '5.1K posts' },
            { tag: '#startup', posts: '4.8K posts' },
          ].map((item) => (
            <Link key={item.tag} href={`/explore?hashtag=${item.tag.slice(1)}`}>
              <div className="flex items-center justify-between py-1.5 hover:opacity-75 transition-opacity cursor-pointer">
                <div>
                  <div className="text-sm font-semibold text-brand-400">{item.tag}</div>
                  <div className="text-xs text-gray-500">{item.posts}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Who to follow */}
      <div className="glass-card p-4 mb-6">
        <h3 className="text-sm font-bold text-white mb-4">Who to follow</h3>
        <div className="space-y-3">
          {[
            { name: 'Alice Johnson', username: 'alice', verified: true },
            { name: 'Bob Martinez', username: 'bob', verified: false },
            { name: 'Diana Patel', username: 'diana', verified: true },
          ].map((user) => (
            <div key={user.username} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center text-white text-sm font-bold">
                {user.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white flex items-center gap-1">
                  {user.name}
                  {user.verified && (
                    <span className="verified-badge"><Check className="w-2 h-2 text-white" /></span>
                  )}
                </div>
                <div className="text-xs text-gray-500">@{user.username}</div>
              </div>
              <button className="text-xs px-3 py-1.5 rounded-full font-medium text-brand-400 border border-brand-500/30 hover:bg-brand-500/10 transition-colors">
                Follow
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Training Mode Lab Summary */}
      {isTraining && (
        <div className="glass-card p-4 border border-amber-500/20"
          style={{ background: 'rgba(245,158,11,0.05)' }}>
          <h3 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2">
            🔬 Lab Summary
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Mode</span>
              <span className="text-amber-400 font-medium">Training (Vulnerable)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Challenges</span>
              <span className="text-white">50 vulnerabilities</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Flags Found</span>
              <span className="text-emerald-400">0 / 25</span>
            </div>
            <Link href="/lab" className="block mt-3 text-center text-xs py-2 rounded-lg text-amber-400 font-medium border border-amber-500/30 hover:bg-amber-500/10 transition-colors">
              Open Lab Panel →
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Check({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  );
}
