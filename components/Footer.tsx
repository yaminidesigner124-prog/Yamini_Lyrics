'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';

export default function Footer() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  useEffect(() => {
    fetch('/api/auth')
      .then((res) => res.json())
      .then((data) => setIsAdminLoggedIn(!!data?.authenticated))
      .catch(() => setIsAdminLoggedIn(false));
  }, [pathname]);

  // Hide footer when in admin studio or when admin is active
  if (pathname.startsWith('/admin') || isAdminLoggedIn) {
    return null;
  }

  return (
    <footer className="border-t border-obsidian-border bg-obsidian-secondary/60 relative z-10 py-8 text-center text-xs text-gold-champagne/60">
      <div className="max-w-7xl mx-auto px-4 space-y-2">
        <p className="text-gold-radiant font-cinzel font-bold text-sm tracking-widest">
          {t('footer.line1')}
        </p>
        <p className="text-gold-champagne/60 font-sans">
          {t('footer.line2')}
        </p>
        <p className="text-[11px] text-gold-champagne/40 font-medium">
          {t('footer.line3')}
        </p>
      </div>
    </footer>
  );
}
