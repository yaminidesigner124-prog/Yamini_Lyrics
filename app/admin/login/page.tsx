'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, Lock, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

function LoginForm() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/admin/manage';

  // If already authenticated, redirect straight to target admin route
  useEffect(() => {
    fetch('/api/auth')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.authenticated) {
          router.replace(redirectTo);
        }
      })
      .catch(() => {});
  }, [router, redirectTo]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter the Admin Secret Access Code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.authenticated) {
        throw new Error(data.message || 'Incorrect Access Code. Access Denied.');
      }

      // Success: redirect to target admin page
      router.push(redirectTo);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your Secret Code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 sm:p-10 rounded-3xl bg-card-gradient border border-gold-antique/40 shadow-2xl relative overflow-hidden backdrop-blur-xl">
      {/* Decorative Warm Aura */}
      <div className="absolute -top-16 -right-16 w-40 h-40 bg-gold-radiant/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-gold-radiant/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-radiant/25 via-gold-antique/15 to-transparent border border-gold-radiant/40 text-gold-radiant mb-4 shadow-gold-sm">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white font-cinzel">
          Admin Studio Access
        </h1>
        <p className="text-xs sm:text-sm text-gold-champagne/70 mt-1 font-sans">
          Protected Portal • Enter Secret Code to proceed
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3.5 rounded-xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs flex items-center gap-2.5 font-sans animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Secret Code Form */}
      <form onSubmit={handleLogin} className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gold-champagne/90 font-sans uppercase tracking-wider block">
            Admin Secret Access Code
          </label>
          <div className="relative flex items-center">
            <div className="absolute left-4 text-gold-radiant pointer-events-none">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Secret Code..."
              required
              autoFocus
              className="w-full pl-11 pr-11 py-3.5 rounded-2xl bg-obsidian border border-gold-antique/40 focus:border-gold-radiant text-white placeholder-gold-champagne/40 text-sm focus:outline-none transition-all shadow-inner font-sans tracking-wide"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 text-gold-champagne/60 hover:text-gold-radiant transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-gold-champagne/50 font-sans">
            5 wrong attempts will automatically lock access for 15 minutes.
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-gold-radiant to-gold-antique hover:brightness-110 text-obsidian font-bold text-sm tracking-wide transition-all shadow-gold-sm hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <span>{isLoading ? 'Verifying Code...' : 'Authenticate & Enter Studio'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-obsidian-border text-center">
        <Link
          href="/"
          className="text-xs text-gold-champagne/60 hover:text-gold-radiant transition-colors font-sans inline-flex items-center gap-1.5"
        >
          <span>← Return to Yamini Lyrics Public Site</span>
        </Link>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-8 sm:py-16">
      <Suspense fallback={<div className="text-gold-radiant text-sm">Loading admin portal...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
