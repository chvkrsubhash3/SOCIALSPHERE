'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flag, ChevronDown, ChevronUp, Shield, Zap, Eye, Lock } from 'lucide-react';
import Link from 'next/link';

interface VulnCategory {
  id: string;
  name: string;
  color: string;
  vulns: { id: string; name: string; difficulty: string; flags: number }[];
}

const VULN_CATEGORIES: VulnCategory[] = [
  {
    id: 'injection',
    name: 'Injection',
    color: 'text-red-400',
    vulns: [
      { id: 'V01', name: 'SQL Injection', difficulty: 'easy-expert', flags: 4 },
      { id: 'V02', name: 'Blind SQL Injection', difficulty: 'expert', flags: 1 },
      { id: 'V28', name: 'Command Injection', difficulty: 'expert', flags: 1 },
      { id: 'V30', name: 'LDAP Injection', difficulty: 'hard', flags: 1 },
      { id: 'V38', name: 'NoSQL Injection', difficulty: 'hard', flags: 1 },
    ],
  },
  {
    id: 'xss',
    name: 'Cross-Site Scripting',
    color: 'text-orange-400',
    vulns: [
      { id: 'V03', name: 'Stored XSS', difficulty: 'medium', flags: 1 },
      { id: 'V04', name: 'Reflected XSS', difficulty: 'easy', flags: 1 },
      { id: 'V05', name: 'DOM XSS', difficulty: 'medium', flags: 1 },
    ],
  },
  {
    id: 'auth',
    name: 'Authentication',
    color: 'text-yellow-400',
    vulns: [
      { id: 'V07', name: 'Broken Authentication', difficulty: 'medium', flags: 2 },
      { id: 'V08', name: 'JWT Vulnerabilities', difficulty: 'medium-hard', flags: 2 },
      { id: 'V23', name: 'Session Fixation', difficulty: 'hard', flags: 1 },
      { id: 'V25', name: 'OAuth Misconfiguration', difficulty: 'hard', flags: 1 },
      { id: 'V50', name: 'Account Takeover', difficulty: 'hard', flags: 1 },
    ],
  },
  {
    id: 'access',
    name: 'Access Control',
    color: 'text-purple-400',
    vulns: [
      { id: 'V09', name: 'IDOR', difficulty: 'easy-medium', flags: 3 },
      { id: 'V10', name: 'Broken Access Control', difficulty: 'hard', flags: 1 },
      { id: 'V49', name: 'Privilege Escalation', difficulty: 'hard-expert', flags: 2 },
    ],
  },
  {
    id: 'server',
    name: 'Server-Side',
    color: 'text-cyan-400',
    vulns: [
      { id: 'V12', name: 'SSRF', difficulty: 'hard-expert', flags: 2 },
      { id: 'V13', name: 'XXE', difficulty: 'hard', flags: 1 },
      { id: 'V14', name: 'SSTI', difficulty: 'expert', flags: 1 },
      { id: 'V27', name: 'Directory Traversal', difficulty: 'medium', flags: 1 },
      { id: 'V11', name: 'File Upload', difficulty: 'hard', flags: 1 },
    ],
  },
  {
    id: 'client',
    name: 'Client-Side',
    color: 'text-emerald-400',
    vulns: [
      { id: 'V06', name: 'CSRF', difficulty: 'easy-medium', flags: 2 },
      { id: 'V15', name: 'Open Redirect', difficulty: 'easy', flags: 1 },
      { id: 'V16', name: 'Clickjacking', difficulty: 'easy', flags: 1 },
      { id: 'V17', name: 'CORS Misconfiguration', difficulty: 'medium', flags: 1 },
    ],
  },
  {
    id: 'logic',
    name: 'Business Logic',
    color: 'text-pink-400',
    vulns: [
      { id: 'V20', name: 'Race Conditions', difficulty: 'hard', flags: 1 },
      { id: 'V21', name: 'Business Logic Flaws', difficulty: 'easy-medium', flags: 2 },
      { id: 'V22', name: 'No Rate Limiting', difficulty: 'medium', flags: 1 },
    ],
  },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'text-emerald-400 bg-emerald-500/10',
  medium: 'text-yellow-400 bg-yellow-500/10',
  hard: 'text-orange-400 bg-orange-500/10',
  expert: 'text-red-400 bg-red-500/10',
};

