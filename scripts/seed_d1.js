const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', '.data', 'devotional_db.json');
const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

let sql = '';

for (const c of data.categories) {
  const name_telugu = (c.name_telugu || '').replace(/'/g, "''");
  const name_english = (c.name_english || '').replace(/'/g, "''");
  const subtitle_english = (c.subtitle_english || '').replace(/'/g, "''");
  const slug = (c.slug || '').replace(/'/g, "''");
  const icon = (c.icon || '').replace(/'/g, "''");
  const display_order = c.display_order || 0;

  sql += `INSERT OR REPLACE INTO categories (id, name_telugu, name_english, subtitle_english, slug, icon, display_order) VALUES ('${c.id}', '${name_telugu}', '${name_english}', '${subtitle_english}', '${slug}', '${icon}', ${display_order});\n`;
}

for (const s of data.songs) {
  const category_id = (s.category_id || '').replace(/'/g, "''");
  const title_telugu = (s.title_telugu || '').replace(/'/g, "''");
  const title_roman = (s.title_roman || '').replace(/'/g, "''");
  const title_english = (s.title_english || '').replace(/'/g, "''");
  const slug = (s.slug || '').replace(/'/g, "''");
  const lyrics_telugu = (s.lyrics_telugu || '').replace(/'/g, "''");
  const lyrics_roman = (s.lyrics_roman || '').replace(/'/g, "''");
  const tags = (s.tags || '').replace(/'/g, "''");
  const view_count = s.view_count || 0;
  const download_count = s.download_count || 0;

  sql += `INSERT OR REPLACE INTO songs (id, category_id, title_telugu, title_roman, title_english, slug, lyrics_telugu, lyrics_roman, tags, view_count, download_count) VALUES ('${s.id}', '${category_id}', '${title_telugu}', '${title_roman}', '${title_english}', '${slug}', '${lyrics_telugu}', '${lyrics_roman}', '${tags}', ${view_count}, ${download_count});\n`;
}

fs.writeFileSync(path.join(__dirname, '..', 'seed.sql'), sql, 'utf8');
console.log('Generated seed.sql successfully with ' + data.categories.length + ' categories and ' + data.songs.length + ' songs.');
