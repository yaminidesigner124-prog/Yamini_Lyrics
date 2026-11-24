'use client';

import React, { useState, useEffect } from 'react';
import { Song } from '@/lib/types';
import { Copy, Check, Share2, FileDown, Columns, BookOpen, Languages, Lock } from 'lucide-react';
import PdfGenerator from './PdfGenerator';
import PdfUnlockModal from './PdfUnlockModal';
import { useLanguage } from '@/context/LanguageContext';

interface LyricsViewerProps {
  song: Song;
}

export default function LyricsViewer({ song }: LyricsViewerProps) {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'telugu' | 'roman' | 'meaning' | 'side-by-side'>(
    language === 'te' ? 'telugu' : 'roman'
  );
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if current user is logged-in Admin or has previously unlocked in this session
  useEffect(() => {
    // 1. Check if caller is Admin (Admin has 100% free master access)
    fetch('/api/auth')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.authenticated) {
          setIsAdmin(true);
        }
      })
      .catch(() => {});

    // 2. Check if song was previously unlocked in this browser session
    try {
      if (typeof window !== 'undefined' && sessionStorage.getItem(`unlocked_${song.id}`) === 'true') {
        setIsUnlocked(true);
      }
    } catch {}
  }, [song.id]);

  // Sync initial tab when language changes if user hasn't explicitly customized
  useEffect(() => {
    if (language === 'te' && activeTab === 'roman') {
      setActiveTab('telugu');
    } else if (language === 'en' && activeTab === 'telugu') {
      setActiveTab('roman');
    }
  }, [language]);

  const isEffectivelyLocked = !isAdmin && song.is_locked === 1 && !isUnlocked;

  const splitLyrics = (text: string) => {
    const lines = (text || '').split('\n').filter((l) => l.trim().length > 0);
    const preview = lines.slice(0, 2).join('\n\n');
    const remainder = lines.slice(2).join('\n\n') || lines.join('\n\n');
    return { preview, remainder };
  };

  const fontSizes = {
    sm: { telugu: 'text-base sm:text-lg leading-relaxed', roman: 'text-sm sm:text-base leading-relaxed', meaning: 'text-xs sm:text-sm leading-relaxed' },
    md: { telugu: 'text-lg sm:text-xl leading-loose', roman: 'text-base sm:text-lg leading-loose', meaning: 'text-sm sm:text-base leading-relaxed' },
    lg: { telugu: 'text-xl sm:text-2xl leading-loose', roman: 'text-lg sm:text-xl leading-loose', meaning: 'text-base sm:text-lg leading-relaxed' },
  };

  const handleCopy = () => {
    let textToCopy = '';
    if (activeTab === 'roman') {
      textToCopy = `${song.title_roman}\n\n${song.lyrics_roman}`;
    } else if (activeTab === 'meaning') {
      textToCopy = `${song.title_english || song.title_roman}\n\nEnglish Meaning:\n${song.meaning_english || 'Meaning not available'}`;
    } else {
      textToCopy = `${song.title_telugu}\n\n${song.lyrics_telugu}`;
    }

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${language === 'te' ? song.title_telugu : song.title_roman} - Devotional Stotram`,
          text: `Sacred Stotram: ${language === 'te' ? song.title_telugu : song.title_roman} with English Meaning & PDF download`,
          url: window.location.href,
        });
      } catch {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Controls Bar with Clean Toggled Labels - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-obsidian-secondary/90 border border-obsidian-border shadow-gold-sm backdrop-blur-xl">
        
        {/* Multi-Tab Switcher with Smooth Horizontal Scroll on Mobile */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar p-1 rounded-xl sm:rounded-2xl bg-obsidian border border-obsidian-border text-xs sm:text-sm w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('roman')}
            className={`shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-sans font-semibold transition-all duration-200 ${
              activeTab === 'roman'
                ? 'bg-gradient-to-r from-gold-radiant to-gold-antique text-obsidian shadow-gold-sm font-bold'
                : 'text-gold-champagne/70 hover:text-white hover:bg-white/5'
            }`}
          >
            {t('song.tabRoman')}
          </button>

          <button
            onClick={() => setActiveTab('meaning')}
            className={`shrink-0 flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-sans font-semibold transition-all duration-200 ${
              activeTab === 'meaning'
                ? 'bg-gradient-to-r from-gold-radiant to-gold-antique text-obsidian shadow-gold-sm font-bold'
                : 'text-gold-champagne/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{t('song.tabMeaning')}</span>
          </button>

          <button
            onClick={() => setActiveTab('telugu')}
            className={`shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-sans font-semibold transition-all duration-200 ${
              activeTab === 'telugu'
                ? 'bg-gradient-to-r from-gold-radiant to-gold-antique text-obsidian shadow-gold-sm font-bold'
                : 'text-gold-champagne/70 hover:text-white hover:bg-white/5'
            }`}
          >
            {t('song.tabTelugu')}
          </button>

          <button
            onClick={() => setActiveTab('side-by-side')}
            className={`shrink-0 hidden lg:flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-semibold transition-all duration-200 ${
              activeTab === 'side-by-side'
                ? 'bg-gradient-to-r from-gold-radiant to-gold-antique text-obsidian shadow-gold-sm font-bold'
                : 'text-gold-champagne/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>{t('song.tabSide')}</span>
          </button>
        </div>

        {/* Action Controls: Font Size, Copy, Share, PDF */}
        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
          {/* Font Size Selector */}
          <div className="flex items-center rounded-xl bg-obsidian border border-obsidian-border p-1 text-xs text-gold-champagne/70">
            <button
              onClick={() => setFontSize('sm')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${fontSize === 'sm' ? 'bg-white/10 text-gold-radiant font-bold' : 'hover:text-white'}`}
              title="Small text size"
            >
              A-
            </button>
            <button
              onClick={() => setFontSize('md')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${fontSize === 'md' ? 'bg-white/10 text-gold-radiant font-bold' : 'hover:text-white'}`}
              title="Medium text size"
            >
              A
            </button>
            <button
              onClick={() => setFontSize('lg')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${fontSize === 'lg' ? 'bg-white/10 text-gold-radiant font-bold' : 'hover:text-white'}`}
              title="Large text size"
            >
              A+
            </button>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-obsidian border border-obsidian-border hover:border-gold-antique/50 text-gold-champagne/80 hover:text-white text-xs transition-all duration-200"
            title="Copy Current View"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-gold-antique" />}
            <span className="hidden sm:inline">{copied ? t('song.copied') : t('song.copy')}</span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-obsidian border border-obsidian-border hover:border-gold-antique/50 text-gold-champagne/80 hover:text-white text-xs transition-all duration-200"
            title="Share Stotram"
          >
            {shared ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-gold-radiant" />}
            <span className="hidden sm:inline">{shared ? 'Link Copied!' : t('song.share')}</span>
          </button>

          {/* Download PDF Trigger Button */}
          <button
            onClick={() => {
              // Admin gets 100% free master access. Regular users pay if locked.
              if (!isAdmin && song.is_locked === 1 && !isUnlocked) {
                setShowUnlockModal(true);
              } else {
                setShowPdfModal(true);
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-gold-radiant to-gold-antique hover:brightness-110 text-obsidian font-bold text-xs transition-all duration-300 shadow-gold-sm hover:scale-105"
          >
            {isAdmin ? (
              <>
                <FileDown className="w-3.5 h-3.5 text-obsidian" />
                <span>{t('song.downloadPdf')} (Admin Free)</span>
              </>
            ) : song.is_locked === 1 && !isUnlocked ? (
              <>
                <Lock className="w-3.5 h-3.5 text-obsidian" />
                <span>{t('song.downloadPdf')} (₹{song.price || 20})</span>
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5 text-obsidian" />
                <span>{t('song.downloadPdf')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Lyrics & Meaning Display Area */}
      <div className="rounded-3xl bg-card-gradient border border-obsidian-border p-6 sm:p-12 relative overflow-hidden backdrop-blur-xl shadow-gold-md animate-fade-in">
        
        {/* Subtle Sacred Om Watermark with Slow Pulsing Halo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none opacity-[0.035] text-[220px] sm:text-[340px] font-serif text-gold-radiant animate-pulse-subtle">
          ॐ
        </div>

        {/* Admin Master Badge */}
        {isAdmin && (
          <div className="mb-6 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-semibold shadow-sm">
            <span>👑 Admin Master View • 100% Free Full Access</span>
          </div>
        )}

        {/* 0. PAYWALL BLURRED PREVIEW MODE FOR NON-ADMIN LOCKED USERS */}
        {isEffectivelyLocked ? (
          <div className="relative space-y-4">
            {/* Unblurred 2-line Teaser */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gold-radiant/80 font-sans block">
                {activeTab === 'telugu' ? 'పరిచయం (Preview)' : 'Introduction (Preview)'}
              </span>
              <div className={`whitespace-pre-wrap text-gold-champagne/95 ${activeTab === 'telugu' ? 'font-telugu' : 'font-sans'} ${fontSizes[fontSize][activeTab === 'telugu' ? 'telugu' : 'roman']}`}>
                {activeTab === 'telugu' ? splitLyrics(song.lyrics_telugu).preview : splitLyrics(song.lyrics_roman).preview}
              </div>
            </div>

            {/* Heavily Blurred Remainder */}
            <div className="relative pt-2">
              <div className={`filter blur-md select-none pointer-events-none opacity-20 max-h-72 overflow-hidden leading-loose ${activeTab === 'telugu' ? 'font-telugu' : 'font-sans'} ${fontSizes[fontSize][activeTab === 'telugu' ? 'telugu' : 'roman']}`}>
                {activeTab === 'telugu' ? splitLyrics(song.lyrics_telugu).remainder : splitLyrics(song.lyrics_roman).remainder}
              </div>

              {/* Centered Sacred Gold Paywall Lock Overlay Card */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-3 sm:p-6 text-center z-20">
                <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-obsidian-secondary/95 border-2 border-gold-antique/60 shadow-2xl backdrop-blur-2xl space-y-4 animate-scale-up">
                  <div className="w-14 h-14 rounded-2xl bg-gold-radiant/20 border border-gold-radiant/50 flex items-center justify-center text-gold-radiant shadow-gold-sm mx-auto animate-pulse">
                    <Lock className="w-7 h-7" />
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-lg sm:text-xl font-bold text-white font-cinzel">
                      Sacred Lyrics &amp; PDF Locked
                    </h3>
                    <p className="text-xs text-gold-champagne/80 font-sans leading-relaxed">
                      This stotram is locked. Pay a nominal seva fee of <strong className="text-gold-radiant font-bold">₹{song.price || 20}</strong> to unlock complete unblurred lyrics and download the print-ready temple border A4 PDF.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowUnlockModal(true)}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-gold-radiant to-gold-antique text-obsidian font-bold text-xs sm:text-sm tracking-wide shadow-gold-sm hover:brightness-110 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
                  >
                    <Lock className="w-4 h-4 text-obsidian" />
                    <span>Pay ₹{song.price || 20} &amp; Unlock Full Lyrics + PDF</span>
                  </button>

                  <p className="text-[10px] text-gold-champagne/50 font-sans">
                    Instant 1-click verification via PhonePe, Google Pay, Paytm, or BHIM UPI
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Normal Full Unblurred View for Admin or Unlocked Users */
          <>
            {/* 1. SIDE-BY-SIDE MODE */}
            {activeTab === 'side-by-side' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-gold-antique/15 animate-slide-up">
                {/* Column 1: Roman Pronunciation */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-gold-antique/20 text-gold-radiant font-sans font-bold text-sm tracking-wide">
                    <span>{language === 'en' ? 'Roman Pronunciation (English Chanting)' : 'రోమన్ ఉచ్ఛారణ (ఆంగ్ల అక్షరాలు)'}</span>
                  </div>
                  <div className={`font-sans whitespace-pre-wrap text-gold-champagne/95 ${fontSizes[fontSize].roman}`}>
                    {song.lyrics_roman}
                  </div>
                </div>

                {/* Column 2: Telugu Script */}
                <div className="pt-6 md:pt-0 md:pl-8 space-y-4">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-gold-antique/20 text-gold-radiant font-sans font-bold text-sm tracking-wide">
                    <span>{language === 'en' ? 'Telugu Script' : 'స్వచ్ఛమైన తెలుగు లిపి'}</span>
                  </div>
                  <div className={`font-telugu whitespace-pre-wrap text-stone-100 ${fontSizes[fontSize].telugu}`}>
                    {song.lyrics_telugu}
                  </div>
                </div>
              </div>
            )}

            {/* 2. ROMAN TELUGU ONLY */}
            {activeTab === 'roman' && (
              <div className="max-w-2xl mx-auto animate-slide-up">
                <div className={`font-sans whitespace-pre-wrap text-gold-champagne/95 ${fontSizes[fontSize].roman}`}>
                  {song.lyrics_roman}
                </div>
              </div>
            )}

            {/* 3. TELUGU SCRIPT ONLY */}
            {activeTab === 'telugu' && (
              <div className="max-w-2xl mx-auto animate-slide-up">
                <div className={`font-telugu whitespace-pre-wrap text-stone-100 ${fontSizes[fontSize].telugu}`}>
                  {song.lyrics_telugu}
                </div>
              </div>
            )}

            {/* 4. ENGLISH MEANING TAB */}
            {activeTab === 'meaning' && (
              <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
                <div className="p-4 rounded-2xl bg-obsidian/80 border border-gold-antique/30 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold-radiant/15 border border-gold-radiant/30 flex items-center justify-center text-gold-radiant">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-cinzel">
                      {language === 'en' ? 'English Meaning & Spiritual Significance' : 'ఆంగ్ల భావార్థం & ఆధ్యాత్మిక విశేషాలు'}
                    </h3>
                    <p className="text-xs text-gold-champagne/70 font-sans">
                      {language === 'en'
                        ? 'Comprehensive verse-by-verse translation for easy understanding & daily chanting'
                        : 'ప్రతి శ్లోక సమగ్ర భావార్థం మరియు ఆధ్యాత్మిక విశిష్టత'}
                    </p>
                  </div>
                </div>

                {song.meaning_english ? (
                  <div className={`font-sans whitespace-pre-wrap text-stone-200 leading-relaxed ${fontSizes[fontSize].meaning} space-y-4 bg-obsidian-secondary/40 p-6 rounded-2xl border border-obsidian-border`}>
                    {song.meaning_english}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gold-champagne/60 text-sm font-sans">
                    {language === 'en'
                      ? 'English translation will be updated shortly for this stotram.'
                      : 'ఈ స్తోత్రానికి ఆంగ్ల భావార్థం త్వరలోనే పొందుపరచబడుతుంది.'}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Sacred Ending Blessing Marker */}
        <div className="mt-14 pt-8 border-t border-gold-antique/20 flex flex-col items-center justify-center text-center">
          <div className="text-lg sm:text-xl text-gold-radiant font-serif mb-1 select-none tracking-widest font-cinzel">
            {language === 'en' ? 'May Peace and Auspiciousness Prevail' : 'లోకాః సమస్తాః సుఖినో భవన్తు • శుభం భూయాత్'}
          </div>
          <p className="text-xs text-gold-champagne/60 font-sans">
            {language === 'en'
              ? 'Chant with pure devotion • Shared for universal spiritual well-being'
              : 'నిత్య పారాయణకు అనుకూలం • విశ్వ శాంతి మరియు సకల శుభములకై'}
          </p>
        </div>
      </div>

      {/* Sacred PDF Unlock Modal */}
      <PdfUnlockModal
        isOpen={showUnlockModal}
        song={song}
        onClose={() => setShowUnlockModal(false)}
        onUnlockSuccess={() => {
          setIsUnlocked(true);
          setShowPdfModal(true);
        }}
      />

      {/* Sacred PDF Modal */}
      {showPdfModal && (
        <PdfGenerator song={song} onClose={() => setShowPdfModal(false)} />
      )}
    </div>
  );
}