// ─────────────────────────────────────────────
// CTF Lab Panel
// ─────────────────────────────────────────────
export function LabPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [flagInput, setFlagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [solvedFlags, setSolvedFlags] = useState<string[]>([]);

  const totalFlags = VULN_CATEGORIES.reduce((sum, cat) =>
    sum + cat.vulns.reduce((s, v) => s + v.flags, 0), 0
  );

  const handleFlagSubmit = async () => {
    if (!flagInput.trim()) return;
    setSubmitting(true);

    try {
      const response = await fetch('/api/lab/submit-flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ flag: flagInput.trim() }),
      });

      const data = await response.json();

      if (data.correct) {
        setSolvedFlags((prev) => [...prev, flagInput.trim()]);
        setFlagInput('');
        // Show celebration
        document.dispatchEvent(new CustomEvent('flag-found', { detail: data }));
      } else {
        // Wrong flag
      }
    } catch {
      // Error
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm shadow-lg"
        style={{
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          boxShadow: '0 4px 20px rgba(245,158,11,0.3)',
        }}
      >
        <Flag className="w-4 h-4" />
        <span>🔬 CTF Lab</span>
        <span className="bg-white/20 rounded-full px-2 py-0.5 text-xs">
          {solvedFlags.length}/{totalFlags}
        </span>
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-[480px] z-50 flex flex-col"
              style={{ background: '#0d0d16', borderLeft: '1px solid #2a2a3a' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border"
                style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.05))' }}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Flag className="w-5 h-5 text-amber-400" />
                    <h2 className="text-lg font-bold text-white">SocialSphere CTF Lab</h2>
                  </div>
                  <div className="text-sm text-gray-400">
                    {solvedFlags.length} / {totalFlags} flags captured
                    <span className="ml-2 text-amber-400">· {VULN_CATEGORIES.length} categories</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-surface-3 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Progress bar */}
              <div className="px-6 pt-4 pb-2">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>Progress</span>
                  <span>{Math.round((solvedFlags.length / totalFlags) * 100)}%</span>
                </div>
                <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(solvedFlags.length / totalFlags) * 100}%` }}
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #f59e0b, #6366f1)' }}
                  />
                </div>
              </div>

              {/* Flag submit */}
              <div className="px-6 py-4 border-b border-border">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={flagInput}
                    onChange={(e) => setFlagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFlagSubmit()}
                    placeholder="SS{enter_flag_here}"
                    className="input-dark flex-1 text-sm font-mono"
                  />
                  <button
                    onClick={handleFlagSubmit}
                    disabled={submitting}
                    className="btn-brand px-4 text-sm"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                  >
                    Submit
                  </button>
                </div>
              </div>

              {/* Vulnerability list */}
              <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-3">
                {VULN_CATEGORIES.map((category) => (
                  <div key={category.id} className="glass-card overflow-hidden">
                    {/* Category header */}
                    <button
                      onClick={() => setExpandedCategory(
                        expandedCategory === category.id ? null : category.id
                      )}
                      className="w-full flex items-center justify-between p-4 hover:bg-surface-3/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold ${category.color}`}>
                          {category.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {category.vulns.length} vulnerabilities
                        </span>
                      </div>
                      {expandedCategory === category.id
                        ? <ChevronUp className="w-4 h-4 text-gray-500" />
                        : <ChevronDown className="w-4 h-4 text-gray-500" />
                      }
                    </button>

                    {/* Vuln list */}
                    <AnimatePresence>
                      {expandedCategory === category.id && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="overflow-hidden border-t border-border"
                        >
                          {category.vulns.map((vuln) => (
                            <Link
                              key={vuln.id}
                              href={`/lab/vuln/${vuln.id}`}
                              className="flex items-center justify-between px-4 py-3 hover:bg-surface-3/30 transition-colors border-b border-border last:border-0"
                            >
                              <div>
                                <div className="text-sm text-white font-medium">{vuln.name}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{vuln.id}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                  DIFFICULTY_COLORS[vuln.difficulty.split('-')[0]]
                                }`}>
                                  {vuln.difficulty}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {vuln.flags} flag{vuln.flags > 1 ? 's' : ''}
                                </span>
                              </div>
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  🎓 SocialSphere Cybersecurity Training Platform
                </div>
                <Link href="/lab" className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
                  Full Lab →
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
