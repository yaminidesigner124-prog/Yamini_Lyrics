interface Env {
  DB?: any;
}

export async function onRequest(context: { request: Request; env: Env; params: { slug: string } }) {
  try {
    const { request, env, params } = context;
    const slug = params.slug;

    // Detect if current visitor is authenticated Admin
    const cookieHeader = request.headers.get('Cookie') || '';
    const isAdmin = cookieHeader.includes('devotional_admin_session=authenticated_sacred_session');

    // 1. Check Cloudflare D1 first for this devotional stotram
    const d1 = env.DB;
    if (d1) {
      const song: any = await d1.prepare(`
        SELECT s.*, 
               c.name_telugu as category_name_telugu, 
               c.name_english as category_name_english, 
               c.slug as category_slug
        FROM songs s
        LEFT JOIN categories c ON s.category_id = c.id
        WHERE s.slug = ?
        LIMIT 1
      `).bind(slug).first();

      if (song) {
        // Auto-increment view count in database on real visits
        d1.prepare('UPDATE songs SET view_count = view_count + 1 WHERE slug = ?').bind(slug).run().catch(() => {});

        // Fetch related songs from same deity
        let relatedSongs: any[] = [];
        if (song.category_id) {
          const relRes: any = await d1.prepare(`
            SELECT id, title_telugu, title_roman, title_english, slug
            FROM songs
            WHERE category_id = ? AND id != ?
            LIMIT 4
          `).bind(song.category_id, song.id).all();
          relatedSongs = relRes?.results || [];
        }

        // Fetch UPI ID from settings
        let upiId = 'yaminidesigner124@okicici';
        try {
          const upiRow: any = await d1.prepare("SELECT value FROM settings WHERE key = 'admin_upi_id'").first();
          if (upiRow && upiRow.value) upiId = upiRow.value;
        } catch {}

        // Render complete high-performance devotional song page
        const html = renderDynamicSongPage(song, relatedSongs, upiId, isAdmin);
        return new Response(html, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=30, s-maxage=60',
          },
        });
      }
    }

    // 2. If not found in D1, try static asset fallback
    return (context as any).next();
  } catch (err: any) {
    return new Response('Internal Server Error: ' + err.message, { status: 500 });
  }
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderDynamicSongPage(song: any, relatedSongs: any[], upiId: string, isAdmin: boolean = false): string {
  const isLocked = song.is_locked === 1;
  const price = song.price || 20;
  const teluguLyrics = escapeHtml(song.lyrics_telugu || '');
  const romanLyrics = escapeHtml(song.lyrics_roman || '');
  const englishMeaning = escapeHtml(song.meaning_english || '');
  const titleRoman = escapeHtml(song.title_roman || 'Sacred Stotram');
  const titleTelugu = escapeHtml(song.title_telugu || '');
  const categoryName = escapeHtml(song.category_name_english || 'Devotional Stotram');
  const categorySlug = escapeHtml(song.category_slug || '');
  const songSlug = escapeHtml(song.slug || '');

  return `<!DOCTYPE html>
<html lang="en" class="dark scroll-smooth">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${titleRoman} (${titleTelugu}) • Yamini Lyrics</title>
  <meta name="description" content="Complete lyrics for ${titleRoman} in Telugu script, Roman transliteration, and English meaning. 1-Click sacred PDF temple border download." />
  <link rel="icon" href="/assets/logo.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700;800;900&family=Noto+Sans+Telugu:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            obsidian: {
              DEFAULT: '#07090e',
              secondary: '#0c101a',
              border: 'rgba(212, 175, 55, 0.2)',
            },
            gold: {
              antique: '#d4af37',
              radiant: '#f59e0b',
              champagne: '#e2d5b5',
              saffron: '#ea580c',
            },
          },
          fontFamily: {
            cinzel: ['Cinzel', 'serif'],
            telugu: ['Noto Sans Telugu', 'sans-serif'],
            sans: ['Plus Jakarta Sans', 'sans-serif'],
          },
        },
      },
    };
  </script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <style>
    body { background-color: #07090e; color: #e2d5b5; font-family: 'Plus Jakarta Sans', sans-serif; }
    .font-cinzel { font-family: 'Cinzel', serif; }
    .font-telugu { font-family: 'Noto Sans Telugu', sans-serif; }
    .bg-obsidian { background-color: #07090e; }
    .bg-obsidian-secondary { background-color: #0c101a; }
    .text-gold-radiant { color: #f59e0b; }
    .text-gold-antique { color: #d4af37; }
    .text-gold-champagne { color: #e2d5b5; }
    .border-gold-antique { border-color: rgba(212, 175, 55, 0.3); }
    .border-gold-radiant { border-color: #f59e0b; }
    .border-obsidian-border { border-color: rgba(212, 175, 55, 0.2); }
    .bg-card-gradient { background: linear-gradient(135deg, rgba(17, 24, 39, 0.85) 0%, rgba(12, 16, 26, 0.95) 100%); }
    .bg-gold-gradient { background: linear-gradient(135deg, #f59e0b 0%, #d4af37 100%); }
    .shadow-gold-sm { box-shadow: 0 4px 15px rgba(245, 158, 11, 0.15); }
    .shadow-gold-md { box-shadow: 0 8px 30px rgba(245, 158, 11, 0.22); }
    .animate-pulse-subtle { animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
  </style>
</head>
<body class="bg-obsidian text-gold-champagne min-h-screen flex flex-col selection:bg-gold-radiant/30 selection:text-gold-radiant">
  
  <!-- Subtle Top Radiant Glow -->
  <div class="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] bg-gradient-to-b from-gold-radiant/20 via-gold-antique/10 to-transparent blur-[140px] pointer-events-none z-0"></div>

  <!-- Header / Navbar -->
  <header class="sticky top-0 z-40 w-full backdrop-blur-xl bg-obsidian/95 border-b border-obsidian-border transition-all duration-300">
    <div class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-14 sm:h-20">
        <a class="flex items-center gap-2.5 sm:gap-3.5 group shrink-0" href="/">
          <div class="relative flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-full group-hover:scale-105 transition-transform duration-300">
            <img src="/assets/logo.png" alt="Yamini Lyrics" class="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
          </div>
          <div class="flex flex-col">
            <div class="flex items-center gap-1.5 sm:gap-2">
              <span class="text-base sm:text-2xl font-bold tracking-tight text-white font-cinzel">Yamini <span class="text-transparent bg-clip-text bg-gold-gradient">Lyrics</span></span>
              <span class="text-[9px] sm:text-xs px-2 py-0.5 rounded-full bg-gold-radiant/15 text-gold-radiant border border-gold-radiant/40 font-semibold tracking-wider uppercase hidden xs:inline shadow-gold-sm">Sacred Vault</span>
            </div>
            <span class="text-[10px] sm:text-xs text-gold-champagne/70 font-sans hidden md:inline tracking-wide">Devotional Stotrams, Phonetic Transliterations &amp; Sacred PDFs</span>
          </div>
        </a>
        ${isAdmin ? `
        <nav class="hidden sm:flex items-center gap-1 bg-obsidian-secondary/80 p-1 rounded-xl border border-obsidian-border">
          <a href="/admin/manage" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gold-champagne/80 hover:text-white hover:bg-white/5 transition-all">Stotrams</a>
          <a href="/admin/upload" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gold-champagne/80 hover:text-white hover:bg-white/5 transition-all">Upload &amp; OCR</a>
        </nav>
        ` : `
        <nav class="hidden md:flex items-center gap-1 bg-obsidian-secondary/80 p-1.5 rounded-full border border-obsidian-border shadow-inner">
          <a class="px-5 py-2 rounded-full text-xs font-semibold tracking-wider uppercase text-gold-champagne/80 hover:text-white hover:bg-white/5 transition-all" href="/">Home</a>
          <a class="px-5 py-2 rounded-full text-xs font-semibold tracking-wider uppercase text-gold-champagne/80 hover:text-white hover:bg-white/5 transition-all" href="/#categories">Deities</a>
        </nav>
        `}
        <div class="flex items-center gap-2 sm:gap-3">
          ${isAdmin ? `
            <a class="group flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gold-radiant/15 hover:bg-gold-radiant/25 border border-gold-radiant/40 text-gold-radiant text-xs font-bold transition-all shadow-gold-sm" href="/admin/manage" title="Open Admin Studio">
              <svg class="w-4 h-4 text-gold-radiant" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path></svg>
              <span class="hidden sm:inline">Admin Studio</span>
            </a>
            <button onclick="handleAdminLogout()" title="Log Out &amp; Close Admin Access" class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/40 border border-red-500/40 hover:border-red-500 text-red-400 hover:text-red-300 hover:bg-red-950/70 transition-all text-xs font-bold shadow-sm cursor-pointer shrink-0">
              <svg class="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" x2="9" y1="12" y2="12"></line></svg>
              <span>Logout</span>
            </button>
          ` : `
            <a class="group flex items-center gap-1.5 sm:gap-2 p-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-gold-antique/10 hover:bg-gold-antique/20 border border-gold-antique/30 hover:border-gold-radiant text-gold-champagne hover:text-gold-radiant text-xs sm:text-sm font-semibold tracking-wide transition-all shadow-gold-sm" href="/admin/login">
              <svg class="w-4 h-4 text-gold-radiant" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path></svg>
              <span class="hidden sm:inline">Admin Studio</span>
            </a>
          `}
        </div>
      </div>
    </div>
  </header>

  <!-- Main Song Container -->
  <main class="flex-1 relative z-10 pb-24 sm:pb-16">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      
      ${isAdmin ? `
      <!-- Admin Session Active Banner -->
      <div class="p-3.5 rounded-2xl bg-amber-950/30 border border-gold-antique/40 text-xs flex flex-wrap items-center justify-between gap-2 shadow-gold-sm">
        <div class="flex items-center gap-2 text-gold-champagne font-sans">
          <span class="w-2.5 h-2.5 rounded-full bg-gold-radiant animate-pulse shrink-0"></span>
          <span><strong>Admin Session Active:</strong> Public user preview &amp; lock is shown here. To download master PDFs or manage stotrams, use Admin Studio.</span>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <a href="/admin/manage" class="px-3 py-1.5 rounded-xl bg-gold-radiant/20 border border-gold-radiant/50 text-gold-radiant font-semibold hover:bg-gold-radiant/30 text-xs transition-colors">Admin Studio</a>
          <button onclick="handleAdminLogout()" class="px-3 py-1.5 rounded-xl bg-red-950/50 border border-red-500/50 text-red-300 font-semibold hover:bg-red-900/60 text-xs transition-colors cursor-pointer">Logout</button>
        </div>
      </div>
      ` : ''}
      
      <!-- Breadcrumb Navigation -->
      <nav class="flex items-center gap-2 text-xs text-gold-champagne/60 flex-wrap font-sans">
        <a class="hover:text-gold-radiant transition-colors" href="/">Home</a>
        <span>›</span>
        ${categorySlug ? `<a class="hover:text-gold-radiant transition-colors" href="/category/${categorySlug}">${categoryName}</a><span>›</span>` : ''}
        <span class="text-gold-radiant font-semibold truncate max-w-[240px]">${titleRoman}</span>
      </nav>

      <!-- Song Header Banner with Deity Visual & Stats -->
      <div class="p-8 sm:p-12 rounded-3xl bg-card-gradient border border-gold-antique/35 shadow-gold-md relative overflow-hidden backdrop-blur-xl">
        ${categorySlug ? `
        <div class="absolute -right-8 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none select-none">
          <img src="/assets/deities/${categorySlug}.png" alt="" class="w-64 h-64 rounded-full object-cover border-4 border-gold-radiant/30 filter blur-[0.5px]" />
        </div>` : ''}

        <div class="relative z-10 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3 text-xs">
            ${categorySlug ? `
            <a class="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-gold-radiant/15 border border-gold-radiant/35 text-gold-radiant font-semibold hover:brightness-110 transition-all hover:scale-105" href="/category/${categorySlug}">
              <img src="/assets/deities/${categorySlug}.png" alt="${categoryName}" class="w-5 h-5 rounded-full object-cover border border-gold-radiant/60" />
              <span>${categoryName}</span>
            </a>` : ''}

            <div class="flex items-center gap-5 text-gold-champagne/75 text-xs font-sans">
              <span class="flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-gold-radiant" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path><circle cx="12" cy="12" r="3"></circle></svg>
                <span>${(song.view_count || 0) + 1} views</span>
              </span>
              <span class="flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-gold-radiant" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" x2="12" y1="15" y2="3"></line></svg>
                <span>${song.download_count || 0} downloads</span>
              </span>
            </div>
          </div>

          <div class="space-y-1.5">
            <h1 class="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white font-cinzel leading-tight">
              ${titleRoman}
            </h1>
            <p class="text-base sm:text-xl text-gold-radiant font-telugu font-semibold">
              ${titleTelugu}
            </p>
          </div>
        </div>
      </div>

      <!-- Controls & Tabs Bar -->
      <div class="w-full space-y-6">
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-obsidian-secondary/90 border border-obsidian-border shadow-gold-sm backdrop-blur-xl">
          <div class="flex items-center gap-1 overflow-x-auto no-scrollbar p-1 rounded-xl sm:rounded-2xl bg-obsidian border border-obsidian-border text-xs sm:text-sm w-full sm:w-auto">
            <button id="tab-roman" onclick="switchTab('roman')" class="tab-btn shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-sans font-semibold transition-all bg-gradient-to-r from-gold-radiant to-gold-antique text-obsidian shadow-gold-sm font-bold">
              Roman Transliteration
            </button>
            <button id="tab-telugu" onclick="switchTab('telugu')" class="tab-btn shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-sans font-semibold transition-all text-gold-champagne/70 hover:text-white hover:bg-white/5">
              Telugu Script
            </button>
            ${englishMeaning ? `
            <button id="tab-meaning" onclick="switchTab('meaning')" class="tab-btn shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-sans font-semibold transition-all text-gold-champagne/70 hover:text-white hover:bg-white/5">
              English Meaning
            </button>` : ''}
            <button id="tab-side" onclick="switchTab('side')" class="tab-btn shrink-0 hidden lg:flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-semibold transition-all text-gold-champagne/70 hover:text-white hover:bg-white/5">
              Side-by-Side
            </button>
          </div>

          <div class="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
            <div class="flex items-center rounded-xl bg-obsidian border border-obsidian-border p-1 text-xs text-gold-champagne/70">
              <button onclick="changeFontSize(-1)" class="px-2.5 py-1 rounded-lg transition-colors hover:text-white" title="Small text">A-</button>
              <button onclick="changeFontSize(0)" class="px-2.5 py-1 rounded-lg transition-colors bg-white/10 text-gold-radiant font-bold" title="Reset text">A</button>
              <button onclick="changeFontSize(1)" class="px-2.5 py-1 rounded-lg transition-colors hover:text-white" title="Large text">A+</button>
            </div>

            <button onclick="copyCurrentLyrics()" class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-obsidian border border-obsidian-border hover:border-gold-antique/50 text-gold-champagne/80 hover:text-white text-xs transition-all" title="Copy Current View">
              <svg class="w-3.5 h-3.5 text-gold-antique" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>
              <span class="hidden sm:inline">Copy</span>
            </button>

            <button onclick="shareStotram()" class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-obsidian border border-obsidian-border hover:border-gold-antique/50 text-gold-champagne/80 hover:text-white text-xs transition-all" title="Share Stotram">
              <svg class="w-3.5 h-3.5 text-gold-radiant" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"></line><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"></line></svg>
              <span class="hidden sm:inline">Share</span>
            </button>

            <!-- PDF Download Button -->
            <button onclick="handlePdfTrigger()" class="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-gold-radiant to-gold-antique hover:brightness-110 text-obsidian font-bold text-xs transition-all shadow-gold-sm hover:scale-105">
              ${isAdmin ? `
                <svg class="w-3.5 h-3.5 text-obsidian" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M12 18v-6"></path><path d="m9 15 3 3 3-3"></path></svg>
                <span>Download Sacred PDF (Admin Free)</span>
              ` : isLocked ? `
                <svg class="w-3.5 h-3.5 text-obsidian" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                <span>Download PDF (₹${price})</span>
              ` : `
                <svg class="w-3.5 h-3.5 text-obsidian" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M12 18v-6"></path><path d="m9 15 3 3 3-3"></path></svg>
                <span>Download Sacred PDF</span>
              `}
            </button>
          </div>
        </div>

        <!-- Lyrics View Box -->
        <div id="lyrics-container" class="rounded-3xl bg-card-gradient border border-obsidian-border p-6 sm:p-12 relative overflow-hidden backdrop-blur-xl shadow-gold-md">
          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none opacity-[0.035] text-[220px] sm:text-[340px] font-serif text-gold-radiant">ॐ</div>
          
          <!-- Paywall Blurred Preview for Locked Stotrams -->
          <div id="paywall-overlay" class="${isLocked ? '' : 'hidden'} relative space-y-4">
            <div class="space-y-2">
              <span class="text-[11px] font-bold uppercase tracking-wider text-gold-radiant/80 font-sans block">
                Introduction (Preview)
              </span>
              <div id="preview-text" class="whitespace-pre-wrap text-gold-champagne/95 font-sans text-base sm:text-lg leading-relaxed">
${escapeHtml((song.lyrics_roman || song.lyrics_telugu || '').split('\n').filter((l: string) => l.trim().length > 0).slice(0, 3).join('\n\n'))}
              </div>
            </div>

            <!-- Blurred section with min-height and non-clipping centered lock card -->
            <div class="relative pt-4 min-h-[440px] flex items-center justify-center">
              <div id="blurred-remainder" class="filter blur-md select-none pointer-events-none opacity-20 max-h-96 overflow-hidden font-sans text-base sm:text-lg leading-loose absolute inset-0">
${escapeHtml((song.lyrics_roman || song.lyrics_telugu || '').split('\n').filter((l: string) => l.trim().length > 0).slice(3).join('\n\n'))}
              </div>

              <!-- Floating Sacred Lock Card -->
              <div class="relative z-20 w-full max-w-md p-6 sm:p-8 rounded-3xl bg-obsidian-secondary/95 border-2 border-gold-antique/60 shadow-2xl backdrop-blur-2xl text-center space-y-4">
                <div class="w-14 h-14 rounded-2xl bg-gold-radiant/20 border border-gold-radiant/50 flex items-center justify-center text-gold-radiant shadow-gold-sm mx-auto">
                  <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                </div>
                <div class="space-y-1.5">
                  <h3 class="text-lg sm:text-xl font-bold text-white font-cinzel">
                    Sacred Lyrics &amp; PDF Locked
                  </h3>
                  <p class="text-xs text-gold-champagne/80 font-sans leading-relaxed">
                    This stotram is locked. Pay a nominal seva fee of <strong class="text-gold-radiant font-bold">₹${price}</strong> to unlock complete unblurred lyrics and download the print-ready temple border A4 PDF.
                  </p>
                </div>
                <button onclick="handlePdfTrigger()" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-gold-radiant to-gold-antique text-obsidian font-bold text-xs sm:text-sm tracking-wide shadow-gold-sm hover:brightness-110 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]">
                  <svg class="w-4 h-4 text-obsidian" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  <span>Pay ₹${price} &amp; Unlock Full Lyrics + PDF</span>
                </button>
                <p class="text-[10px] text-gold-champagne/50 font-sans">
                  Instant 1-click verification via PhonePe, Google Pay, Paytm, or BHIM UPI
                </p>
              </div>
            </div>
          </div>

          <!-- Full Unblurred Lyrics Container (Visible when Unlocked or Free) -->
          <div id="full-lyrics-container" class="${isLocked ? 'hidden' : ''}">
            <div id="lyrics-text" class="max-w-2xl mx-auto font-sans whitespace-pre-wrap text-gold-champagne/95 text-base sm:text-lg leading-loose transition-all duration-200">
${romanLyrics}
            </div>
          </div>

          <div class="mt-14 pt-8 border-t border-gold-antique/20 flex flex-col items-center justify-center text-center">
            <div class="text-lg sm:text-xl text-gold-radiant font-serif mb-1 select-none tracking-widest font-cinzel">May Peace and Auspiciousness Prevail</div>
            <p class="text-xs text-gold-champagne/60 font-sans">Chant with pure devotion • Shared for universal spiritual well-being</p>
          </div>
        </div>
      </div>

      <!-- Related Sacred Stotrams -->
      ${relatedSongs.length > 0 ? `
      <section class="pt-8 border-t border-obsidian-border space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-bold text-white font-cinzel flex items-center gap-2">
            <span>More Sacred Stotrams</span>
            <span class="text-xs text-gold-champagne/60 font-sans">(${categoryName})</span>
          </h3>
          ${categorySlug ? `<a class="text-xs text-gold-radiant hover:text-white font-semibold transition-colors uppercase tracking-wider" href="/category/${categorySlug}">View Collection →</a>` : ''}
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          ${relatedSongs.map((rel: any) => `
          <a class="p-5 rounded-2xl bg-card-gradient border border-obsidian-border hover:border-gold-radiant/50 transition-all hover:shadow-gold-sm hover:-translate-y-1 group" href="/song/${rel.slug}">
            <h4 class="text-sm font-bold text-white group-hover:text-gold-radiant transition-colors font-cinzel line-clamp-1">${escapeHtml(rel.title_roman)}</h4>
            <p class="text-xs text-gold-champagne/70 font-sans line-clamp-1 mt-1 font-telugu">${escapeHtml(rel.title_telugu)}</p>
          </a>
          `).join('')}
        </div>
      </section>` : ''}
    </div>
  </main>

  <!-- PDF Unlock Modal (Sacred ₹20 Lock) -->
  <div id="unlock-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md hidden">
    <div class="relative w-full max-w-md rounded-3xl bg-obsidian-secondary border border-gold-antique/40 p-6 sm:p-8 shadow-2xl text-center space-y-6">
      <button onclick="closeUnlockModal()" class="absolute top-4 right-4 p-2 rounded-xl text-gold-champagne/60 hover:text-white hover:bg-white/5">✕</button>

      <div class="flex flex-col items-center gap-2">
        <div class="w-14 h-14 rounded-2xl bg-gold-radiant/15 border border-gold-radiant/40 flex items-center justify-center text-gold-radiant shadow-gold-sm">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        </div>
        <h3 class="text-xl font-bold text-white font-cinzel">Unlock Sacred PDF</h3>
        <p class="text-xs text-gold-champagne/70 font-sans">
          Support the sacred stotram archive with a nominal seva fee of <strong class="text-gold-radiant font-bold">₹${price}</strong> to unlock the 300DPI temple border PDF.
        </p>
      </div>

      <!-- UPI QR Box -->
      <div class="p-4 rounded-2xl bg-obsidian border border-gold-antique/30 inline-block shadow-inner">
        <img id="qr-code-img" src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=Yamini%20Lyrics&am=${price}&cu=INR&tn=Sacred%20PDF%20${songSlug}`)}" alt="UPI QR Code" class="w-44 h-44 rounded-xl mx-auto" />
        <p class="text-[11px] text-gold-radiant font-mono mt-2 font-semibold">UPI ID: ${upiId}</p>
      </div>

      <!-- Pay via UPI App deep link button -->
      <div>
        <a href="upi://pay?pa=${upiId}&pn=Yamini%20Lyrics&am=${price}&cu=INR&tn=Sacred%20PDF%20${songSlug}" class="block w-full py-3 rounded-xl bg-gradient-to-r from-gold-radiant to-gold-antique text-obsidian font-bold text-xs sm:text-sm tracking-wide shadow-gold-sm hover:brightness-110 transition-all">
          Pay ₹${price} via PhonePe / GPay / Paytm
        </a>
      </div>

      <!-- UTR Verification Form -->
      <div class="space-y-3 pt-2 border-t border-obsidian-border text-left">
        <div class="space-y-1">
          <label class="text-[11px] font-semibold text-gold-champagne/80 font-sans uppercase tracking-wider block">
            Devotee Name * (Required)
          </label>
          <input id="name-input" type="text" placeholder="e.g. Ravindra" required class="w-full px-3.5 py-2.5 rounded-xl bg-obsidian border border-gold-antique/40 focus:border-gold-radiant text-white placeholder-gold-champagne/30 text-xs font-sans focus:outline-none" />
        </div>
        <div class="space-y-1">
          <label class="text-[11px] font-semibold text-gold-champagne/80 font-sans uppercase tracking-wider block">
            12-Digit UPI UTR / Transaction ID *
          </label>
          <div class="flex gap-2">
            <input id="utr-input" type="text" placeholder="e.g. 432109876543" maxlength="16" class="flex-1 px-3.5 py-2.5 rounded-xl bg-obsidian border border-gold-antique/40 focus:border-gold-radiant text-white placeholder-gold-champagne/30 text-xs font-mono focus:outline-none" />
            <button id="verify-btn" onclick="verifyAndUnlock()" class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold-radiant to-gold-antique text-obsidian font-bold text-xs transition-colors shrink-0 shadow-gold-sm hover:brightness-110">
              Verify
            </button>
          </div>
        </div>
        <p id="utr-error" class="text-[11px] text-red-400 font-sans hidden"></p>
      </div>
    </div>
  </div>

  <!-- Hidden Printable A4 Container for html2canvas & jsPDF -->
  <div id="pdf-printable-source" style="position: absolute; left: -9999px; top: -9999px; width: 794px; min-height: 1123px; background: #fffefc; color: #1e1b18; padding: 40px; font-family: 'Plus Jakarta Sans', sans-serif;">
    <div style="border: 3px double #d4af37; padding: 30px; min-height: 1040px; display: flex; flex-direction: column; justify-content: space-between; position: relative;">
      <div>
        <div style="text-align: center; border-bottom: 2px solid #d4af37; padding-bottom: 20px; margin-bottom: 24px;">
          <div style="font-size: 28px; color: #d4af37; margin-bottom: 6px;">ॐ</div>
          <h1 style="font-family: 'Cinzel', serif; font-size: 22px; font-weight: 700; color: #111827; margin: 0;">${titleRoman}</h1>
          <h2 style="font-family: 'Noto Sans Telugu', sans-serif; font-size: 18px; font-weight: 600; color: #d4af37; margin: 4px 0 0 0;">${titleTelugu}</h2>
          <div style="font-size: 11px; color: #6b7280; margin-top: 6px; letter-spacing: 1px; text-transform: uppercase;">Yamini Lyrics • Sacred Devotional Archive</div>
        </div>

        <div style="white-space: pre-wrap; font-size: 14px; line-height: 1.8; color: #1f2937; margin-bottom: 24px;">${teluguLyrics || romanLyrics}</div>
      </div>

      <div style="border-top: 1px solid #e5e7eb; padding-top: 12px; display: flex; justify-content: space-between; font-size: 10px; color: #6b7280;">
        <span>yamini-lyrics.pages.dev • Universal Spiritual Well-Being</span>
        <span>@yaminilyrics</span>
      </div>
    </div>
  </div>

  <!-- Toast Notification -->
  <div id="toast" class="fixed bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-gold-radiant text-obsidian font-bold text-xs shadow-gold-md transition-opacity duration-300 opacity-0 pointer-events-none z-50">
    Notification
  </div>

  <!-- Footer -->
  <footer class="border-t border-obsidian-border bg-obsidian-secondary/60 relative z-10 py-8 text-center text-xs text-gold-champagne/60">
    <div class="max-w-7xl mx-auto px-4 space-y-2">
      <p class="text-gold-radiant font-cinzel font-bold text-sm tracking-widest">Yamini Lyrics • Sacred Devotional Stotram Vault</p>
      <p class="text-gold-champagne/60 font-sans">High-DPI Temple Border PDFs &amp; Phonetic Transliterations • Edge Hosted on Cloudflare</p>
      <p class="text-[11px] text-gold-champagne/40 font-medium">Free Public Access • Dedicated to Devotional Practice</p>
    </div>
  </footer>

  <!-- Client-side Interactive Logic -->
  <script>
    const songData = {
      isAdmin: ${isAdmin ? 'true' : 'false'},
      isLocked: ${isLocked ? 'true' : 'false'},
      slug: "${songSlug}",
      price: ${price},
      roman: \`${romanLyrics}\`,
      telugu: \`${teluguLyrics}\`,
      meaning: \`${englishMeaning}\`
    };

    let activeTab = 'roman';
    let fontSizeMultiplier = 0;

    function switchTab(tab) {
      activeTab = tab;
      document.querySelectorAll('.tab-btn').forEach(b => {
        b.className = 'tab-btn shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-sans font-semibold transition-all text-gold-champagne/70 hover:text-white hover:bg-white/5';
      });
      const activeBtn = document.getElementById('tab-' + tab);
      if (activeBtn) {
        activeBtn.className = 'tab-btn shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-sans font-semibold transition-all bg-gradient-to-r from-gold-radiant to-gold-antique text-obsidian shadow-gold-sm font-bold';
      }

      const container = document.getElementById('lyrics-text');
      if (tab === 'roman') {
        container.className = 'max-w-2xl mx-auto font-sans whitespace-pre-wrap text-gold-champagne/95 text-base sm:text-lg leading-loose transition-all duration-200';
        container.textContent = songData.roman;
      } else if (tab === 'telugu') {
        container.className = 'max-w-2xl mx-auto font-telugu whitespace-pre-wrap text-gold-champagne/95 text-base sm:text-lg leading-loose transition-all duration-200';
        container.textContent = songData.telugu;
      } else if (tab === 'meaning') {
        container.className = 'max-w-2xl mx-auto font-sans whitespace-pre-wrap text-gold-champagne/90 text-sm sm:text-base leading-relaxed transition-all duration-200';
        container.textContent = songData.meaning;
      } else if (tab === 'side') {
        container.className = 'grid grid-cols-1 md:grid-cols-2 gap-8 text-base sm:text-lg leading-loose transition-all duration-200';
        container.innerHTML = '<div class=\"font-sans whitespace-pre-wrap text-gold-champagne/90 border-r border-gold-antique/20 pr-6\">' + songData.roman + '</div><div class=\"font-telugu whitespace-pre-wrap text-gold-radiant pl-2\">' + songData.telugu + '</div>';
      }
      applyFontSize();
    }

    function changeFontSize(delta) {
      if (delta === 0) fontSizeMultiplier = 0;
      else fontSizeMultiplier = Math.max(-2, Math.min(2, fontSizeMultiplier + delta));
      applyFontSize();
    }

    function applyFontSize() {
      const container = document.getElementById('lyrics-text');
      const base = 18;
      container.style.fontSize = (base + (fontSizeMultiplier * 2.5)) + 'px';
    }

    function showToast(msg) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.style.opacity = '1';
      setTimeout(() => { t.style.opacity = '0'; }, 3000);
    }

    function copyCurrentLyrics() {
      let text = songData.roman;
      if (activeTab === 'telugu') text = songData.telugu;
      else if (activeTab === 'meaning') text = songData.meaning;
      else if (activeTab === 'side') text = songData.telugu + '\\n\\n' + songData.roman;

      navigator.clipboard.writeText(text).then(() => {
        showToast('Lyrics copied to clipboard!');
      });
    }

    function shareStotram() {
      if (navigator.share) {
        navigator.share({
          title: "${titleRoman} • Yamini Lyrics",
          url: window.location.href
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(window.location.href).then(() => {
          showToast('Link copied to clipboard!');
        });
      }
    }

    function handleAdminLogout() {
      fetch('/api/auth', { method: 'DELETE' }).finally(() => {
        document.cookie = 'devotional_admin_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
        window.location.href = '/';
      });
    }

    function handlePdfTrigger() {
      const isUnlocked = localStorage.getItem('unlocked_' + songData.slug) === 'true';
      if (songData.isLocked && !isUnlocked) {
        document.getElementById('unlock-modal').classList.remove('hidden');
      } else {
        downloadPdf();
      }
    }

    function closeUnlockModal() {
      document.getElementById('unlock-modal').classList.add('hidden');
    }

    async function verifyAndUnlock() {
      const nameInput = document.getElementById('name-input');
      const devoteeName = (nameInput ? nameInput.value : '').trim();
      const utrInput = document.getElementById('utr-input');
      const utr = (utrInput.value || '').trim();
      const errEl = document.getElementById('utr-error');
      const btn = document.getElementById('verify-btn');

      if (!devoteeName) {
        errEl.textContent = 'Please enter your Devotee Name (Required)';
        errEl.classList.remove('hidden');
        if (nameInput) nameInput.focus();
        return;
      }

      if (!utr || utr.length < 6) {
        errEl.textContent = 'Please enter a valid 12-digit UPI Transaction / UTR ID';
        errEl.classList.remove('hidden');
        utrInput.focus();
        return;
      }

      errEl.classList.add('hidden');
      btn.textContent = 'Verifying...';
      btn.disabled = true;

      try {
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            song_id: songData.slug,
            songSlug: songData.slug,
            utr_number: utr,
            utrNumber: utr,
            user_name: devoteeName,
            userName: devoteeName,
            amount: songData.price
          })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Verification failed');
        }

        localStorage.setItem('unlocked_' + songData.slug, 'true');
        const paywall = document.getElementById('paywall-overlay');
        const full = document.getElementById('full-lyrics-container');
        if (paywall) paywall.classList.add('hidden');
        if (full) full.classList.remove('hidden');
        closeUnlockModal();
        showToast('Payment verified! Full lyrics unlocked & generating Sacred PDF...');
        setTimeout(downloadPdf, 600);
      } catch (err) {
        errEl.textContent = err.message || 'Payment verification failed. Please check UTR number.';
        errEl.classList.remove('hidden');
      } finally {
        btn.textContent = 'Verify';
        btn.disabled = false;
      }
    }

    async function downloadPdf() {
      showToast('Rendering high-DPI sacred PDF...');
      fetch('/api/songs?slug=' + songData.slug + '&action=download', { method: 'POST' }).catch(() => {});

      try {
        const element = document.getElementById('pdf-printable-source');
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#fffefc'
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.88);
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
          compress: true
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(imgHeight, pdfHeight));
        pdf.save(songData.slug + '-sacred-lyrics.pdf');
        showToast('Sacred PDF downloaded successfully!');
      } catch (err) {
        console.error('PDF generation error, fallback to window print', err);
        window.print();
      }
    }
    // Check if unlocked in localStorage
    if (!songData.isAdmin && songData.isLocked) {
      if (localStorage.getItem('unlocked_' + songData.slug) === 'true') {
        const paywall = document.getElementById('paywall-overlay');
        const full = document.getElementById('full-lyrics-container');
        if (paywall) paywall.classList.add('hidden');
        if (full) full.classList.remove('hidden');
      }
    }
  </script>
</body>
</html>`;
}
