'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Flag, Trophy, BookOpen, Zap, Target, Shield, CheckCircle,
  AlertTriangle, ChevronRight, Star, Users, Clock,
} from 'lucide-react';

const MODULES = [
  {
    id: 'injection',
    title: 'Injection Attacks',
    icon: '💉',
    color: 'from-red-500/20 to-red-600/10',
    border: 'border-red-500/20',
    vulns: ['SQL Injection', 'Command Injection', 'LDAP Injection', 'SSTI'],
    progress: 0,
    total: 6,
  },
  {
    id: 'xss',
    title: 'Cross-Site Scripting',
    icon: '🖥️',
    color: 'from-orange-500/20 to-orange-600/10',
    border: 'border-orange-500/20',
    vulns: ['Stored XSS', 'Reflected XSS', 'DOM XSS'],
    progress: 0,
    total: 3,
  },
  {
    id: 'auth',
    title: 'Authentication Attacks',
    icon: '🔐',
    color: 'from-yellow-500/20 to-yellow-600/10',
    border: 'border-yellow-500/20',
    vulns: ['JWT Bypass', 'Brute Force', 'Session Fixation', 'Account Takeover'],
    progress: 0,
    total: 8,
  },
  {
    id: 'access',
    title: 'Access Control',
    icon: '🚪',
    color: 'from-purple-500/20 to-purple-600/10',
    border: 'border-purple-500/20',
    vulns: ['IDOR', 'Broken Access Control', 'Privilege Escalation', 'CSRF'],
    progress: 0,
    total: 5,
  },
  {
    id: 'server',
    title: 'Server-Side Attacks',
    icon: '🔎',
    color: 'from-cyan-500/20 to-cyan-600/10',
    border: 'border-cyan-500/20',
    vulns: ['SSRF', 'XXE', 'File Upload', 'Path Traversal'],
    progress: 0,
    total: 8,
  },
  {
    id: 'business',
    title: 'Business Logic',
    icon: '⚙️',
    color: 'from-pink-500/20 to-pink-600/10',
    border: 'border-pink-500/20',
    vulns: ['Race Conditions', 'Negative Amounts', 'Self-Purchase'],
    progress: 0,
    total: 5,
  },
];

export default function LabPage() {
  const [totalFlags, setTotalFlags] = useState(0);
  const [totalPossible] = useState(50);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* ─── Header ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-medium"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24' }}>
          <Flag className="w-4 h-4" />
          Training Mode Active
        </div>

        <h1 className="text-5xl font-black text-white mb-4">
          <span className="text-gradient">SocialSphere</span>
          <br />CTF Laboratory
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          An intentionally vulnerable social media platform for hands-on cybersecurity training.
          Find the flags, learn the techniques, become the defender.
        </p>

        {/* Stats bar */}
        <div className="flex items-center justify-center gap-8 mt-8">
          {[
            { icon: Flag, label: 'Flags', value: `${totalFlags}/${totalPossible}`, color: 'text-amber-400' },
            { icon: Trophy, label: 'Points', value: '0', color: 'text-emerald-400' },
            { icon: Target, label: 'Challenges', value: '50', color: 'text-brand-400' },
            { icon: Users, label: 'Hackers', value: '1,247', color: 'text-accent-purple' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ─── Quick Start ─── */}
      <div className="glass-card p-6" style={{ border: '1px solid rgba(245,158,11,0.2)' }}>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          Quick Start Guide
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { step: '1', title: 'Navigate to a page', desc: 'Go to any social media page — Login, Feed, Profile, etc.' },
            { step: '2', title: 'Find the vulnerability', desc: 'Use the hints provided to discover the attack vector' },
            { step: '3', title: 'Submit the flag', desc: 'Enter the flag (SS{...}) in the CTF panel to score points' },
          ].map((item) => (
            <div key={item.step} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 font-black text-sm flex items-center justify-center mb-3">
                {item.step}
              </div>
              <div className="font-semibold text-white text-sm mb-1">{item.title}</div>
              <div className="text-xs text-gray-500">{item.desc}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 rounded-xl text-xs" style={{ background: 'rgba(245,158,11,0.08)', color: '#fbbf24' }}>
          💡 <strong>Tip:</strong> All flags are in the format <code className="bg-black/20 px-1 py-0.5 rounded">SS&#123;flag_text_here&#125;</code>
        </div>
      </div>

      {/* ─── Module Grid ─── */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Vulnerability Modules</h2>
        <div className="grid grid-cols-2 gap-4">
          {MODULES.map((module, i) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`glass-card p-5 cursor-pointer group hover:-translate-y-0.5 transition-all border ${module.border}`}
              style={{ background: `linear-gradient(145deg, ${module.color.split(' ')[0].replace('from-', '').replace('/', ' ')})` }}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{module.icon}</span>
                <div className="text-right">
                  <div className="text-xs text-gray-500">{module.progress}/{module.total} flags</div>
                  <div className="h-1.5 w-20 bg-surface-3 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full transition-all"
                      style={{ width: `${(module.progress / module.total) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <h3 className="font-bold text-white mb-2">{module.title}</h3>
              <div className="flex flex-wrap gap-1">
                {module.vulns.slice(0, 3).map((v) => (
                  <span key={v} className="text-[10px] px-2 py-0.5 rounded-full text-gray-400"
                    style={{ background: 'rgba(255,255,255,0.05)' }}>
                    {v}
                  </span>
                ))}
                {module.vulns.length > 3 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full text-gray-500"
                    style={{ background: 'rgba(255,255,255,0.05)' }}>
                    +{module.vulns.length - 3} more
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ─── Leaderboard ─── */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          Leaderboard
        </h2>
        <div className="space-y-2">
          {[
            { rank: 1, name: 'h4ck3r_pro', points: 4850, flags: 32 },
            { rank: 2, name: 'securitywitch', points: 3200, flags: 24 },
            { rank: 3, name: 'null_pointer', points: 2750, flags: 20 },
            { rank: 4, name: 'buffer_overflow', points: 2100, flags: 16 },
            { rank: 5, name: 'xss_queen', points: 1800, flags: 14 },
          ].map((entry) => (
            <div key={entry.rank} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-3/50 transition-colors">
              <div className={`w-6 text-center font-black text-sm ${
                entry.rank === 1 ? 'text-amber-400' :
                entry.rank === 2 ? 'text-gray-300' :
                entry.rank === 3 ? 'text-orange-400' : 'text-gray-500'
              }`}>
                #{entry.rank}
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center text-white text-xs font-bold">
                {entry.name[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">{entry.name}</div>
                <div className="text-xs text-gray-500">{entry.flags} flags found</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-emerald-400">{entry.points.toLocaleString()}</div>
                <div className="text-xs text-gray-500">pts</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
