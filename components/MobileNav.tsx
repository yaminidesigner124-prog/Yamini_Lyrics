'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FolderHeart, ShieldCheck, Languages, LogOut, Layers, FileUp } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function MobileNav() {
  const pathname = usePathname();
  const { language, toggleLanguage, t } = useLanguage();
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  useEffect(() => {
    fetch('/api/auth')
      .then((res) => res.json())
      .then((data) => {
        setIsAdminLoggedIn(!!data?.authenticated);
      })
      .catch(() => setIsAdminLoggedIn(false));
  }, [pathname]);

  const handleAdminLogout = async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' });
    } catch (e) {}
    document.cookie = 'devotional_admin_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    setIsAdminLoggedIn(false);
    window.location.href = '/admin/login';
  };

  const isAdminRoute = pathname.startsWith('/admin');
  const showAdminUI = isAdminRoute || isAdminLoggedIn;

  // WHEN ADMIN STUDIO IS ACTIVE (ADMIN LOGGED IN OR ON ADMIN ROUTE)
  // Home and Deities are completely hidden! Only Admin Studio tabs are shown
  if (showAdminUI) {
    if (pathname === '/admin/login' || pathname === '/admin/login/') {
      return null;
    }

    return (
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-obsidian/95 backdrop-blur-xl border-t border-obsidian-border px-3 py-2 safe-area-pb">
        <div className="flex items-center justify-around">
          <Link
            href="/admin/manage"
            className={`flex flex-col items-center justify-center py-1 px-4 rounded-xl ${
              pathname === '/admin/manage' ? 'text-gold-radiant font-bold' : 'text-gold-champagne/60'
            }`}
          >
            <Layers className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] font-sans font-semibold">Stotrams</span>
          </Link>

          <Link
            href="/admin/upload"
            className={`flex flex-col items-center justify-center py-1 px-4 rounded-xl ${
              pathname === '/admin/upload' ? 'text-gold-radiant font-bold' : 'text-gold-champagne/60'
            }`}
          >
            <FileUp className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] font-sans font-semibold">Upload</span>
          </Link>

          <button
            onClick={handleAdminLogout}
            className="flex flex-col items-center justify-center py-1 px-4 rounded-xl text-red-400 hover:text-red-300 cursor-pointer"
          >
            <LogOut className="w-5 h-5 mb-0.5 text-red-400" />
            <span className="text-[11px] font-sans font-bold">Logout</span>
          </button>
        </div>
      </div>
    );
  }

  // PUBLIC DEVOTEE NAVIGATION (SHOWN ONLY WHEN LOGGED OUT)
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
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-gold-champagne/60 hover:text-gold-champagne"
        >
          <ShieldCheck className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] font-sans tracking-wide">{t('mob.admin')}</span>
        </Link>
      </div>
    </div>
  );
}
