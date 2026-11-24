-- schema.sql

-- 1. Deities / Categories (Folders)
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name_telugu TEXT NOT NULL,
  name_english TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT DEFAULT '🪔',
  subtitle_english TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Devotional Songs
CREATE TABLE IF NOT EXISTS songs (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  title_telugu TEXT NOT NULL,
  title_roman TEXT NOT NULL,
  title_english TEXT,
  slug TEXT UNIQUE NOT NULL,
  lyrics_telugu TEXT NOT NULL,
  lyrics_roman TEXT NOT NULL,
  meaning_english TEXT,
  tags TEXT,
  is_locked INTEGER DEFAULT 0,
  price INTEGER DEFAULT 20,
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- 3. Payment Transactions (PDF Unlock Receipts)
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  song_id TEXT NOT NULL,
  song_title TEXT NOT NULL,
  amount INTEGER DEFAULT 20,
  utr_number TEXT NOT NULL,
  user_name TEXT,
  user_phone TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (song_id) REFERENCES songs(id)
);

-- 4. Admin Credentials & Settings (UPI ID, Prices)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Indexes for lightning fast Edge search & audit
CREATE INDEX IF NOT EXISTS idx_songs_category ON songs(category_id);
CREATE INDEX IF NOT EXISTS idx_songs_slug ON songs(slug);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_song ON transactions(song_id);
