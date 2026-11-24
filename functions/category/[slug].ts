interface Env {
  DB?: any;
}

export async function onRequest(context: { request: Request; env: Env; params: { slug: string } }) {
  try {
    const { request, env, params } = context;
    const slug = params.slug;

    // 1. Check Cloudflare D1 first
    const d1 = env.DB;
    if (d1) {
      const category: any = await d1.prepare(`
        SELECT * FROM categories WHERE slug = ? LIMIT 1
      `).bind(slug).first();

      if (category) {
        // Fetch songs for this category
        const { results: songs } = await d1.prepare(`
          SELECT * FROM songs WHERE category_id = ? ORDER BY view_count DESC
        `).bind(category.id).all();

        const html = renderDynamicCategoryPage(category, songs || []);
        return new Response(html, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=60, s-maxage=300',
          },
        });
      }
    }

    // 2. Fallback to static asset
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

function renderDynamicCategoryPage(category: any, songs: any[]): string {
  const deityNameEn = escapeHtml(category.name_english || 'Deity Collection');
  const deityNameTe = escapeHtml(category.name_telugu || '');
  const subtitle = escapeHtml(category.subtitle_english || 'Complete Devotional Stotrams & Sacred Hymns');
  const catSlug = escapeHtml(category.slug || '');
  const icon = escapeHtml(category.icon || `/assets/deities/${catSlug}.png`);

  return `<!DOCTYPE html>
<html lang="en" class="dark scroll-smooth">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${deityNameEn} (${deityNameTe}) • Yamini Lyrics</title>
  <meta name="description" content="Sacred devotional stotrams, bhajans, and hymns for ${deityNameEn}. Read lyrics in Telugu and Roman script, download sacred PDFs." />
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
  </style>
</head>
<body class="bg-obsidian text-gold-champagne min-h-screen flex flex-col selection:bg-gold-radiant/30 selection:text-gold-radiant">
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
        <nav class="hidden md:flex items-center gap-1 bg-obsidian-secondary/80 p-1.5 rounded-full border border-obsidian-border shadow-inner">
          <a class="px-5 py-2 rounded-full text-xs font-semibold tracking-wider uppercase text-gold-champagne/80 hover:text-white hover:bg-white/5 transition-all" href="/">Home</a>
          <a class="px-5 py-2 rounded-full text-xs font-semibold tracking-wider uppercase text-gold-champagne/80 hover:text-white hover:bg-white/5 transition-all" href="/#categories">Deities</a>
        </nav>
        <div class="flex items-center gap-2 sm:gap-3">
          <a class="group flex items-center gap-1.5 sm:gap-2 p-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-gold-antique/10 hover:bg-gold-antique/20 border border-gold-antique/30 hover:border-gold-radiant text-gold-champagne hover:text-gold-radiant text-xs sm:text-sm font-semibold tracking-wide transition-all shadow-gold-sm" href="/admin/login">
            <svg class="w-4 h-4 text-gold-radiant" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path></svg>
            <span class="hidden sm:inline">Admin Studio</span>
          </a>
        </div>
      </div>
    </div>
  </header>

  <!-- Main Category Container -->
  <main class="flex-1 relative z-10 pb-24 sm:pb-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      
      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-xs text-gold-champagne/60 font-sans">
        <a class="hover:text-gold-radiant transition-colors" href="/">Home</a>
        <span>›</span>
        <a class="hover:text-gold-radiant transition-colors" href="/#categories">Deities</a>
        <span>›</span>
        <span class="text-gold-radiant font-semibold">${deityNameEn}</span>
      </nav>

      <!-- Deity Header Banner -->
      <div class="relative p-8 sm:p-12 rounded-3xl bg-card-gradient border border-gold-antique/35 shadow-gold-md overflow-hidden backdrop-blur-xl">
        <div class="absolute right-0 top-0 w-96 h-96 bg-gold-radiant/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div class="flex items-center gap-6">
            <div class="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl bg-obsidian-secondary border-2 border-gold-radiant/50 p-2 shadow-gold-md shrink-0 flex items-center justify-center">
              <img src="${icon}" alt="${deityNameEn}" class="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" onerror="this.src='/assets/logo.png'" />
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-2.5 mb-1">
                <span class="text-xs px-3 py-0.5 rounded-full bg-gold-radiant/15 border border-gold-radiant/35 text-gold-radiant font-semibold tracking-wider uppercase">
                  Deity Collection
                </span>
                <span class="text-xs text-gold-champagne/70 font-sans">
                  ${songs.length} Stotrams Available
                </span>
              </div>

              <h1 class="text-2xl sm:text-4xl font-extrabold text-white font-cinzel leading-tight">
                ${deityNameEn}
              </h1>
              <p class="text-xs sm:text-sm text-gold-champagne/75 font-sans max-w-xl leading-relaxed">
                ${subtitle}
              </p>
            </div>
          </div>

          <a href="/" class="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-obsidian border border-obsidian-border text-gold-champagne/80 hover:text-white text-xs sm:text-sm font-semibold tracking-wide transition-all hover:border-gold-antique/50 shadow-sm">
            <span>← Public Vault</span>
          </a>
        </div>
      </div>

      <!-- Songs List Section -->
      <section class="space-y-6">
        <div class="flex items-center justify-between pb-3 border-b border-obsidian-border">
          <h2 class="text-xl sm:text-2xl font-bold text-white font-cinzel flex items-center gap-3">
            <span>Available Stotrams</span>
            <span class="text-xs font-normal text-gold-champagne/60 font-sans">(${songs.length} hymns)</span>
          </h2>
        </div>

        ${songs.length > 0 ? `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          ${songs.map((song: any) => `
          <div class="flex flex-col justify-between p-6 rounded-3xl bg-card-gradient border border-obsidian-border hover:border-gold-radiant/60 transition-all duration-500 hover:shadow-gold-md hover:-translate-y-1.5 group overflow-hidden relative backdrop-blur-md">
            <div>
              <div class="flex items-center justify-between text-xs mb-3">
                <span class="px-2.5 py-0.5 rounded-full bg-gold-radiant/10 border border-gold-radiant/30 text-gold-radiant font-semibold">
                  ${deityNameEn}
                </span>
                <div class="flex items-center gap-1 text-gold-champagne/60 text-xs">
                  <span>👁️ ${song.view_count || 0}</span>
                </div>
              </div>

              <a href="/song/${song.slug}" class="block group-hover:text-gold-radiant transition-colors">
                <h3 class="text-lg font-bold text-white group-hover:text-gold-radiant transition-colors font-cinzel line-clamp-1 mb-1">
                  ${escapeHtml(song.title_roman)}
                </h3>
                <p class="text-xs text-gold-radiant font-telugu line-clamp-1 mb-3">
                  ${escapeHtml(song.title_telugu)}
                </p>
              </a>

              <div class="p-3.5 rounded-2xl bg-obsidian/75 border border-obsidian-border text-xs text-stone-300 font-sans line-clamp-3 leading-relaxed mb-4 group-hover:border-gold-antique/25 transition-colors">
                ${escapeHtml((song.lyrics_telugu || song.lyrics_roman || '').split('\n').slice(0, 3).join('\n'))}
              </div>
            </div>

            <div class="pt-3.5 border-t border-white/10 flex items-center justify-between">
              <a href="/song/${song.slug}" class="flex items-center gap-1.5 text-xs text-gold-radiant hover:text-white font-semibold transition-colors">
                <span>Read Lyrics →</span>
              </a>
              <a href="/song/${song.slug}" class="flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-xl bg-gradient-to-r from-gold-antique/15 to-gold-radiant/15 hover:from-gold-antique/30 hover:to-gold-radiant/30 border border-gold-antique/40 text-gold-champagne hover:text-white transition-all">
                <span>Sacred PDF</span>
              </a>
            </div>
          </div>
          `).join('')}
        </div>
        ` : `
        <div class="p-12 text-center rounded-3xl bg-obsidian-secondary/60 border border-obsidian-border space-y-3">
          <p class="text-base text-gold-champagne font-semibold font-cinzel">No Stotrams Uploaded Yet</p>
          <p class="text-xs text-gold-champagne/60 font-sans">Use the Admin Studio to upload stotrams for this deity.</p>
        </div>
        `}
      </section>
    </div>
  </main>

  <!-- Footer -->
  <footer class="border-t border-obsidian-border bg-obsidian-secondary/60 relative z-10 py-8 text-center text-xs text-gold-champagne/60">
    <div class="max-w-7xl mx-auto px-4 space-y-2">
      <p class="text-gold-radiant font-cinzel font-bold text-sm tracking-widest">Yamini Lyrics • Sacred Devotional Stotram Vault</p>
      <p class="text-gold-champagne/60 font-sans">High-DPI Temple Border PDFs &amp; Phonetic Transliterations • Edge Hosted on Cloudflare</p>
    </div>
  </footer>
</body>
</html>`;
}
