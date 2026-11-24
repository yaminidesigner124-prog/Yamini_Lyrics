'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Song, Category, RevenueStats } from '@/lib/types';
import { 
  Trash2, ExternalLink, Plus, Eye, Download, Search, RefreshCw, 
  FolderPlus, X, Check, Upload, Image as ImageIcon, LogOut, Shield, 
  ChevronRight, Lock, Unlock, Coins, Receipt, Settings as SettingsIcon,
  Copy, Sparkles, AlertCircle
} from 'lucide-react';

export default function AdminManagePage() {
  const router = useRouter();
  const [songs, setSongs] = useState<Song[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  // Modal states
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Folder creation form
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderSubtitle, setNewFolderSubtitle] = useState('');
  const [newFolderSlug, setNewFolderSlug] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmittingFolder, setIsSubmittingFolder] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings form
  const [tempUpiId, setTempUpiId] = useState('yaminidesigner124@okicici');
  const [tempPrice, setTempPrice] = useState(20);
  const [tempGeminiKey, setTempGeminiKey] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    setIsLoading(true);
    try {
      // 1. Verify Authentication
      const authRes = await fetch('/api/auth');
      const authData = await authRes.json();
      if (!authData.authenticated) {
        router.replace('/admin/login?redirect=/admin/manage');
        return;
      }

      // 2. Fetch Data (Songs, Categories, Revenue/Transactions, Settings)
      const [songsRes, catsRes, txRes, setRes] = await Promise.all([
        fetch('/api/songs'),
        fetch('/api/categories'),
        fetch('/api/transactions'),
        fetch('/api/settings'),
      ]);
      const songsData = await songsRes.json();
      const catsData = await catsRes.json();
      const txData = await txRes.json();
      const setData = await setRes.json().catch(() => ({}));

      setSongs(songsData.songs || []);
      setCategories(catsData.categories || []);
      setRevenueStats(txData || null);
      if (txData?.upiId) setTempUpiId(txData.upiId);
      if (txData?.defaultPrice) setTempPrice(txData.defaultPrice);
      if (setData?.geminiApiKey) setTempGeminiKey(setData.geminiApiKey);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' });
      router.replace('/admin/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setIsSubmittingFolder(true);
    try {
      const finalSlug = (newFolderSlug || newFolderName)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      let iconPath = `/assets/deities/${finalSlug}.png`;

      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('slug', finalSlug);

        const uploadRes = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          if (uploadData.iconPath) {
            iconPath = uploadData.iconPath;
          }
        }
      }

      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name_english: newFolderName.trim(),
          name_telugu: newFolderName.trim(),
          slug: finalSlug,
          subtitle_english: newFolderSubtitle.trim() || 'Sacred Devotional Folder',
          icon: iconPath,
          display_order: categories.length + 1,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create category');
      }

      setMessage(`Deity folder "${newFolderName}" created successfully!`);
      setShowFolderModal(false);
      setNewFolderName('');
      setNewFolderSubtitle('');
      setNewFolderSlug('');
      setImageFile(null);
      setImagePreview(null);
      checkAuthAndFetch();
      setTimeout(() => setMessage(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Error creating folder');
    } finally {
      setIsSubmittingFolder(false);
    }
  };

  const handleToggleLock = async (song: Song) => {
    const newLocked = song.is_locked === 1 ? 0 : 1;
    try {
      const res = await fetch('/api/songs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: song.id,
          is_locked: newLocked,
          price: song.price || 20,
        }),
      });

      if (res.ok) {
        setSongs((prev) =>
          prev.map((s) => (s.id === song.id ? { ...s, is_locked: newLocked } : s))
        );
        setMessage(
          `Updated "${song.title_roman}" to ${
            newLocked === 1 ? `Locked (₹${song.price || 20})` : 'Free Download'
          }`
        );
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (err) {
      console.error('Error toggling lock:', err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          upiId: tempUpiId.trim(),
          defaultPrice: tempPrice,
          geminiApiKey: tempGeminiKey.trim(),
        }),
      });

      if (res.ok) {
        setMessage('UPI settings updated successfully!');
        setShowSettingsModal(false);
        checkAuthAndFetch();
        setTimeout(() => setMessage(null), 3000);
      } else {
        alert('Failed to save settings');
      }
    } catch (err: any) {
      alert(err.message || 'Error saving settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this devotional song?')) return;
    try {
      const res = await fetch(`/api/songs?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSongs((prev) => prev.filter((s) => s.id !== id));
        setMessage('Stotram deleted successfully.');
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (err) {
      console.error('Error deleting song:', err);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete deity folder "${name}"? Songs inside it will also be deleted.`)) return;
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete folder');

      setMessage(`Deity folder "${name}" deleted successfully.`);
      checkAuthAndFetch();
      setTimeout(() => setMessage(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Error deleting category');
    }
  };

  const filtered = songs.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.title_roman.toLowerCase().includes(q) ||
      s.title_telugu.toLowerCase().includes(q) ||
      (s.category_name_english || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
      
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-obsidian-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-radiant/15 border border-gold-radiant/35 flex items-center justify-center text-gold-radiant shadow-gold-sm">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white font-cinzel">
              Yamini Lyrics Admin Studio
            </h1>
            <p className="text-xs text-gold-champagne/70 font-sans">
              Folders: {categories.length} | Stotrams: {songs.length} • PIN Protected
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-obsidian border border-obsidian-border hover:border-gold-antique/50 text-gold-champagne hover:text-white font-semibold text-xs sm:text-sm transition-all"
            title="UPI & Price Settings"
          >
            <SettingsIcon className="w-4 h-4 text-gold-radiant" />
            <span>UPI Settings</span>
          </button>

          <button
            onClick={() => setShowFolderModal(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-obsidian-secondary border border-gold-antique/50 hover:border-gold-radiant text-gold-champagne hover:text-white font-semibold text-xs sm:text-sm transition-all shadow-gold-sm"
          >
            <FolderPlus className="w-4 h-4 text-gold-radiant" />
            <span>+ Create Folder</span>
          </button>

          <Link
            href="/admin/upload"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-gold-radiant to-gold-antique text-obsidian font-bold text-xs sm:text-sm hover:brightness-110 transition-all shadow-gold-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Stotram</span>
          </Link>

          <button
            onClick={handleLogout}
            title="Log Out of Admin"
            className="p-2 rounded-xl bg-obsidian border border-obsidian-border text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs font-sans flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{message}</span>
        </div>
      )}

      {/* Revenue & Downloads Analytics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Card 1: Total Revenue */}
        <div className="p-4 sm:p-5 rounded-3xl bg-card-gradient border border-gold-radiant/30 relative overflow-hidden backdrop-blur-xl shadow-gold-sm">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold text-gold-champagne/70 font-sans uppercase tracking-wider">
              Total UPI Revenue
            </span>
            <div className="w-8 h-8 rounded-xl bg-gold-radiant/15 border border-gold-radiant/40 flex items-center justify-center text-gold-radiant">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-cinzel">
            ₹{revenueStats?.totalRevenue || 0}
          </div>
          <p className="text-[11px] text-emerald-400 font-sans mt-1 flex items-center gap-1">
            <Check className="w-3 h-3" /> Direct to Client Bank Account
          </p>
        </div>

        {/* Card 2: Paid PDF Downloads */}
        <div className="p-4 sm:p-5 rounded-3xl bg-card-gradient border border-obsidian-border relative overflow-hidden backdrop-blur-xl shadow-gold-sm">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold text-gold-champagne/70 font-sans uppercase tracking-wider">
              Paid PDF Downloads
            </span>
            <div className="w-8 h-8 rounded-xl bg-gold-antique/15 border border-gold-antique/40 flex items-center justify-center text-gold-antique">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-cinzel">
            {revenueStats?.totalTransactions || 0}
          </div>
          <button
            onClick={() => setShowTxModal(true)}
            className="text-[11px] text-gold-radiant hover:underline font-semibold font-sans mt-1 flex items-center gap-1"
          >
            <span>View All Transaction UTRs →</span>
          </button>
        </div>

        {/* Card 3: Active Client UPI ID */}
        <div className="p-4 sm:p-5 rounded-3xl bg-card-gradient border border-obsidian-border relative overflow-hidden backdrop-blur-xl shadow-gold-sm">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold text-gold-champagne/70 font-sans uppercase tracking-wider">
              Active Client UPI ID
            </span>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="text-gold-champagne/60 hover:text-white"
              title="Change UPI ID"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
          <div className="text-sm sm:text-base font-bold font-mono text-gold-champagne truncate select-all">
            {revenueStats?.upiId || 'yaminidesigner124@okicici'}
          </div>
          <p className="text-[11px] text-gold-champagne/60 font-sans mt-1">
            Default Price: ₹{revenueStats?.defaultPrice || 20} per PDF
          </p>
        </div>
      </div>

      {/* Deity Folders Grid Overview */}
      <div className="p-4 sm:p-5 rounded-3xl bg-obsidian-secondary/70 border border-obsidian-border space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gold-radiant uppercase tracking-wider font-cinzel">
            Active Deity Folders ({categories.length})
          </span>
          <button
            onClick={() => setShowFolderModal(true)}
            className="text-xs text-gold-radiant hover:underline font-semibold"
          >
            + Add New Deity Folder
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {categories.map((c) => (
            <div
              key={c.id}
              className="p-2.5 rounded-2xl bg-obsidian border border-obsidian-border hover:border-gold-radiant/50 text-xs text-gold-champagne flex items-center justify-between gap-2.5 transition-all group"
            >
              <div className="flex items-center gap-2 truncate">
                <img
                  src={c.icon || `/assets/deities/${c.slug}.png`}
                  alt=""
                  className="w-7 h-7 rounded-full object-cover border border-gold-antique/40 shrink-0"
                />
                <div className="truncate">
                  <div className="font-semibold text-white truncate">{c.name_english}</div>
                  <div className="text-[10px] text-gold-champagne/60 font-telugu truncate">{c.name_telugu}</div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Link
                  href={`/category/${c.slug}`}
                  target="_blank"
                  className="p-1 rounded-lg text-gold-champagne/60 hover:text-white"
                  title="View Category Page"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>

                <button
                  onClick={() => handleDeleteCategory(c.id, c.name_english)}
                  className="p-1 rounded-lg text-red-400/60 hover:text-red-300"
                  title="Delete Category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stotrams List & Search */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white font-cinzel">
              All Stotrams & Hymns ({songs.length})
            </h2>
            <p className="text-xs text-gold-champagne/60 font-sans">
              Click the lock badge on any song to toggle between Free and Paid (₹20) PDF download.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gold-champagne/50" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search stotrams or deities..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-obsidian border border-obsidian-border text-white text-xs focus:border-gold-radiant focus:outline-none"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-gold-radiant font-cinzel text-sm">
            Loading stotrams and folders...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-obsidian-secondary/40 border border-obsidian-border text-gold-champagne/60 text-sm">
            No stotrams found. Click &quot;Add Stotram&quot; to ingest your first song.
          </div>
        ) : (
          <div className="rounded-3xl bg-card-gradient border border-obsidian-border overflow-hidden">
            <div className="divide-y divide-white/5">
              {filtered.map((song) => (
                <div
                  key={song.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-gold-radiant/10 border border-gold-radiant/30 text-gold-radiant text-[10px] font-semibold">
                        {song.category_name_english}
                      </span>
                      <span className="text-[11px] text-gold-champagne/60 font-sans flex items-center gap-1">
                        <Eye className="w-3 h-3 text-gold-antique" />
                        {song.view_count || 0}
                      </span>
                      <span className="text-[11px] text-gold-champagne/60 font-sans flex items-center gap-1">
                        <Download className="w-3 h-3 text-gold-antique" />
                        {song.download_count || 0}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-white font-cinzel">
                      {song.title_roman}
                    </h3>
                    <p className="text-xs text-stone-300 font-telugu">
                      {song.title_telugu}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 sm:pt-0 self-end sm:self-auto flex-wrap">
                    {/* Lock / Free Toggle Button */}
                    <button
                      onClick={() => handleToggleLock(song)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                        song.is_locked === 1
                          ? 'bg-amber-950/40 border-amber-500/50 text-amber-300 hover:bg-amber-900/50'
                          : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/50'
                      }`}
                      title="Click to toggle Free vs Locked"
                    >
                      {song.is_locked === 1 ? (
                        <>
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Locked (₹{song.price || 20})</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Free PDF</span>
                        </>
                      )}
                    </button>

                    <Link
                      href={`/song/${song.slug}`}
                      target="_blank"
                      className="p-2 rounded-xl bg-obsidian border border-obsidian-border hover:border-gold-radiant/40 text-gold-champagne hover:text-white transition-colors"
                      title="View Public Stotram"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>

                    <button
                      onClick={() => handleDelete(song.id)}
                      className="p-2 rounded-xl bg-obsidian border border-obsidian-border hover:border-red-500/50 text-red-400 hover:text-red-300 transition-colors"
                      title="Delete Stotram"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Transactions & UTR Audit Log */}
      {showTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-3xl p-6 sm:p-8 rounded-3xl bg-card-gradient border border-gold-antique/40 shadow-2xl space-y-5 my-auto animate-fade-in text-white">
            <div className="flex items-center justify-between pb-3 border-b border-obsidian-border">
              <div className="flex items-center gap-2.5">
                <Receipt className="w-5 h-5 text-gold-radiant" />
                <h3 className="text-base sm:text-lg font-bold text-white font-cinzel">
                  Paid Downloads & UTR Audit Log
                </h3>
              </div>
              <button
                onClick={() => setShowTxModal(false)}
                className="p-1.5 rounded-xl bg-obsidian text-gold-champagne/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gold-champagne/70 font-sans">
              Every ₹20 payment submitted by devotees to unlock print-ready PDFs. Directly matches bank SMS / GPay receipts.
            </p>

            {(!revenueStats?.recentTransactions || revenueStats.recentTransactions.length === 0) ? (
              <div className="p-8 text-center text-gold-champagne/50 text-xs border border-obsidian-border rounded-2xl">
                No paid downloads recorded yet. When users pay and enter UTR numbers, they will appear here in real time.
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto rounded-2xl border border-obsidian-border divide-y divide-white/5">
                {revenueStats.recentTransactions.map((tx) => (
                  <div key={tx.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="font-semibold text-white font-cinzel">{tx.song_title}</div>
                      <div className="text-[11px] text-gold-champagne/60">
                        By {tx.user_name || 'Devotee'} • {tx.created_at}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono bg-obsidian px-2.5 py-1 rounded-lg border border-obsidian-border text-gold-radiant text-[11px]">
                        UTR: {tx.utr_number}
                      </span>
                      <span className="font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                        +₹{tx.amount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: UPI ID & Default Price Settings */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl bg-card-gradient border border-gold-antique/40 shadow-2xl space-y-5 my-auto animate-fade-in text-white">
            <div className="flex items-center justify-between pb-3 border-b border-obsidian-border">
              <div className="flex items-center gap-2.5">
                <SettingsIcon className="w-5 h-5 text-gold-radiant" />
                <h3 className="text-base sm:text-lg font-bold text-white font-cinzel">
                  Client UPI & Offering Settings
                </h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-xl bg-obsidian text-gold-champagne/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gold-champagne/90 font-sans uppercase tracking-wider block">
                  Client Bank UPI ID (GPay / PhonePe / ICICI) *
                </label>
                <input
                  type="text"
                  required
                  value={tempUpiId}
                  onChange={(e) => setTempUpiId(e.target.value)}
                  placeholder="e.g. yaminidesigner124@okicici"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian border border-obsidian-border text-white text-xs font-mono focus:border-gold-radiant focus:outline-none"
                />
                <p className="text-[10px] text-gold-champagne/50">
                  Payments made via QR and GPay buttons will credit directly to this UPI address.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gold-champagne/90 font-sans uppercase tracking-wider block">
                  Default PDF Price (₹ INR)
                </label>
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={tempPrice}
                  onChange={(e) => setTempPrice(parseInt(e.target.value) || 20)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian border border-obsidian-border text-white text-xs font-mono focus:border-gold-radiant focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gold-radiant font-sans uppercase tracking-wider block">
                    ✨ Gemini AI API Key (Vision & OCR)
                  </label>
                  <span className="text-[10px] text-emerald-400 font-sans">Active & Verified</span>
                </div>
                <input
                  type="password"
                  value={tempGeminiKey}
                  onChange={(e) => setTempGeminiKey(e.target.value)}
                  placeholder="AIzaSy... or AQ.Ab8..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian border border-obsidian-border text-white text-xs font-mono focus:border-gold-radiant focus:outline-none"
                />
                <p className="text-[10px] text-gold-champagne/50">
                  Used by Admin Studio to extract 100% accurate Telugu lyrics from photos & screenshots.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSavingSettings}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-gold-radiant to-gold-antique text-obsidian font-bold text-xs sm:text-sm hover:brightness-110 transition-all shadow-gold-sm disabled:opacity-50"
              >
                {isSavingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Deity Folder */}
      {showFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl bg-card-gradient border border-gold-antique/40 shadow-2xl space-y-5 my-auto animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-obsidian-border">
              <div className="flex items-center gap-2.5">
                <FolderPlus className="w-5 h-5 text-gold-radiant" />
                <h3 className="text-base sm:text-lg font-bold text-white font-cinzel">
                  Create Deity Folder
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowFolderModal(false);
                  setImageFile(null);
                  setImagePreview(null);
                }}
                className="p-1.5 rounded-xl bg-obsidian text-gold-champagne/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gold-champagne/80 font-sans uppercase tracking-wider block">
                  Deity Photo / Image Upload
                </label>
                
                <div className="flex items-center gap-4 p-3 rounded-2xl bg-obsidian border border-obsidian-border">
                  <div className="w-16 h-16 rounded-2xl border-2 border-gold-radiant/40 bg-obsidian-secondary overflow-hidden shrink-0 flex items-center justify-center shadow-gold-sm">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Deity Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-gold-champagne/40" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gold-radiant/15 hover:bg-gold-radiant/25 border border-gold-radiant/40 text-gold-radiant text-xs font-semibold transition-all"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{imageFile ? 'Change Photo' : 'Upload Deity Photo'}</span>
                    </button>
                    <p className="text-[11px] text-gold-champagne/50 font-sans">
                      {imageFile ? imageFile.name : 'PNG or JPG (recommended portrait)'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gold-champagne/80 font-sans uppercase tracking-wider">
                  Deity Name (English) *
                </label>
                <input
                  type="text"
                  required
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. Lord Subrahmanya Swamy"
                  className="w-full px-3 py-2 rounded-xl bg-obsidian border border-obsidian-border text-white text-xs focus:border-gold-radiant focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gold-champagne/80 font-sans uppercase tracking-wider">
                  Subtitle / Significance
                </label>
                <input
                  type="text"
                  value={newFolderSubtitle}
                  onChange={(e) => setNewFolderSubtitle(e.target.value)}
                  placeholder="e.g. Kartikeya, Murugan & Commander of Divine Army"
                  className="w-full px-3 py-2 rounded-xl bg-obsidian border border-obsidian-border text-white text-xs focus:border-gold-radiant focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gold-champagne/80 font-sans uppercase tracking-wider">
                  URL Slug (Optional)
                </label>
                <input
                  type="text"
                  value={newFolderSlug}
                  onChange={(e) => setNewFolderSlug(e.target.value)}
                  placeholder="e.g. lord-subrahmanya"
                  className="w-full px-3 py-2 rounded-xl bg-obsidian border border-obsidian-border text-white text-xs font-mono focus:border-gold-radiant focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingFolder}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-gold-radiant to-gold-antique text-obsidian font-bold text-xs sm:text-sm hover:brightness-110 transition-all shadow-gold-sm disabled:opacity-50"
              >
                {isSubmittingFolder ? 'Creating Folder...' : 'Create Deity Folder'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
