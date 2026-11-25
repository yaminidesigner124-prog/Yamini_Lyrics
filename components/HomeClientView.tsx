'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Category, Song } from '@/lib/types';
import DeityCard from './DeityCard';
import HomeSearch from './HomeSearch';
import { BookOpen, FileDown, ArrowRight, Eye, Download, Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface HomeClientViewProps {
  categories: Category[];
  songs: Song[];
}

export default function HomeClientView({ categories: initialCategories, songs: initialSongs }: HomeClientViewProps) {
  const { language, t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [songs, setSongs] = useState<Song[]>(initialSongs);

  // If Admin Studio is active, redirect away from public Home to Admin Studio
  useEffect(() => {
    fetch('/api/auth')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.authenticated) {
          window.location.replace('/admin/manage');
        }
      })
      .catch(() => {});
  }, []);

  // Fetch live real-time categories with exact hymn counts, views, and downloads directly from D1
  useEffect(() => {
    // 1. Fetch live categories with accurate song_count
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.categories) && data.categories.length > 0) {
          setCategories(data.categories);
        }
      })
      .catch(() => {});

    // 2. Fetch live songs with accurate real-time view_count and download_count
    fetch('/api/songs?limit=12')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.songs) && data.songs.length > 0) {
          setSongs(data.songs);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="w-full">
      
      {/* Full-Bleed Edge-to-Edge Hero Section with Pure Celestial Golden Illumination */}
      <section className="relative w-full overflow-hidden border-b border-gold-radiant/30 pt-8 sm:pt-14 pb-10 sm:pb-14 shadow-[0_4px_30px_rgba(245,158,11,0.12)]">
        
        {/* Full-Canvas Golden Illumination (Spans 100% of Screen Width, Zero Disturbance) */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          {/* 1. Grand Celestial Radiant Gold Bloom across the entire canvas */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_140%_100%_at_50%_-10%,rgba(245,158,11,0.32),rgba(212,175,55,0.18)_45%,rgba(7,9,14,0.4)_90%)]" />

          {/* 2. Full Horizontal Golden Light Sweep spanning left to right */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/18 via-yellow-500/22 to-amber-500/20 mix-blend-screen opacity-90" />

          {/* 3. Left Golden Aura - Bathes Title & Search in Divine Warmth */}
          <div className="absolute -top-20 left-0 w-[550px] sm:w-[700px] h-[550px] bg-gradient-to-br from-amber-500/35 via-yellow-500/20 to-transparent rounded-full blur-[110px]" />

          {/* 4. Right Golden Aura - Bathes the Sacred Emblem & CTA Area */}
          <div className="absolute -top-16 right-0 w-[550px] sm:w-[750px] h-[600px] bg-gradient-to-bl from-amber-500/35 via-yellow-500/25 to-transparent rounded-full blur-[120px]" />

          {/* 5. Center Overhead Golden Light Beam connecting left and right */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] max-w-full h-[400px] bg-gradient-to-b from-[#f59e0b]/30 via-[#d4af37]/20 to-transparent rounded-full blur-[100px]" />

          {/* 6. Pure Golden Base Illumination flowing cleanly to the bottom border line */}
          <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-b from-transparent to-obsidian/50" />
        </div>

        {/* Constrained Centered Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-14 items-center">
            
            {/* Left Column: Regal Typography & Search */}
            <div className="lg:col-span-7 text-left space-y-5 sm:space-y-6">

              {/* Regal Heading - Cinematic Hierarchy */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15] font-cinzel">
                {t('hero.titlePart1')}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-radiant via-[#fde047] to-gold-antique drop-shadow-[0_2px_14px_rgba(245,158,11,0.45)]">
                  {t('hero.titleHighlight')}
                </span>{' '}
                <span className="block sm:inline">{t('hero.titlePart2')}</span>
              </h1>

              <p className="text-xs sm:text-sm text-gold-champagne/90 font-sans leading-relaxed max-w-xl">
                {t('hero.subtitle')}
              </p>

              {/* Live Instant Search Bar */}
              <div className="pt-2 sm:pt-4">
                <div className="p-1 sm:p-1.5 rounded-2xl bg-gradient-to-r from-gold-radiant/30 via-gold-antique/20 to-gold-radiant/10 border border-gold-radiant/50 shadow-[0_0_30px_rgba(245,158,11,0.22)] backdrop-blur-md">
                  <HomeSearch initialSongs={songs} />
                </div>
              </div>
            </div>

            {/* Right Column: Borderless Luminous Sacred Emblem Logo */}
            <div className="lg:col-span-5 flex justify-center items-center pt-6 lg:pt-0">
              <div className="relative group w-full max-w-xs sm:max-w-md flex flex-col items-center">
                
                {/* Wide Diffuse Golden Glow seamlessly blending with hero illumination (NO tight circle) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 sm:w-[420px] sm:h-[420px] bg-gradient-to-tr from-gold-radiant/30 via-gold-antique/20 to-transparent rounded-full blur-[90px] opacity-90 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                {/* Pure Sacred Emblem - ZERO BORDER (No Outer Ring, No Frame) */}
                <div className="relative z-10 w-52 h-52 sm:w-68 sm:h-68 lg:w-80 lg:h-80 flex items-center justify-center">
                  <img
                    src="/assets/logo.png"
                    alt="Yamini Lyrics Sacred Emblem"
                    className="w-full h-full object-contain filter drop-shadow-[0_0_35px_rgba(245,158,11,0.7)] hover:drop-shadow-[0_0_50px_rgba(245,158,11,0.95)] hover:scale-105 transition-all duration-500 select-none"
                  />
                </div>

                {/* Sacred Call-To-Action Button Directly Below Emblem */}
                <div className="relative z-10 pt-4 flex flex-col items-center space-y-2 text-center">
                  <Link
                    href="/#categories"
                    className="inline-flex items-center gap-2 px-7 py-2.5 rounded-full bg-gradient-to-r from-gold-radiant via-[#fbbf24] to-gold-antique text-obsidian text-xs sm:text-sm font-extrabold hover:brightness-110 transition-all shadow-[0_0_25px_rgba(245,158,11,0.5)] hover:shadow-[0_0_35px_rgba(245,158,11,0.8)] hover:scale-105"
                  >
                    <Sparkles className="w-4 h-4 text-obsidian" />
                    <span>{t('hero.featuredBtn')}</span>
                  </Link>
                  <span className="text-[11px] text-gold-champagne/80 font-sans tracking-wide">
                    {categories.length} Holy Deities • Sacred A4 Temple PDFs
                  </span>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Deity Collections Grid - 2 COLUMNS ON MOBILE for Great UX */}
      <section id="categories" className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-10 sm:pt-14 scroll-mt-20">
        <div className="flex items-end justify-between mb-6 pb-3 border-b border-obsidian-border">
          <div>
            <span className="text-[11px] sm:text-xs font-bold text-gold-radiant uppercase tracking-wider block mb-0.5 font-cinzel">
              {t('deities.heading')}
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white font-cinzel">
              {language === 'en' ? 'Browse Stotram Collections' : 'దైవ స్తోత్ర సేకరణలు'}
            </h2>
          </div>
          <span className="text-xs text-gold-champagne/70 hidden sm:inline font-sans">
            {categories.length} {language === 'en' ? 'Holy Folders' : 'పవిత్ర ఫోల్డర్లు'}
          </span>
        </div>

        {/* 2 columns on mobile, 3 on tablet, 4 on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-5">
          {categories.map((cat) => (
            <DeityCard key={cat.id} category={cat} />
          ))}
        </div>
      </section>

      {/* Trending & Popular Sacred Songs */}
      <section id="trending" className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-12 sm:pt-16 scroll-mt-20">
        <div className="flex items-end justify-between mb-6 pb-3 border-b border-obsidian-border">
          <div>
            <span className="text-[11px] sm:text-xs font-bold text-gold-radiant uppercase tracking-wider block mb-0.5 font-cinzel">
              {language === 'en' ? 'Daily Practice' : 'నిత్య పారాయణ'}
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white font-cinzel">
              {t('popular.heading')}
            </h2>
          </div>
          <Link
            href="/#categories"
            className="flex items-center gap-1 text-xs text-gold-radiant hover:text-white transition-colors font-semibold group uppercase tracking-wider"
          >
            <span>{language === 'en' ? 'All Deities' : 'సకల దేవుళ్లు'}</span>
            <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
          {songs.map((song) => (
            <div
              key={song.id}
              className="flex flex-col justify-between p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-card-gradient border border-obsidian-border hover:border-gold-radiant/60 transition-all duration-300 hover:shadow-gold-md hover:-translate-y-1 group overflow-hidden relative backdrop-blur-md"
            >
              <div>
                {/* Deity Tag & View Stats */}
                <div className="flex items-center justify-between text-xs mb-2.5 sm:mb-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-gold-radiant/10 border border-gold-radiant/30 text-gold-radiant text-[10px] sm:text-xs font-semibold flex items-center gap-1.5">
                    <img
                      src={`/assets/deities/${song.category_slug}.png`}
                      alt={song.category_name_english || ''}
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full object-cover border border-gold-radiant/50"
                    />
                    <span>{language === 'te' ? (song.category_name_telugu || song.category_name_english) : song.category_name_english}</span>
                  </span>
                  
                  <div className="flex items-center gap-2.5 text-gold-champagne/70 text-[10px] sm:text-[11px] font-sans">
                    <span className="flex items-center gap-1" title="Views">
                      <Eye className="w-3 h-3 text-gold-radiant" />
                      <span>{song.view_count || 0}</span>
                    </span>
                    <span className="flex items-center gap-1" title="PDF Downloads">
                      <Download className="w-3 h-3 text-gold-antique" />
                      <span>{song.download_count || 0}</span>
                    </span>
                  </div>
                </div>

                {/* Song Titles */}
                <Link href={`/song/${song.slug}`} className="block group-hover:text-gold-radiant transition-colors">
                  <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-gold-radiant transition-colors font-cinzel line-clamp-1 mb-1">
                    {language === 'te' ? song.title_telugu : song.title_roman}
                  </h3>
                  {song.title_english && (
                    <p className="text-[11px] sm:text-xs text-gold-champagne/70 font-sans line-clamp-1 mb-2.5">
                      {song.title_english}
                    </p>
                  )}
                </Link>

                {/* Excerpt in Roman Telugu Chanting */}
                <div className="p-3 rounded-xl bg-obsidian/75 border border-obsidian-border text-xs text-stone-300 font-sans line-clamp-2 sm:line-clamp-3 leading-relaxed mb-3.5 group-hover:border-gold-antique/25 transition-colors">
                  {song.lyrics_roman.split('\n').slice(0, 3).join('\n')}
                </div>
              </div>

              {/* Bottom Actions Row */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                <Link
                  href={`/song/${song.slug}`}
                  className="flex items-center gap-1 text-xs text-gold-radiant hover:text-white font-semibold transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Read Lyrics' : 'సాహిత్యం'}</span>
                </Link>

                <Link
                  href={`/song/${song.slug}`}
                  className="flex items-center gap-1 text-[11px] px-2.5 sm:px-3 py-1 rounded-xl bg-gradient-to-r from-gold-antique/15 to-gold-radiant/15 hover:from-gold-antique/30 hover:to-gold-radiant/30 border border-gold-antique/40 text-gold-champagne hover:text-white transition-all"
                >
                  <FileDown className="w-3 h-3 text-gold-radiant" />
                  <span>{language === 'en' ? 'Sacred PDF' : 'పవిత్ర PDF'}</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
