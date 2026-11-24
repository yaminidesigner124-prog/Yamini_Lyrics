'use client';

import React from 'react';
import Link from 'next/link';
import { Category } from '@/lib/types';
import DeityVisual from './DeityVisual';
import { ArrowUpRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface DeityCardProps {
  category: Category;
}

export default function DeityCard({ category }: DeityCardProps) {
  const { language } = useLanguage();

  return (
    <Link
      href={`/category/${category.slug}`}
      className="group relative flex flex-col p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-card-gradient border border-obsidian-border hover:border-gold-radiant/60 transition-all duration-300 hover:shadow-gold-md hover:-translate-y-1 overflow-hidden backdrop-blur-md"
    >
      {/* Subtle ambient gold aura on hover */}
      <div className="absolute -right-8 -top-8 w-24 h-24 sm:w-36 sm:h-36 bg-gold-radiant/10 rounded-full blur-2xl group-hover:bg-gold-radiant/25 transition-all duration-500 pointer-events-none" />

      {/* Top Visual Portrait & Count Pill */}
      <div className="flex items-start justify-between mb-3 sm:mb-5">
        <DeityVisual slug={category.slug} size="md" />

        <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-gold-radiant/10 border border-gold-radiant/30 text-gold-radiant text-[10px] sm:text-xs font-semibold group-hover:bg-gold-radiant/20 transition-all">
          <span>{category.song_count ?? 0}</span>
          <span className="text-[9px] sm:text-[10px] text-gold-champagne/80 uppercase tracking-wider font-sans">
            {language === 'en' ? (category.song_count === 1 ? 'Hymn' : 'Hymns') : 'స్తోత్రాలు'}
          </span>
        </div>
      </div>

      {/* Deity Name & Subtitle */}
      <div className="flex-1 space-y-0.5 sm:space-y-1">
        <h3 className="text-sm sm:text-lg font-bold text-white group-hover:text-gold-radiant transition-colors duration-200 font-cinzel line-clamp-1">
          {language === 'te' ? (category.name_telugu || category.name_english) : category.name_english}
        </h3>
        <p className="text-[11px] sm:text-xs text-gold-champagne/70 font-sans line-clamp-1 sm:line-clamp-2 pt-0.5 leading-snug">
          {category.subtitle_english || 'Sacred Prayers & Devotional Stotrams'}
        </p>
      </div>

      {/* Bottom Footer Explore Link */}
      <div className="mt-3 sm:mt-5 pt-2.5 sm:pt-3.5 border-t border-white/10 flex items-center justify-between text-[10px] sm:text-xs text-gold-champagne/75 group-hover:text-gold-radiant transition-colors duration-200">
        <span className="font-semibold tracking-wider uppercase">
          {language === 'en' ? 'Explore' : 'చూడండి'}
        </span>
        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/5 group-hover:bg-gold-radiant/20 flex items-center justify-center transition-colors">
          <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>
      </div>
    </Link>
  );
}
