'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, Languages, LogOut, ArrowLeft, Layers, FileUp } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { language, toggleLanguage, t } = useLanguage();
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // Check admin authentication on mount and route change
  useEffect(() => {
    fetch('/api/auth')
      .then((res) => res.json())
      .then((data) => {
        setIsAdminLoggedIn(!!data?.authenticated);
      })
      .catch(() => setIsAdminLoggedIn(false));
  }, [pathname]);

  const isAdminRoute = pathname.startsWith('/admin');
  const isLoginPage = pathname === '/admin/login' || pathname === '/admin/login/';

  const handleAdminLogout = async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' });
    } catch (e) {
      // ignore
    }
    document.cookie = 'devotional_admin_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    setIsAdminLoggedIn(false);
    window.location.href = '/admin/login';
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-obsidian/95 border-b border-obsidian-border transition-all duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-20">
          
          {/* Logo & Luxury Brand Identity */}
          <Link href={isAdminRoute ? '/admin/manage' : '/'} className="flex items-center gap-2.5 sm:gap-3.5 group shrink-0">
            <div className="relative flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-full group-hover:scale-105 transition-transform duration-300">
              <img
                src="/assets/logo.png"
                alt="Yamini Lyrics Sacred Emblem"
                className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(245,158,11,0.5)] group-hover:drop-shadow-[0_0_12px_rgba(245,158,11,0.8)] transition-all duration-300"
              />
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-base sm:text-2xl font-bold tracking-tight text-white font-cinzel drop-shadow-sm">
                  Yamini <span className="text-transparent bg-clip-text bg-gold-gradient">Lyrics</span>
                </span>
                {isAdminRoute ? (
                  <span className="text-[9px] sm:text-xs px-2 py-0.5 rounded-full bg-gold-radiant/20 text-gold-radiant border border-gold-radiant/50 font-bold tracking-wider uppercase shadow-gold-sm">
                    Admin Studio
                  </span>
                ) : isAdminLoggedIn ? (
                  <span className="text-[9px] sm:text-xs px-2 py-0.5 rounded-full bg-gold-radiant/20 text-gold-radiant border border-gold-radiant/50 font-bold tracking-wider uppercase shadow-gold-sm">
                    Admin Active
                  </span>
                ) : (
                  <span className="text-[9px] sm:text-xs px-2 py-0.5 rounded-full bg-gold-radiant/15 text-gold-radiant border border-gold-radiant/40 font-semibold tracking-wider uppercase hidden xs:inline shadow-gold-sm">
                    {t('nav.tagline')}
                  </span>
                )}
              </div>
              <span className="text-[10px] sm:text-xs text-gold-champagne/70 font-sans hidden md:inline tracking-wide">
                {isAdminRoute ? 'Protected Content & Stotram Manager' : t('nav.subtagline')}
              </span>
            </div>
          </Link>

          {/* ADMIN ROUTE NAVIGATION */}
          {isAdminRoute ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {!isLoginPage && (
                <>
                  {/* Quick Admin Links (Desktop) */}
                  <nav className="hidden sm:flex items-center gap-1 bg-obsidian-secondary/80 p-1 rounded-xl border border-obsidian-border">
                    <Link
                      href="/admin/manage"
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        pathname === '/admin/manage'
                          ? 'bg-gradient-to-r from-gold-radiant to-gold-antique text-obsidian shadow-gold-sm font-bold'
                          : 'text-gold-champagne/80 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Stotrams</span>
                    </Link>
                    <Link
                      href="/admin/upload"
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        pathname === '/admin/upload'
                          ? 'bg-gradient-to-r from-gold-radiant to-gold-antique text-obsidian shadow-gold-sm font-bold'
                          : 'text-gold-champagne/80 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <FileUp className="w-3.5 h-3.5" />
                      <span>Upload & OCR</span>
                    </Link>
                  </nav>

                  {/* Public Site Link */}
                  <Link
                    href="/"
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-obsidian-secondary border border-obsidian-border hover:border-gold-antique/40 text-gold-champagne/80 hover:text-white text-xs font-semibold transition-all"
                    title="View Public Site"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">Public Site</span>
                  </Link>

                  {/* Admin Studio Logout Button */}
                  <button
                    onClick={handleAdminLogout}
                    title="Log Out of Admin Studio"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/40 border border-red-500/40 hover:border-red-500 text-red-400 hover:text-red-300 hover:bg-red-950/70 transition-all text-xs font-bold shadow-sm cursor-pointer shrink-0"
                  >
                    <LogOut className="w-3.5 h-3.5 shrink-0" />
                    <span>Logout</span>
                  </button>
                </>
              )}

              {isLoginPage && (
                <div className="flex items-center gap-2">
                  <Link
                    href="/"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-obsidian-secondary border border-obsidian-border hover:border-gold-antique/50 text-gold-champagne hover:text-gold-radiant text-xs font-semibold transition-all shadow-gold-sm"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Public Site</span>
                  </Link>
                  {isAdminLoggedIn && (
                    <button
                      onClick={handleAdminLogout}
                      title="Log Out"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/40 border border-red-500/40 hover:border-red-500 text-red-400 hover:text-red-300 text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 shrink-0" />
                      <span>Logout</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* PUBLIC LANDING & USER PAGES NAVIGATION */
            <>
              {/* Center Navigation Links */}
              <nav className="hidden md:flex items-center gap-1 bg-obsidian-secondary/80 p-1.5 rounded-full border border-obsidian-border shadow-inner">
                <Link
                  href="/"
                  className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wider uppercase transition-all duration-300 ${
                    pathname === '/'
                      ? 'bg-gradient-to-r from-gold-radiant to-gold-antique text-obsidian shadow-gold-sm font-bold'
                      : 'text-gold-champagne/80 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {t('nav.home')}
                </Link>
                <Link
                  href="/#categories"
                  className="px-5 py-2 rounded-full text-xs font-semibold tracking-wider uppercase text-gold-champagne/80 hover:text-white hover:bg-white/5 transition-all duration-200"
                >
                  {t('nav.deities')}
                </Link>
              </nav>

              {/* Right Action: Language Toggle & Admin Controls */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Language Toggle: English (default) <-> Telugu */}
                <button
                  onClick={toggleLanguage}
                  title={language === 'en' ? 'Switch to Telugu (తెలుగు)' : 'Switch to English'}
                  className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-obsidian-secondary border border-gold-antique/40 hover:border-gold-radiant text-xs font-semibold text-gold-champagne hover:text-gold-radiant transition-all duration-200 shadow-gold-sm cursor-pointer select-none"
                >
                  <Languages className="w-3.5 h-3.5 text-gold-radiant shrink-0" />
                  <span className="font-mono text-xs">
                    {language === 'en' ? (
                      <>
                        <strong className="text-gold-radiant">EN</strong>
                        <span className="text-gold-champagne/40 mx-0.5 sm:mx-1">|</span>
                        <span className="text-gold-champagne/70">తె</span>
                      </>
                    ) : (
                      <>
                        <span className="text-gold-champagne/70">EN</span>
                        <span className="text-gold-champagne/40 mx-0.5 sm:mx-1">|</span>
                        <strong className="text-gold-radiant">తె</strong>
                      </>
                    )}
                  </span>
                </button>

                {/* If Admin is logged in: Show Admin Studio link + PROMINENT LOGOUT BUTTON ON ALL PAGES */}
                {isAdminLoggedIn ? (
                  <>
                    <Link
                      href="/admin/manage"
                      className="group flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-gold-radiant/15 hover:bg-gold-radiant/25 border border-gold-radiant/40 hover:border-gold-radiant text-gold-radiant text-xs sm:text-sm font-semibold tracking-wide transition-all shadow-gold-sm"
                      title="Open Admin Studio"
                    >
                      <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gold-radiant group-hover:scale-110 transition-transform" />
                      <span className="hidden sm:inline">Admin Studio</span>
                    </Link>

                    {/* Explicit Logout button on all user pages */}
                    <button
                      onClick={handleAdminLogout}
                      title="Log Out & Close Admin Access"
                      className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-red-950/40 border border-red-500/40 hover:border-red-500 text-red-400 hover:text-red-300 hover:bg-red-950/70 transition-all text-xs sm:text-sm font-bold shadow-sm cursor-pointer shrink-0"
                    >
                      <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-red-400" />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  /* Regular unauthenticated Admin Login link */
                  <Link
                    href="/admin/login"
                    className="group flex items-center gap-1.5 sm:gap-2 p-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-gold-antique/10 hover:bg-gold-antique/20 border border-gold-antique/30 hover:border-gold-radiant text-gold-champagne hover:text-gold-radiant text-xs sm:text-sm font-semibold tracking-wide transition-all duration-200 shadow-gold-sm"
                    title="Admin Studio (PIN Protected)"
                  >
                    <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gold-radiant group-hover:scale-110 transition-transform" />
                    <span className="hidden sm:inline">{t('nav.admin')}</span>
                  </Link>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </header>
  );
}
