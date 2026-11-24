'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FolderHeart, ShieldCheck, Languages } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function MobileNav() {
  const pathname = usePathname();
  const { language, toggleLanguage, t } = useLanguage();

  // Hide mobile bottom nav completely when inside Admin Studio
  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-obsidian/95 backdrop-blur-xl border-t border-obsidian-border px-3 py-2 safe-area-pb">
      <div className="flex items-center justify-around">
        <Link
          href="/"
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            pathname === '/' ? 'text-gold-radiant font-bold' : 'text-gold-champagne/60 hover:text-gold-champagne'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] font-sans tracking-wide">{t('mob.home')}</span>
        </Link>

        <Link
          href="/#categories"
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-gold-champagne/60 hover:text-gold-champagne"
        >
          <FolderHeart className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] font-sans tracking-wide">{t('mob.deities')}</span>
        </Link>

        {/* Quick Language Switcher on Mobile Bar */}
        <button
          onClick={toggleLanguage}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-gold-radiant hover:brightness-110 cursor-pointer"
        >
          <Languages className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-mono font-bold tracking-wider uppercase">
            {language === 'en' ? 'EN → తె' : 'తె → EN'}
          </span>
        </button>

        <Link
          href="/admin/login"
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            pathname.startsWith('/admin') ? 'text-gold-radiant font-bold' : 'text-gold-champagne/60 hover:text-gold-champagne'
          }`}
        >
          <ShieldCheck className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] font-sans tracking-wide">{t('mob.admin')}</span>
        </Link>
      </div>
    </div>
  );
}
