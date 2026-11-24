'use client';

import React, { useState, useEffect } from 'react';
import { Song } from '@/lib/types';
import { X, Lock, Check, Copy, ExternalLink, ShieldCheck, Sparkles, Loader2, AlertCircle, QrCode } from 'lucide-react';

interface PdfUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: Song;
  onUnlockSuccess: () => void;
}

export default function PdfUnlockModal({ isOpen, onClose, song, onUnlockSuccess }: PdfUnlockModalProps) {
  const [upiId, setUpiId] = useState('yaminidesigner124@okicici');
  const [upiName, setUpiName] = useState('Yamini Lyrics');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [userName, setUserName] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const price = song.price || 20;

  useEffect(() => {
    // Fetch live settings if available
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.upiId) setUpiId(data.upiId);
        if (data.upiName) setUpiName(data.upiName);
      })
      .catch(() => {});
  }, []);

  if (!isOpen) return null;

  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${price}&tn=${encodeURIComponent(`Sacred PDF ${song.title_roman}`)}&cu=INR`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&color=07090e&bgcolor=ffffff&data=${encodeURIComponent(upiDeepLink)}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleVerifyPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanUtr = utrNumber.trim();
    if (!cleanUtr || cleanUtr.length < 6) {
      setErrorMsg('Please enter a valid 12-digit UPI Reference / UTR Number from your payment app.');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          song_id: song.id,
          song_title: song.title_roman || song.title_telugu,
          amount: price,
          utr_number: cleanUtr,
          user_name: userName.trim() || 'Devotee',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Verification failed. Please check your UTR number.');
      }

      // Store unlock in sessionStorage so user doesn't get prompted again in this session
      try {
        sessionStorage.setItem(`unlocked_${song.id}`, 'true');
      } catch {}

      // Trigger instant PDF download
      onUnlockSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-lg bg-obsidian-secondary border border-gold-antique/50 rounded-3xl shadow-2xl p-5 sm:p-7 my-auto text-white space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-obsidian border border-obsidian-border text-gold-champagne/70 hover:text-white hover:border-gold-antique/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Sacred Header Banner */}
        <div className="text-center space-y-2 pt-1">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gold-radiant/15 border border-gold-antique/50 text-gold-radiant shadow-gold-sm">
            <Lock className="w-7 h-7 text-gold-radiant" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-cinzel text-white">
            Unlock Sacred Print-ready PDF
          </h2>
          <p className="text-xs text-gold-champagne/80 font-sans max-w-xs mx-auto">
            {song.title_telugu} • {song.title_roman}
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-radiant/20 border border-gold-radiant/50 text-gold-radiant font-bold text-sm shadow-gold-sm">
            <Sparkles className="w-4 h-4" />
            <span>Offering / Dakshina: ₹{price}</span>
          </div>
        </div>

        {/* Step 1: Payment Options (Mobile 1-Click & Desktop QR) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-obsidian border border-obsidian-border space-y-4">
          <div className="flex items-center justify-between text-xs text-gold-champagne/75 font-sans border-b border-obsidian-border pb-2.5">
            <span className="font-semibold text-gold-radiant">Step 1: Pay via UPI</span>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Instant Bank Direct
            </span>
          </div>

          {/* 1-Click Pay on Mobile Apps */}
          <a
            href={upiDeepLink}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-gold-radiant to-gold-antique text-obsidian font-bold text-sm hover:brightness-110 shadow-gold-sm transition-all hover:scale-[1.02] text-center"
          >
            <span>Pay ₹{price} via GPay / PhonePe / Paytm</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* QR Code and Copy UPI ID for Desktop */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
            <div className="shrink-0 p-2 rounded-xl bg-white border border-gold-antique/40 shadow-md">
              <img
                src={qrCodeUrl}
                alt="Scan to Pay via UPI"
                className="w-28 h-28 sm:w-32 sm:h-32 object-contain rounded-lg"
              />
            </div>
            <div className="space-y-2 text-center sm:text-left text-xs font-sans">
              <div className="text-gold-champagne/70 text-[11px]">Or Scan QR code with any UPI App:</div>
              <div className="flex items-center gap-2 bg-obsidian-secondary px-3 py-1.5 rounded-lg border border-obsidian-border">
                <span className="font-mono text-gold-champagne select-all text-[11px] truncate">{upiId}</span>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="p-1 text-gold-radiant hover:text-white"
                  title="Copy UPI ID"
                >
                  {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[10px] text-gold-champagne/50">
                Works with Google Pay, PhonePe, Paytm, BHIM, Cred & Banking UPI.
              </p>
            </div>
          </div>
        </div>

        {/* Step 2: Verification Input */}
        <form onSubmit={handleVerifyPayment} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-gold-radiant font-sans">
                Step 2: Enter 12-digit UTR / Ref Number
              </label>
              <span className="text-[10px] text-gold-champagne/60">(from payment receipt)</span>
            </div>
            <input
              type="text"
              required
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value)}
              placeholder="e.g. 432890123456"
              className="w-full px-4 py-2.5 rounded-xl bg-obsidian border border-obsidian-border focus:border-gold-radiant text-white font-mono text-sm placeholder:text-gold-champagne/30 focus:outline-none transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-gold-champagne/70 font-sans">
              Your Name / Devotee Name (Optional)
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="e.g. Ravi Kumar"
              className="w-full px-3.5 py-2 rounded-xl bg-obsidian border border-obsidian-border focus:border-gold-radiant text-white text-xs placeholder:text-gold-champagne/30 focus:outline-none transition-colors"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isVerifying}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying & Unlocking...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Verify & Download Sacred PDF</span>
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[10px] text-gold-champagne/50">
          Sacred Offering directly supports ongoing stotram digitization & maintenance.
        </p>
      </div>
    </div>
  );
}
