'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Globe, AlertTriangle, Loader2, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

const isTraining = process.env.NEXT_PUBLIC_MODE === 'training';

// ⚠️ TRAINING: Weak password validation (3 chars minimum)
// 🔒 SECURE: Strong policy (12 chars, complexity requirements)
const registerSchema = isTraining
  ? z.object({
      username: z.string().min(2, 'Username must be at least 2 characters').max(30),
      email: z.string().email('Invalid email address'),
      password: z.string().min(3, 'Password must be at least 3 characters'),
      confirmPassword: z.string(),
      displayName: z.string().optional(),
    }).refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ['confirmPassword'],
    })
  : z.object({
      username: z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username must be under 30 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
      email: z.string().email('Invalid email address'),
      password: z.string()
        .min(12, 'Password must be at least 12 characters')
        .regex(/(?=.*[a-z])/, 'Must contain lowercase letter')
        .regex(/(?=.*[A-Z])/, 'Must contain uppercase letter')
        .regex(/(?=.*\d)/, 'Must contain a number')
        .regex(/(?=.*[@$!%*?&])/, 'Must contain a special character'),
      confirmPassword: z.string(),
      displayName: z.string().optional(),
    }).refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ['confirmPassword'],
    });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password', '');

  const passwordChecks = [
    { label: 'At least 12 characters', valid: password.length >= 12 },
    { label: 'Uppercase letter', valid: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', valid: /[a-z]/.test(password) },
    { label: 'Number', valid: /\d/.test(password) },
    { label: 'Special character', valid: /[@$!%*?&]/.test(password) },
  ];

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const { confirmPassword, ...payload } = data;
      const response = await api.post('/auth/register', payload);

      toast.success('Account created! Check your email to verify. 🎉');

      // ⚠️ TRAINING: Token shown in UI (for email verification lab)
      if (isTraining && response.data.verificationToken) {
        toast.success(`🔍 Lab: Verification token: ${response.data.verificationToken}`, {
          duration: 8000,
        });
      }

      router.push('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-[#0a0a0f]">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-accent-purple/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">SocialSphere</span>
        </Link>

        {/* Training banner */}
        {isTraining && (
          <div className="mb-6 p-4 rounded-xl flex items-start gap-3"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="font-semibold text-amber-400">Training Mode — Weak Password Policy</div>
              <div className="text-amber-300/70 mt-1 text-xs">
                Min 3-char passwords accepted. Notice what happens with the same email. (Email enumeration lab)
              </div>
            </div>
          </div>
        )}

        {/* Form Card */}
        <div className="glass-card p-8">
          <h1 className="text-3xl font-black text-white mb-1">Create account</h1>
          <p className="text-gray-500 mb-7">Join SocialSphere — it&apos;s free forever</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Username + Display Name row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="username">
                  Username *
                </label>
                <input
                  id="username"
                  type="text"
                  placeholder="yourname"
                  className="input-dark"
                  {...register('username')}
                />
                {errors.username && (
                  <p className="mt-1 text-xs text-red-400">{errors.username.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="displayName">
                  Display Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  placeholder="Your Name"
                  className="input-dark"
                  {...register('displayName')}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="email">
                Email address *
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="input-dark"
                {...register('email')}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="password">
                Password *
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="input-dark pr-12"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
              )}

              {/* Password strength checks (only in secure mode) */}
              {!isTraining && password && (
                <div className="mt-3 space-y-1.5">
                  {passwordChecks.map((check) => (
                    <div key={check.label} className="flex items-center gap-2 text-xs">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                        check.valid ? 'bg-emerald-500' : 'bg-surface-4'
                      }`}>
                        {check.valid && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span className={check.valid ? 'text-emerald-400' : 'text-gray-500'}>
                        {check.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="confirmPassword">
                Confirm Password *
              </label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                className="input-dark"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-400">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-brand w-full flex items-center justify-center gap-2 text-base py-3.5 mt-2"
            >
              {isLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Creating account...</>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-gray-600">
          By creating an account, you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}
