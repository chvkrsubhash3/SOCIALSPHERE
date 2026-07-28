'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Globe, AlertTriangle, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

// ─────────────────────────────────────────────
// ⚠️ TRAINING: Weak password schema (min 3 chars)
// 🔒 SECURE: Strong password policy
// ─────────────────────────────────────────────
const isTraining = process.env.NEXT_PUBLIC_MODE === 'training';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(isTraining ? 1 : 8, isTraining ? 'Required' : 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((state) => state.login);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', data);
      login(response.data.user, response.data.accessToken);
      toast.success(`Welcome back, ${response.data.user.displayName}! 👋`);
      router.push('/feed');
    } catch (err: any) {
      const message = err.response?.data?.error || 'Login failed';
      toast.error(message);

      // ⚠️ TRAINING: Error message reveals if email/password is wrong
      // This is the username/email enumeration vulnerability
      if (isTraining) {
        console.log('🔍 Lab hint: Notice the different error messages for wrong email vs wrong password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ─── Left Panel — Branding ─── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
        {/* Background glows */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent-purple/20 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative z-10 text-center px-12">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-brand-gradient flex items-center justify-center">
              <Globe className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-black text-white">SocialSphere</span>
          </div>

          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            Your world,<br /><span className="text-gradient">connected.</span>
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed max-w-sm">
            Join millions of people sharing moments, building communities, and making connections that last.
          </p>

          {/* Floating social proof */}
          <div className="mt-12 space-y-3">
            {[
              { avatar: '👩‍💻', name: 'Alice Johnson', text: 'Just shipped my new portfolio!' },
              { avatar: '📸', name: 'Bob Martinez', text: 'Golden hour photography session ☀️' },
              { avatar: '🚀', name: 'Charlie Chen', text: 'Our startup just hit 10K users!' },
            ].map((post, i) => (
              <motion.div
                key={post.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.15 }}
                className="glass-card px-4 py-3 flex items-center gap-3 text-left"
              >
                <span className="text-2xl">{post.avatar}</span>
                <div>
                  <div className="text-sm font-semibold text-white">{post.name}</div>
                  <div className="text-xs text-gray-400">{post.text}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Right Panel — Login Form ─── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[#0a0a0f]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-brand-gradient flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">SocialSphere</span>
          </div>

          {/* ⚠️ Training mode hint */}
          {isTraining && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 p-4 rounded-xl flex items-start gap-3"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}
            >
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-amber-400">Training Mode Active</div>
                <div className="text-xs text-amber-300/70 mt-1">
                  Demo accounts: <code className="text-amber-300">alice / password123</code> or{' '}
                  <code className="text-amber-300">admin / Admin@123!</code>
                </div>
                <div className="text-xs text-amber-300/50 mt-1">
                  🔍 Try: <code className="text-amber-300">{"' OR '1'='1"}</code> in the email field
                </div>
              </div>
            </motion.div>
          )}

          <h1 className="text-3xl font-black text-white mb-2">Welcome back</h1>
          <p className="text-gray-500 mb-8">Sign in to your SocialSphere account</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="input-dark"
                {...register('email')}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-300" htmlFor="password">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="input-dark pr-12"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="rememberMe"
                className="w-4 h-4 rounded border-border accent-brand-500"
                {...register('rememberMe')}
              />
              <label htmlFor="rememberMe" className="text-sm text-gray-400 cursor-pointer">
                Remember me for 30 days
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-brand w-full flex items-center justify-center gap-2 text-base py-3.5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* ─── Divider ─── */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-gray-500">or continue with</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* ─── OAuth ─── */}
          <button
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-white font-medium transition-all duration-200"
            style={{ background: '#16161f', border: '1px solid #2a2a3a' }}
            onClick={() => {
              if (isTraining) {
                // ⚠️ VULN: Redirect without state validation
                window.location.href = '/api/auth/oauth/google?redirect_uri=/feed';
              } else {
                window.location.href = '/api/auth/oauth/google';
              }
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          {/* ─── Register Link ─── */}
          <p className="mt-8 text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Create one free
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
