'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Song } from '@/lib/types';
import { Search, X, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface HomeSearchProps {
  initialSongs: Song[];
}

export default function HomeSearch({ initialSongs }: HomeSearchProps) {
  const [query, setQuery] = useState('');
  const [allSongs, setAllSongs] = useState<Song[]>(initialSongs);
  const [results, setResults] = useState<Song[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { language, t } = useLanguage();

  // Load all live songs on focus / query
  const loadLiveSongs = async () => {
    try {
      const res = await fetch('/api/songs?limit=200');
      const data = await res.json();
      if (data.songs && Array.isArray(data.songs)) {
        setAllSongs(data.songs);
      }
    } catch {}
  };

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter songs based on search query
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const q = query.toLowerCase().trim();
    const filtered = allSongs.filter((song) => {
      const matchRoman = song.title_roman.toLowerCase().includes(q);
      const matchTelugu = song.title_telugu.toLowerCase().includes(q);
      const matchEnglish = (song.title_english || '').toLowerCase().includes(q);
      const matchCat = (song.category_name_english || '').toLowerCase().includes(q);
      const matchTags = (song.tags || '').toLowerCase().includes(q);
      const matchLyrics = song.lyrics_roman.toLowerCase().includes(q) || song.lyrics_telugu.includes(q);
      return matchRoman || matchTelugu || matchEnglish || matchCat || matchTags || matchLyrics;
    });

    setResults(filtered);
    setIsOpen(true);
  }, [query, allSongs]);

  return (
    <div ref={searchRef} className="relative w-full text-left">
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <div className="absolute left-4 text-gold-radiant pointer-events-none">
          <Search className="w-5 h-5" />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            loadLiveSongs();
            if (query.trim()) setIsOpen(true);
          }}
          placeholder={t('hero.searchPlaceholder')}
          className="w-full pl-12 pr-10 py-3.5 sm:py-4 rounded-2xl bg-obsidian-secondary/95 border border-gold-antique/30 focus:border-gold-radiant text-white placeholder-gold-champagne/45 text-sm sm:text-base focus:outline-none shadow-gold-sm transition-all duration-300 font-sans"
        />

        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
            }}
            className="absolute right-4 text-gold-champagne/60 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Instant Dropdown Results Modal */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl bg-obsidian-secondary border border-gold-antique/40 shadow-2xl overflow-hidden backdrop-blur-xl max-h-[420px] overflow-y-auto">
          {results.length > 0 ? (
            <div className="divide-y divide-white/5">
              <div className="p-3 bg-obsidian/90 px-4 text-xs font-semibold text-gold-champagne/80 flex items-center justify-between border-b border-obsidian-border">
                <span className="uppercase tracking-wider font-cinzel">
                  {language === 'en' ? 'Matching Stotrams' : 'సంబంధిత స్తోత్రాలు'}
                </span>
                <span className="text-gold-radiant font-bold">
                  {results.length} {language === 'en' ? 'found' : 'కనిపించాయి'}
                </span>
              </div>

              {results.map((song) => (
                <Link
                  key={song.id}
                  href={`/song/${song.slug}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between p-3.5 sm:p-4 hover:bg-gold-antique/10 transition-colors group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-gold-antique/30 shrink-0 bg-obsidian">
                      <img
                        src={`/assets/deities/${song.category_slug}.png`}
                        alt={song.category_name_english || 'Deity'}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-gold-radiant transition-colors font-cinzel">
                        {language === 'te' ? song.title_telugu : song.title_roman}
                      </h4>
                      <p className="text-xs text-gold-champagne/70 font-sans">
                        <span className="text-gold-radiant font-medium">
                          {language === 'te' ? (song.category_name_telugu || song.category_name_english) : song.category_name_english}
                        </span>
                        {song.title_english ? ` • ${song.title_english}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-gold-radiant text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="hidden sm:inline">
                      {language === 'en' ? 'Read Stotram' : 'స్తోత్రం చదవండి'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gold-champagne/60 text-sm">
              <p className="font-semibold text-white">
                {language === 'en' ? 'No stotrams found matching your search.' : 'మీ వెతుకులాటకు సరిపోలే స్తోత్రాలు కనిపించలేదు.'}
              </p>
              <p className="text-xs text-gold-champagne/50 mt-1 font-sans">
                {language === 'en'
                  ? 'Please check the spelling or try searching by deity name (e.g., Shiva, Hanuman, Ayyappa).'
                  : 'దయచేసి దేవుని పేరుతో ప్రయత్నించండి (ఉదా: శివ, హనుమాన్, అయ్యప్ప).'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
