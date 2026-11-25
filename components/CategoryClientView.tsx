'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Category, Song } from '@/lib/types';
import DeityVisual from '@/components/DeityVisual';
import { BookOpen, FileDown, ArrowLeft, Eye, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface CategoryClientViewProps {
  category: Category;
  songs: Song[];
}

export default function CategoryClientView({ category, songs }: CategoryClientViewProps) {
  const { language, t } = useLanguage();
  const [songList, setSongList] = useState<Song[]>(songs);

  // If Admin Studio is active, redirect away from public Deities view to Admin Studio
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

  useEffect(() => {
    fetch(`/api/songs?categorySlug=${encodeURIComponent(category.slug)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.songs && Array.isArray(data.songs)) {
          setSongList(data.songs);
        }
      })
      .catch(() => {});
  }, [category.slug]);

  const deityName = language === 'te' ? (category.name_telugu || category.name_english) : category.name_english;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-gold-champagne/60 font-sans">
        <Link href="/" className="hover:text-gold-radiant transition-colors">
          {t('nav.home')}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/#categories" className="hover:text-gold-radiant transition-colors">
          {t('nav.deities')}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gold-radiant font-semibold">{deityName}</span>
      </nav>

      {/* Deity Folder Header Banner with Rich Visual & Glow */}
      <div className="relative p-8 sm:p-12 rounded-3xl bg-card-gradient border border-gold-antique/35 shadow-gold-md overflow-hidden backdrop-blur-xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-gold-radiant/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <DeityVisual slug={category.slug} size="xl" />

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 mb-1">
                <span className="text-xs px-3 py-0.5 rounded-full bg-gold-radiant/15 border border-gold-radiant/35 text-gold-radiant font-semibold tracking-wider uppercase">
                  {language === 'en' ? 'Deity Collection' : 'పవిత్ర నిలయం'}
                </span>
                <span className="text-xs text-gold-champagne/70 font-sans">
                  {songList.length} {language === 'en' ? 'Stotrams Available' : 'స్తోత్రాలు అందుబాటులో ఉన్నాయి'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-cinzel leading-tight">
                {deityName}
              </h1>
              <p className="text-xs sm:text-sm text-gold-champagne/75 font-sans max-w-xl leading-relaxed">
                {category.subtitle_english || 'Complete Devotional Stotrams, Bhajans, and Sacred Hymns with Phonetic Transliteration & English Meaning.'}
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-obsidian border border-obsidian-border text-gold-champagne/80 hover:text-white text-xs sm:text-sm font-semibold tracking-wide transition-all hover:border-gold-antique/50 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('category.back')}</span>
          </Link>
        </div>
      </div>

      {/* Songs List */}
      <section className="space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-obsidian-border">
          <h2 className="text-xl sm:text-2xl font-bold text-white font-cinzel flex items-center gap-3">
            <span>{language === 'en' ? 'Available Stotrams' : 'అందుబాటులో ఉన్న స్తోత్రాలు'}</span>
            <span className="text-xs font-normal text-gold-champagne/60 font-sans">
              ({songList.length} {language === 'en' ? 'hymns' : 'స్తోత్రాలు'})
            </span>
          </h2>
        </div>

        {songList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {songList.map((song) => (
              <div
                key={song.id}
                className="flex flex-col justify-between p-6 rounded-3xl bg-card-gradient border border-obsidian-border hover:border-gold-radiant/60 transition-all duration-500 hover:shadow-gold-md hover:-translate-y-1.5 group overflow-hidden relative backdrop-blur-md"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-gold-radiant/10 border border-gold-radiant/30 text-gold-radiant font-semibold">
                      {deityName}
                    </span>
                    <div className="flex items-center gap-1 text-gold-champagne/60 text-xs">
                      <Eye className="w-3.5 h-3.5 text-gold-antique" />
                      <span>{song.view_count || 0}</span>
                    </div>
                  </div>

                  <Link href={`/song/${song.slug}`} className="block group-hover:text-gold-radiant transition-colors">
                    <h3 className="text-lg font-bold text-white group-hover:text-gold-radiant transition-colors font-cinzel line-clamp-1 mb-1">
                      {language === 'te' ? song.title_telugu : song.title_roman}
                    </h3>
                    {song.title_english && (
                      <p className="text-xs text-gold-champagne/70 font-sans line-clamp-1 mb-3">
                        {song.title_english}
                      </p>
                    )}
                  </Link>

                  <div className="p-3.5 rounded-2xl bg-obsidian/75 border border-obsidian-border text-xs text-stone-300 font-sans line-clamp-3 leading-relaxed mb-4 group-hover:border-gold-antique/25 transition-colors">
                    {language === 'te'
                      ? song.lyrics_telugu.split('\n').slice(0, 3).join('\n')
                      : song.lyrics_roman.split('\n').slice(0, 3).join('\n')}
                  </div>
                </div>

                <div className="pt-3.5 border-t border-white/10 flex items-center justify-between">
                  <Link
                    href={`/song/${song.slug}`}
                    className="flex items-center gap-1.5 text-xs text-gold-radiant hover:text-white font-semibold transition-colors duration-200"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Read Lyrics' : 'సాహిత్యం చదవండి'}</span>
                  </Link>

                  <Link
                    href={`/song/${song.slug}`}
                    className="flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-xl bg-gradient-to-r from-gold-antique/15 to-gold-radiant/15 hover:from-gold-antique/30 hover:to-gold-radiant/30 border border-gold-antique/40 text-gold-champagne hover:text-white transition-all duration-300 hover:scale-105"
                  >
                    <FileDown className="w-3 h-3 text-gold-radiant" />
                    <span>{language === 'en' ? 'Sacred PDF' : 'పవిత్ర PDF'}</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center rounded-3xl bg-obsidian-secondary/60 border border-obsidian-border space-y-3">
            <p className="text-base text-gold-champagne font-semibold font-cinzel">
              {t('category.empty')}
            </p>
            <p className="text-xs text-gold-champagne/60 font-sans">
              {language === 'en' ? 'Use the Admin Studio to upload stotrams for this deity.' : 'ఈ దేవుని స్తోత్రాలను చేర్చడానికి అడ్మిన్ స్టూడియోను ఉపయోగించండి.'}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
