import { Category, Song } from './types';
import { SEED_CATEGORIES, SEED_SONGS } from './seedData';

// Safe optional Node.js modules for local dev fallback (hidden from edge bundler)
let fsModule: any = null;
let pathModule: any = null;
if (typeof window === 'undefined' && typeof process !== 'undefined' && process.versions?.node && !(globalThis as any).EdgeRuntime) {
  try {
    const nodeRequire = (globalThis as any).__non_webpack_require__ || eval('require');
    fsModule = nodeRequire('fs');
    pathModule = nodeRequire('path');
  } catch {}
}

// Local storage path for offline / local Next.js dev server
const LOCAL_DB_DIR = pathModule ? pathModule.join(process.cwd(), '.data') : '';
const LOCAL_DB_FILE = pathModule && LOCAL_DB_DIR ? pathModule.join(LOCAL_DB_DIR, 'devotional_db.json') : '';

interface LocalDatabase {
  categories: Category[];
  songs: Song[];
  settings: Record<string, string>;
}

// In-memory cache for edge or fallback
let memoryDb: LocalDatabase | null = null;

function getLocalData(): LocalDatabase {
  if (typeof window !== 'undefined') {
    return { categories: SEED_CATEGORIES, songs: SEED_SONGS, settings: {} };
  }

  if (memoryDb) {
    return memoryDb;
  }

  try {
    if (fsModule && LOCAL_DB_FILE && fsModule.existsSync(LOCAL_DB_FILE)) {
      const content = fsModule.readFileSync(LOCAL_DB_FILE, 'utf-8');
      memoryDb = JSON.parse(content);
      return memoryDb!;
    }
  } catch (e) {
    console.warn('Could not read local DB file, initializing fresh store:', e);
  }

  // Initialize fresh store
  const initialData: LocalDatabase = {
    categories: SEED_CATEGORIES,
    songs: SEED_SONGS,
    settings: {
      admin_pin: '1008', // Default sacred admin PIN
    },
  };

  try {
    if (fsModule && LOCAL_DB_DIR && !fsModule.existsSync(LOCAL_DB_DIR)) {
      fsModule.mkdirSync(LOCAL_DB_DIR, { recursive: true });
    }
    if (fsModule && LOCAL_DB_FILE) {
      fsModule.writeFileSync(LOCAL_DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    }
  } catch (e) {
    // In edge runtime fs might fail, keep in memory
  }

  memoryDb = initialData;
  return memoryDb;
}

function saveLocalData(data: LocalDatabase): void {
  memoryDb = data;
  try {
    if (fsModule && LOCAL_DB_DIR && !fsModule.existsSync(LOCAL_DB_DIR)) {
      fsModule.mkdirSync(LOCAL_DB_DIR, { recursive: true });
    }
    if (fsModule && LOCAL_DB_FILE) {
      fsModule.writeFileSync(LOCAL_DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    }
  } catch (e) {
    // In edge runtime ignore fs write error
  }
}

/**
 * Helper to get Cloudflare D1 binding if present in runtime
 */
function getD1Binding(): any {
  if (typeof process !== 'undefined' && (process.env as any)?.DB) {
    return (process.env as any).DB;
  }
  if (typeof globalThis !== 'undefined' && (globalThis as any)?.DB) {
    return (globalThis as any).DB;
  }
  return null;
}

// ==========================================
// CATEGORIES
// ==========================================

export async function getCategories(): Promise<Category[]> {
  const d1 = getD1Binding();
  if (d1) {
    try {
      const { results } = await d1.prepare(`
        SELECT c.*, COUNT(s.id) as song_count 
        FROM categories c 
        LEFT JOIN songs s ON c.id = s.category_id 
        GROUP BY c.id 
        ORDER BY c.display_order ASC
      `).all();
      return results as Category[];
    } catch (e) {
      console.error('D1 error getting categories, fallback to local store', e);
    }
  }

  const data = getLocalData();
  const countMap: Record<string, number> = {};
  data.songs.forEach((s) => {
    countMap[s.category_id] = (countMap[s.category_id] || 0) + 1;
  });

  return data.categories.map((c) => ({
    ...c,
    song_count: countMap[c.id] || 0,
  })).sort((a, b) => a.display_order - b.display_order);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug) || null;
}

export async function createCategory(cat: Omit<Category, 'id'>): Promise<Category> {
  const newCat: Category = {
    ...cat,
    id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    display_order: cat.display_order || 99,
    song_count: 0,
    created_at: new Date().toISOString(),
  };

  const d1 = getD1Binding();
  if (d1) {
    try {
      await d1.prepare(`
        INSERT INTO categories (id, name_telugu, name_english, slug, icon, display_order)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        newCat.id,
        newCat.name_telugu || newCat.name_english,
        newCat.name_english,
        newCat.slug,
        newCat.icon || `/assets/deities/${newCat.slug}.png`,
        newCat.display_order
      ).run();
      return newCat;
    } catch (e) {
      console.error('D1 error inserting category', e);
    }
  }

  const data = getLocalData();
  data.categories.push(newCat);
  saveLocalData(data);
  return newCat;
}

export async function deleteCategory(idOrSlug: string): Promise<boolean> {
  const data = getLocalData();
  const cat = data.categories.find((c) => c.id === idOrSlug || c.slug === idOrSlug);
  if (!cat) return false;

  // Remove category
  data.categories = data.categories.filter((c) => c.id !== cat.id);
  // Remove associated songs
  data.songs = data.songs.filter((s) => s.category_id !== cat.id);
  saveLocalData(data);

  const d1 = getD1Binding();
  if (d1) {
    try {
      await d1.prepare(`DELETE FROM categories WHERE id = ? OR slug = ?`).bind(cat.id, cat.slug).run();
      await d1.prepare(`DELETE FROM songs WHERE category_id = ?`).bind(cat.id).run();
    } catch (e) {
      console.error('D1 error deleting category', e);
    }
  }

  return true;
}

// ==========================================
// SONGS
// ==========================================

export interface GetSongsOptions {
  categoryId?: string;
  categorySlug?: string;
  query?: string;
  limit?: number;
}

export async function getSongs(options: GetSongsOptions = {}): Promise<Song[]> {
  const d1 = getD1Binding();
  if (d1) {
    try {
      let sql = `
        SELECT s.*, c.name_telugu as category_name_telugu, c.name_english as category_name_english, c.slug as category_slug, c.icon as category_icon
        FROM songs s
        JOIN categories c ON s.category_id = c.id
      `;
      const conditions: string[] = [];
      const params: any[] = [];

      if (options.categoryId) {
        conditions.push(`s.category_id = ?`);
        params.push(options.categoryId);
      }
      if (options.categorySlug) {
        conditions.push(`c.slug = ?`);
        params.push(options.categorySlug);
      }
      if (options.query) {
        conditions.push(`(s.title_telugu LIKE ? OR s.title_roman LIKE ? OR s.tags LIKE ?)`);
        const q = `%${options.query}%`;
        params.push(q, q, q);
      }

      if (conditions.length > 0) {
        sql += ` WHERE ` + conditions.join(' AND ');
      }

      sql += ` ORDER BY s.view_count DESC`;
      if (options.limit) {
        sql += ` LIMIT ${Math.floor(options.limit)}`;
      }

      const stmt = d1.prepare(sql);
      const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();
      return results as Song[];
    } catch (e) {
      console.error('D1 error getting songs, fallback to local store', e);
    }
  }

  const data = getLocalData();
  const catMap = new Map(data.categories.map((c) => [c.id, c]));

  let enrichedSongs = data.songs.map((s) => {
    const cat = catMap.get(s.category_id);
    return {
      ...s,
      category_name_english: cat?.name_english || '',
      category_name_telugu: cat?.name_telugu || '',
      category_slug: cat?.slug || '',
      category_icon: cat?.icon || `/assets/deities/${cat?.slug || 'lord-ganesha'}.png`,
    };
  });

  if (options.categoryId) {
    enrichedSongs = enrichedSongs.filter((s) => s.category_id === options.categoryId);
  }
  if (options.categorySlug) {
    enrichedSongs = enrichedSongs.filter((s) => s.category_slug === options.categorySlug);
  }
  if (options.query) {
    const q = options.query.toLowerCase().trim();
    enrichedSongs = enrichedSongs.filter((s) => {
      const matchTitleTelugu = s.title_telugu.toLowerCase().includes(q);
      const matchTitleRoman = s.title_roman.toLowerCase().includes(q);
      const matchTags = (s.tags || '').toLowerCase().includes(q);
      const matchCategory = (s.category_name_english || '').toLowerCase().includes(q) ||
                            (s.category_name_telugu || '').toLowerCase().includes(q);
      return matchTitleTelugu || matchTitleRoman || matchTags || matchCategory;
    });
  }

  enrichedSongs.sort((a, b) => b.view_count - a.view_count);

  if (options.limit && options.limit > 0) {
    return enrichedSongs.slice(0, options.limit);
  }

  return enrichedSongs;
}

export async function getSongBySlug(slug: string): Promise<Song | null> {
  const songs = await getSongs();
  return songs.find((s) => s.slug === slug) || null;
}

function toSafeD1String(val: any): string {
  if (val === undefined || val === null) return '';
  if (Array.isArray(val)) return val.map((v) => String(v).trim()).filter(Boolean).join(', ');
  if (typeof val === 'object') {
    try {
      return Object.values(val).map((v) => String(v).trim()).filter(Boolean).join(', ');
    } catch {
      return JSON.stringify(val);
    }
  }
  return String(val).trim();
}

export async function createSong(song: Omit<Song, 'id' | 'view_count' | 'download_count'>): Promise<Song> {
  const newSong: Song = {
    ...song,
    id: `song-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    view_count: 0,
    download_count: 0,
    created_at: new Date().toISOString(),
  };

  const d1 = getD1Binding();
  if (d1) {
    try {
      await d1.prepare(`
        INSERT INTO songs (id, category_id, title_telugu, title_roman, slug, lyrics_telugu, lyrics_roman, tags, view_count, download_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0)
      `).bind(
        newSong.id,
        newSong.category_id,
        newSong.title_telugu,
        newSong.title_roman,
        newSong.slug,
        newSong.lyrics_telugu,
        newSong.lyrics_roman,
        toSafeD1String(newSong.tags)
      ).run();
      return newSong;
    } catch (e) {
      console.error('D1 error inserting song', e);
    }
  }

  const data = getLocalData();
  data.songs.unshift(newSong);
  saveLocalData(data);
  return newSong;
}

export async function updateSong(id: string, updates: Partial<Song>): Promise<Song | null> {
  const data = getLocalData();
  const index = data.songs.findIndex((s) => s.id === id);
  if (index === -1) return null;

  data.songs[index] = { ...data.songs[index], ...updates };
  saveLocalData(data);

  const d1 = getD1Binding();
  if (d1) {
    try {
      const s = data.songs[index];
      await d1.prepare(`
        UPDATE songs 
        SET category_id = ?, title_telugu = ?, title_roman = ?, slug = ?, lyrics_telugu = ?, lyrics_roman = ?, tags = ?
        WHERE id = ?
      `).bind(s.category_id, s.title_telugu, s.title_roman, s.slug, s.lyrics_telugu, s.lyrics_roman, toSafeD1String(s.tags), id).run();
    } catch (e) {
      console.error('D1 error updating song', e);
    }
  }

  return data.songs[index];
}

export async function deleteSong(id: string): Promise<boolean> {
  const data = getLocalData();
  data.songs = data.songs.filter((s) => s.id !== id);
  saveLocalData(data);

  const d1 = getD1Binding();
  if (d1) {
    try {
      await d1.prepare(`DELETE FROM songs WHERE id = ?`).bind(id).run();
    } catch (e) {
      console.error('D1 error deleting song', e);
    }
  }

  return true;
}

export async function incrementSongStat(slug: string, field: 'view' | 'download'): Promise<void> {
  const data = getLocalData();
  const song = data.songs.find((s) => s.slug === slug);
  if (song) {
    if (field === 'view') song.view_count = (song.view_count || 0) + 1;
    if (field === 'download') song.download_count = (song.download_count || 0) + 1;
    saveLocalData(data);
  }

  const d1 = getD1Binding();
  if (d1) {
    try {
      const col = field === 'view' ? 'view_count' : 'download_count';
      await d1.prepare(`UPDATE songs SET ${col} = ${col} + 1 WHERE slug = ?`).bind(slug).run();
    } catch (e) {
      // ignore stat error
    }
  }
}
