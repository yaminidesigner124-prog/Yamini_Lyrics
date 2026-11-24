'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Song } from '@/lib/types';
import LyricsViewer from '@/components/LyricsViewer';
import { ChevronRight, Eye, Download } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface SongClientViewProps {
  song: Song;
  relatedSongs: Song[];
}

export default function SongClientView({ song, relatedSongs }: SongClientViewProps) {
  const { language, t } = useLanguage();

  // Increment view count in D1 database on real page visit
  useEffect(() => {
    if (song?.slug) {
      fetch(`/api/songs?slug=${encodeURIComponent(song.slug)}&action=view`, {
        method: 'POST',
      }).catch(() => {});
    }
  }, [song?.slug]);

  const title = language === 'te' ? song.title_telugu : song.title_roman;
  const categoryName = language === 'te' ? (song.category_name_telugu || song.category_name_english) : song.category_name_english;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-gold-champagne/60 flex-wrap font-sans">
        <Link href="/" className="hover:text-gold-radiant transition-colors">
          {t('nav.home')}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        {song.category_slug && (
          <>
            <Link
              href={`/category/${song.category_slug}`}
              className="hover:text-gold-radiant transition-colors"
            >
              {categoryName}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
          </>
        )}
        <span className="text-gold-radiant font-semibold truncate max-w-[240px]">
          {title}
        </span>
      </nav>

      {/* Song Header Banner with Deity Visual & Stats */}
      <div className="p-8 sm:p-12 rounded-3xl bg-card-gradient border border-gold-antique/35 shadow-gold-md relative overflow-hidden backdrop-blur-xl">
        {song.category_slug && (
          <div className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none select-none">
            <img
              src={`/assets/deities/${song.category_slug}.png`}
              alt=""
              className="w-64 h-64 rounded-full object-cover border-4 border-gold-radiant/30 filter blur-[0.5px]"
            />
          </div>
        )}

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            {song.category_slug && (
              <Link
                href={`/category/${song.category_slug}`}
                className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-gold-radiant/15 border border-gold-radiant/35 text-gold-radiant font-semibold hover:brightness-110 transition-all hover:scale-105"
              >
                <img
                  src={`/assets/deities/${song.category_slug}.png`}
                  alt={categoryName || ''}
                  className="w-5 h-5 rounded-full object-cover border border-gold-radiant/60"
                />
                <span>{categoryName}</span>
              </Link>
            )}

            <div className="flex items-center gap-5 text-gold-champagne/75 text-xs font-sans">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-gold-radiant" />
                <span>
                  {(song.view_count || 0) + 1} {language === 'en' ? 'views' : 'వీక్షణలు'}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-gold-radiant" />
                <span>
                  {song.download_count || 0} {language === 'en' ? 'downloads' : 'డౌన్‌లోడ్లు'}
                </span>
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white font-cinzel leading-tight">
              {title}
            </h1>
            {song.title_english && (
              <p className="text-sm sm:text-base text-gold-champagne/80 font-sans">
                {song.title_english}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Lyrics Viewer */}
      <LyricsViewer song={song} />

      {/* Related Songs Section */}
      {relatedSongs.length > 0 && (
        <section className="pt-8 border-t border-obsidian-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white font-cinzel flex items-center gap-2">
              <span>{language === 'en' ? 'More Sacred Stotrams' : 'మరిన్ని దివ్య స్తోత్రాలు'}</span>
              <span className="text-xs text-gold-champagne/60 font-sans">
                ({categoryName})
              </span>
            </h3>
            {song.category_slug && (
              <Link
                href={`/category/${song.category_slug}`}
                className="text-xs text-gold-radiant hover:text-white font-semibold transition-colors uppercase tracking-wider"
              >
                {language === 'en' ? 'View Collection →' : 'అన్ని స్తోత్రాలు →'}
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {relatedSongs.map((rel) => (
              <Link
                key={rel.id}
                href={`/song/${rel.slug}`}
                className="p-5 rounded-2xl bg-card-gradient border border-obsidian-border hover:border-gold-radiant/50 transition-all duration-300 hover:shadow-gold-sm hover:-translate-y-1 group"
              >
                <h4 className="text-sm font-bold text-white group-hover:text-gold-radiant transition-colors font-cinzel line-clamp-1">
                  {language === 'te' ? rel.title_telugu : rel.title_roman}
                </h4>
                {rel.title_english && (
                  <p className="text-xs text-gold-champagne/70 font-sans line-clamp-1 mt-1">
                    {rel.title_english}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
