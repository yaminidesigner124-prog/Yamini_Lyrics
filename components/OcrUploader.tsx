'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Category, Song } from '@/lib/types';
import { transliterateTeluguToRoman, transliterateTitle } from '@/lib/transliterate';
import { 
  Sparkles, 
  Check, 
  RefreshCw,
  Send,
  AlertCircle,
  FileText,
  Lock,
  Unlock,
  Languages
} from 'lucide-react';

interface OcrUploaderProps {
  categories: Category[];
  initialSong?: Partial<Song>;
  isEditing?: boolean;
}

export default function OcrUploader({ categories, initialSong, isEditing = false }: OcrUploaderProps) {
  const router = useRouter();

  // Form states
  const [categoryId, setCategoryId] = useState<string>(initialSong?.category_id || (categories[0]?.id || ''));
  const [titleTelugu, setTitleTelugu] = useState<string>(initialSong?.title_telugu || '');
  const [titleRoman, setTitleRoman] = useState<string>(initialSong?.title_roman || '');
  const [slug, setSlug] = useState<string>(initialSong?.slug || '');
  const [lyricsTelugu, setLyricsTelugu] = useState<string>(initialSong?.lyrics_telugu || '');
  const [lyricsRoman, setLyricsRoman] = useState<string>(initialSong?.lyrics_roman || '');
  const [meaningEnglish, setMeaningEnglish] = useState<string>(initialSong?.meaning_english || '');

  const toCleanTags = (val: any): string => {
    if (!val) return '';
    if (Array.isArray(val)) return val.map((v) => String(v).trim()).filter(Boolean).join(', ');
    if (typeof val === 'object') return Object.values(val).map((v) => String(v).trim()).filter(Boolean).join(', ');
    return String(val).trim();
  };

  const [tags, setTags] = useState<string>(toCleanTags(initialSong?.tags || ''));
  const [isLocked, setIsLocked] = useState<boolean>(initialSong?.is_locked !== undefined ? initialSong.is_locked === 1 : true);
  const [price, setPrice] = useState<number>(initialSong?.price || 20);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Auto-generate Roman Title and URL Slug when Telugu Title changes
  const handleTeluguTitleChange = (val: string) => {
    setTitleTelugu(val);
    if (!titleRoman || isEditing === false) {
      const generatedRoman = transliterateTitle(val);
      setTitleRoman(generatedRoman);
      const generatedSlug = generatedRoman
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generatedSlug);
    }
  };

  // When Telugu lyrics are pasted, auto-fill Title if empty
  const handleTeluguLyricsChange = (val: string) => {
    setLyricsTelugu(val);
    if (!titleTelugu.trim()) {
      const firstLine = val.split('\n').map((l) => l.trim()).filter(Boolean)[0];
      if (firstLine) {
        // Clean any leading numbers, symbols
        const cleanTitle = firstLine.replace(/^[0-9.\-\s|]+/, '').replace(/[-|]+.*$/, '').trim().slice(0, 50);
        if (cleanTitle) {
          handleTeluguTitleChange(cleanTitle);
        }
      }
    }
  };

  // Perform full phonetic transliteration of Telugu lyrics to Roman (Standard Local Engine - Zero API required)
  const handleAutoTransliterate = () => {
    if (!lyricsTelugu.trim()) {
      setErrorMsg('Please paste or type Telugu lyrics first.');
      return;
    }
    setErrorMsg(null);
    const roman = transliterateTeluguToRoman(lyricsTelugu);
    setLyricsRoman(roman);

    if (titleTelugu && !titleRoman) {
      const generatedTitleRoman = transliterateTitle(titleTelugu);
      setTitleRoman(generatedTitleRoman);
      if (!slug) {
        setSlug(
          generatedTitleRoman
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
        );
      }
    }
    setSuccessMsg('✨ Roman transliteration generated instantly from Telugu lyrics!');
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Submit / Publish directly to Cloudflare D1
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!titleTelugu.trim() && !titleRoman.trim()) {
      setErrorMsg('Please enter a Title (Roman or Telugu).');
      return;
    }

    if (!lyricsTelugu.trim() && !lyricsRoman.trim()) {
      setErrorMsg('Please enter or paste Lyrics in the editor.');
      return;
    }

    if (!slug.trim()) {
      setErrorMsg('Please provide a unique URL Slug.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        id: initialSong?.id,
        category_id: categoryId,
        title_telugu: titleTelugu || titleRoman,
        title_roman: titleRoman || transliterateTitle(titleTelugu),
        slug: slug.trim(),
        lyrics_telugu: lyricsTelugu || lyricsRoman,
        lyrics_roman: lyricsRoman || transliterateTeluguToRoman(lyricsTelugu),
        meaning_english: meaningEnglish,
        tags: toCleanTags(tags),
        is_locked: isLocked ? 1 : 0,
        price: Number(price) || 20,
      };

      const endpoint = isEditing ? `/api/songs` : `/api/upload`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save devotional song');
      }

      setSuccessMsg(
        isEditing
          ? 'Stotram updated successfully!'
          : 'Stotram published successfully to Cloudflare D1!'
      );

      setTimeout(() => {
        window.location.href = `/song/${payload.slug}`;
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error publishing devotional song');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      
      {/* Direct Lyric Paste Banner */}
      <div className="p-5 sm:p-7 rounded-3xl bg-card-gradient border border-obsidian-border shadow-gold-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gold-radiant/20 border border-gold-antique/40 text-gold-radiant shadow-gold-sm shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white font-cinzel">
              {isEditing ? 'Edit Devotional Stotram' : 'Devotional Lyric Studio (Direct Paste)'}
            </h2>
            <p className="text-xs text-gold-champagne/70 font-sans mt-0.5">
              Copy & paste Telugu lyrics directly. Click &quot;Auto-Transliterate&quot; to generate Roman English pronunciation instantly.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAutoTransliterate}
          disabled={!lyricsTelugu.trim()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold-radiant to-gold-antique text-obsidian text-xs font-bold hover:brightness-110 transition-all disabled:opacity-40 shadow-gold-sm cursor-pointer shrink-0"
          title="Convert Telugu lyrics to Roman phonetic English chanting"
        >
          <Sparkles className="w-4 h-4 text-obsidian shrink-0" />
          <span>Auto-Transliterate to Roman</span>
        </button>
      </div>

      {/* Main Publishing Form */}
      <form onSubmit={handlePublish} className="space-y-6">
        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-sm flex items-center gap-2 font-sans">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-green-950/60 border border-green-500/40 text-green-200 text-sm flex items-center gap-2 font-sans">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Top Metadata Row: Deity Category, Telugu Title, Roman Title, URL Slug */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-5 sm:p-6 rounded-3xl bg-card-gradient border border-obsidian-border">
          {/* Category Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gold-champagne/80 font-sans uppercase tracking-wider block">
              Deity Category *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-obsidian border border-obsidian-border text-white text-sm focus:border-gold-radiant focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_english} ({c.name_telugu})
                </option>
              ))}
            </select>
          </div>

          {/* Telugu Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gold-champagne/80 font-sans uppercase tracking-wider block">
              Title (Telugu Script) *
            </label>
            <input
              type="text"
              value={titleTelugu}
              onChange={(e) => handleTeluguTitleChange(e.target.value)}
              placeholder="e.g. చల్లండి బంతిపూలు"
              className="w-full px-3 py-2.5 rounded-xl bg-obsidian border border-obsidian-border text-white text-sm focus:border-gold-radiant focus:outline-none font-telugu"
            />
          </div>

          {/* Roman Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gold-champagne/80 font-sans uppercase tracking-wider block">
              Title (Roman English) *
            </label>
            <input
              type="text"
              required
              value={titleRoman}
              onChange={(e) => setTitleRoman(e.target.value)}
              placeholder="e.g. Challandi Banthipoolu"
              className="w-full px-3 py-2.5 rounded-xl bg-obsidian border border-obsidian-border text-white text-sm focus:border-gold-radiant focus:outline-none font-sans"
            />
          </div>

          {/* URL Slug */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gold-champagne/80 font-sans uppercase tracking-wider block">
              URL Slug *
            </label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="challandi-banthipoolu"
              className="w-full px-3 py-2.5 rounded-xl bg-obsidian border border-obsidian-border text-white text-sm focus:border-gold-radiant focus:outline-none font-mono text-xs"
            />
          </div>
        </div>

        {/* Dual-Column Lyrics Editor: Telugu (Left/Primary) and Roman (Right/Chanting) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 sm:p-6 rounded-3xl bg-card-gradient border border-obsidian-border">
          {/* Column 1: Telugu Script (Original / Direct Paste) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <label className="text-sm font-bold text-gold-radiant font-sans">
                  Telugu Script (Paste Original Lyrics) *
                </label>
              </div>
              <span className="text-[10px] text-gold-champagne/60 font-sans">
                {lyricsTelugu.split('\n').filter(Boolean).length} lines
              </span>
            </div>
            <textarea
              required
              rows={16}
              value={lyricsTelugu}
              onChange={(e) => handleTeluguLyricsChange(e.target.value)}
              placeholder="ఇక్కడ తెలుగు లిరిక్స్ కాపీ చేసి నేరుగా పేస్ట్ చేయండి...

ఉదాహరణ:
చల్లండి బంతిపూలు - దుర్గమ్మపైన చల్లండి సన్నజాజులు ||2||
1. కంచి కామాక్షిపైన-చల్లండి బంతిపూలు,
మధురా మీనాక్షిపైనచల్లండి బంతిపూలు
కలకత్తా కాళిపైన - చల్లండి బంతిపూలు..."
              className="w-full p-4 rounded-2xl bg-obsidian border border-obsidian-border focus:border-gold-radiant text-stone-100 text-base leading-relaxed font-telugu focus:outline-none resize-y"
            />
          </div>

          {/* Column 2: Roman Pronunciation (English Chanting) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1">
              <label className="text-sm font-bold text-gold-radiant font-sans">
                Roman Pronunciation (English Chanting) *
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoTransliterate}
                  disabled={!lyricsTelugu.trim()}
                  className="text-[11px] font-semibold text-gold-radiant hover:text-white flex items-center gap-1 transition-colors disabled:opacity-40"
                  title="Generate English pronunciation automatically from Telugu"
                >
                  <Sparkles className="w-3.5 h-3.5 text-gold-radiant" />
                  <span>Auto-Transliterate</span>
                </button>
                <span className="text-[10px] text-gold-champagne/60 font-sans">
                  {lyricsRoman.split('\n').filter(Boolean).length} lines
                </span>
              </div>
            </div>
            <textarea
              required
              rows={16}
              value={lyricsRoman}
              onChange={(e) => setLyricsRoman(e.target.value)}
              placeholder="Roman pronunciation will be auto-generated here, or you can paste/edit it directly...

Example:
Challandi banthipoolu - durgammapaina challandi sannajaajulu ||2||
1. Kanchi kaamaakshipaina-challandi banthipoolu..."
              className="w-full p-4 rounded-2xl bg-obsidian border border-obsidian-border focus:border-gold-radiant text-gold-champagne text-sm leading-relaxed font-sans focus:outline-none resize-y"
            />
          </div>
        </div>

        {/* English Meaning Box (Optional) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-card-gradient border border-obsidian-border space-y-2">
          <label className="text-sm font-bold text-gold-radiant font-sans">
            English Meaning & Devotional Significance (Optional)
          </label>
          <textarea
            rows={5}
            value={meaningEnglish}
            onChange={(e) => setMeaningEnglish(e.target.value)}
            placeholder="Optional spiritual meaning, deity background, or verse-by-verse English explanation..."
            className="w-full p-4 rounded-2xl bg-obsidian border border-obsidian-border focus:border-gold-radiant text-stone-200 text-sm leading-relaxed font-sans focus:outline-none resize-y"
          />
        </div>

        {/* Sacred PDF Lock & Offering Setting */}
        <div className="p-5 sm:p-6 rounded-3xl bg-card-gradient border border-gold-antique/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {isLocked ? (
                  <Lock className="w-4 h-4 text-amber-400" />
                ) : (
                  <Unlock className="w-4 h-4 text-emerald-400" />
                )}
                <h3 className="text-sm font-bold text-white font-cinzel">
                  Sacred PDF Download Offering Lock
                </h3>
              </div>
              <p className="text-xs text-gold-champagne/70 font-sans">
                Choose whether this song has free sacred PDF downloads or requires a UPI offering (e.g. ₹20).
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isLocked}
                onChange={(e) => setIsLocked(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-obsidian-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-radiant"></div>
              <span className="ml-3 text-xs font-semibold text-gold-champagne">
                {isLocked ? 'Locked (Paid)' : 'Free Download'}
              </span>
            </label>
          </div>

          {isLocked && (
            <div className="pt-3 border-t border-obsidian-border flex flex-wrap items-center gap-3">
              <label className="text-xs font-semibold text-gold-champagne/90 font-sans">
                PDF Offering Amount (₹ INR):
              </label>
              <div className="relative w-28">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-radiant text-xs font-bold">₹</span>
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={price}
                  onChange={(e) => setPrice(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full pl-7 pr-3 py-1.5 rounded-xl bg-obsidian border border-obsidian-border text-white text-xs font-bold focus:border-gold-radiant focus:outline-none font-mono"
                />
              </div>
              <span className="text-[11px] text-gold-champagne/60 font-sans">
                (Standard: ₹20 • Direct to client ICICI UPI: yaminidesigner124@okicici)
              </span>
            </div>
          )}
        </div>

        {/* Tags Row & Submit Button */}
        <div className="p-4 sm:p-6 rounded-3xl bg-card-gradient border border-obsidian-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="w-full sm:flex-1 min-w-0 space-y-1">
            <label className="text-xs font-semibold text-gold-champagne/80 font-sans uppercase tracking-wider block">
              Search Tags (Comma separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="durga devi, challandi banthipoolu, bhajan, stotram, telugu lyrics"
              className="w-full px-3 py-2 rounded-xl bg-obsidian border border-obsidian-border text-white text-xs focus:border-gold-radiant focus:outline-none font-sans"
            />
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => router.push('/admin/manage')}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-obsidian border border-obsidian-border text-gold-champagne hover:text-white text-xs sm:text-sm font-semibold transition-colors text-center"
            >
              Manage Stotrams
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold-radiant to-gold-antique hover:brightness-110 text-obsidian font-bold text-xs sm:text-sm transition-all shadow-gold-md disabled:opacity-50 text-center cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-obsidian shrink-0" />
                  <span className="truncate">Publishing...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-obsidian shrink-0" />
                  <span className="truncate">{isEditing ? 'Update Stotram' : 'Publish to Cloudflare D1'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
