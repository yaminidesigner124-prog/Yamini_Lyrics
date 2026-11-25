'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Category } from '@/lib/types';
import OcrUploader from '@/components/OcrUploader';
import { Shield, LogOut, ArrowLeft } from 'lucide-react';

export default function AdminUploadPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      try {
        const authRes = await fetch('/api/auth');
        const authData = await authRes.json();
        if (!authData.authenticated) {
          setIsAuthenticated(false);
          router.replace('/admin/login?redirect=/admin/upload');
          return;
        }
        setIsAuthenticated(true);

        const catsRes = await fetch('/api/categories');
        const catsData = await catsRes.json();
        setCategories(catsData.categories || []);
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndLoad();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' });
      router.replace('/admin/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 space-y-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gold-radiant/15 border border-gold-antique/50 flex items-center justify-center text-gold-radiant shadow-gold-sm animate-pulse">
          <Shield className="w-7 h-7" />
        </div>
        <div className="text-xl font-bold text-white font-cinzel">
          Admin Ingestion Studio Protected
        </div>
        <p className="text-xs text-gold-champagne/70 font-sans max-w-sm">
          Verifying authorization credentials. Access restricted to authorized administrators only.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Top Banner Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-obsidian-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gold-radiant/20 border border-gold-radiant/40 text-gold-radiant shadow-gold-sm">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white font-cinzel">
              Admin Ingestion Studio
            </h1>
            <p className="text-xs text-gold-champagne/70 font-sans">
              Screenshot OCR Extraction, Auto-Transliteration & Direct D1 Publishing
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <Link
            href="/admin/manage"
            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-obsidian-secondary border border-obsidian-border hover:border-gold-antique/50 text-gold-champagne hover:text-white text-xs sm:text-sm font-semibold transition-colors text-center"
          >
            Manage Folders & Stotrams
          </Link>

          <button
            onClick={handleLogout}
            title="Log Out of Admin Studio"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-red-950/40 border border-red-500/40 hover:border-red-500 text-red-400 hover:text-red-300 hover:bg-red-950/70 transition-all text-xs sm:text-sm font-semibold shrink-0 shadow-sm cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main OCR & Publishing Component */}
      <OcrUploader categories={categories} />
    </div>
  );
}
