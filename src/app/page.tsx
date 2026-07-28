'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Zap, Globe, Users, MessageSquare, TrendingUp } from 'lucide-react';

// ─────────────────────────────────────────────
// Landing Page
// ─────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] overflow-hidden">

      {/* ─── Background Effects ─── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-purple/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-pink/5 rounded-full blur-3xl" />
      </div>

      {/* ─── Header ─── */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">SocialSphere</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <Link
            href="/login"
            className="px-5 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="btn-brand text-sm"
          >
            Get Started Free
          </Link>
        </motion.div>
      </header>

      {/* ─── Hero ─── */}
      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-24 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-sm font-medium"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8' }}>
            <Zap className="w-4 h-4" />
            The social platform built for the future
          </div>

          {/* Headline */}
          <h1 className="text-6xl md:text-8xl font-black text-white leading-[1.05] mb-6">
            Connect with
            <br />
            <span className="text-gradient">your world</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Share moments, build communities, and discover content that matters to you.
            SocialSphere brings people together in a meaningful way.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="btn-brand text-base px-8 py-3.5">
              Create Free Account
            </Link>
            <Link
              href="/explore"
              className="px-8 py-3.5 rounded-xl text-base font-semibold text-white transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              Explore Content
            </Link>
          </div>
        </motion.div>

        {/* ─── Stats ─── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-24"
        >
          {[
            { label: 'Active Users', value: '2.4M+' },
            { label: 'Posts Daily', value: '18M+' },
            { label: 'Communities', value: '140K+' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl font-black text-gradient mb-1">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* ─── Feature Grid ─── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32"
        >
          {[
            {
              icon: Users,
              title: 'Real Connections',
              desc: 'Follow friends, discover communities, and engage with people who share your interests.',
              color: 'from-brand-500 to-accent-purple',
            },
            {
              icon: MessageSquare,
              title: 'Private Messaging',
              desc: 'End-to-end encrypted direct messages and group chats for meaningful conversations.',
              color: 'from-accent-purple to-accent-pink',
            },
            {
              icon: TrendingUp,
              title: 'Trending Explore',
              desc: 'Discover viral content, trending hashtags, and creators you\'ll love.',
              color: 'from-accent-pink to-accent-amber',
            },
            {
              icon: Shield,
              title: 'Privacy First',
              desc: 'Granular privacy controls for every post. You decide who sees your content.',
              color: 'from-accent-cyan to-brand-500',
            },
            {
              icon: Globe,
              title: 'Communities',
              desc: 'Create or join communities around any topic. Build your tribe.',
              color: 'from-accent-emerald to-accent-cyan',
            },
            {
              icon: Zap,
              title: 'Live Stories',
              desc: '24-hour stories, live video, and interactive polls to engage your audience.',
              color: 'from-accent-amber to-accent-pink',
            },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="glass-card p-6 group"
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* ─── CTA Bottom ─── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-32"
        >
          <div className="glass-card p-12 inline-block w-full max-w-3xl"
            style={{ border: '1px solid rgba(99,102,241,0.2)' }}>
            <h2 className="text-4xl font-black text-white mb-4">
              Ready to join the <span className="text-gradient">sphere</span>?
            </h2>
            <p className="text-gray-400 mb-8">
              Join millions of people sharing, connecting, and building together.
            </p>
            <Link href="/register" className="btn-brand text-base px-10 py-4">
              Join SocialSphere — It&apos;s Free
            </Link>
          </div>
        </motion.div>
      </main>

      {/* ─── Footer ─── */}
      <footer className="relative z-10 border-t border-border py-8 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Globe className="w-4 h-4" />
            <span>© 2024 SocialSphere. Built for cybersecurity education.</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/lab" className="hover:text-white transition-colors text-amber-400">🔬 Lab</Link>
            <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
