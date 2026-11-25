interface Env {
  DB?: any;
}

function toSafeString(val: any): string {
  if (val === undefined || val === null) return '';
  if (Array.isArray(val)) {
    return val.map((item) => (typeof item === 'object' ? JSON.stringify(item) : String(item).trim())).filter(Boolean).join(', ');
  }
  if (typeof val === 'object') {
    try {
      return Object.values(val).map((v) => String(v).trim()).filter(Boolean).join(', ');
    } catch {
      return JSON.stringify(val);
    }
  }
  return String(val).trim();
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    // Verify admin authentication
    const cookieHeader = context.request.headers.get('Cookie') || '';
    if (!cookieHeader.includes('devotional_admin_session=authenticated_sacred_session')) {
      return new Response(JSON.stringify({ error: 'Unauthorized. Admin session required.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body: any = await context.request.json().catch(() => ({}));
    const { 
      category_id, 
      title_telugu, 
      title_roman, 
      title_english, 
      slug, 
      lyrics_telugu, 
      lyrics_roman, 
      meaning_english,
      tags, 
      is_locked = 1, // Default 1 (Paid) for new admin uploads
      price = 20      // Default ₹20
    } = body;

    if (!category_id || !title_telugu || !lyrics_telugu) {
      return new Response(
        JSON.stringify({ error: 'Category, Telugu title, and Telugu lyrics are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let finalSlug = (slug || title_roman || title_telugu)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const d1 = context.env.DB;
    if (!d1) {
      return new Response(JSON.stringify({ error: 'Database unavailable' }), { status: 500 });
    }

    // Check if slug already exists to prevent duplicate conflict crash
    try {
      const existing = await d1.prepare('SELECT id FROM songs WHERE slug = ?').bind(finalSlug).first();
      if (existing) {
        finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
      }
    } catch {}

    const id = `song-${Date.now()}`;
    await d1.prepare(`
      INSERT INTO songs (
        id, category_id, title_telugu, title_roman, title_english, 
        slug, lyrics_telugu, lyrics_roman, meaning_english, tags, 
        is_locked, price, view_count, download_count
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)
    `).bind(
      id,
      toSafeString(category_id),
      toSafeString(title_telugu),
      toSafeString(title_roman || title_telugu),
      toSafeString(title_english || title_roman || title_telugu),
      finalSlug,
      toSafeString(lyrics_telugu),
      toSafeString(lyrics_roman || lyrics_telugu),
      toSafeString(meaning_english || ''),
      toSafeString(tags || ''),
      is_locked ? 1 : 0,
      price ? parseInt(String(price), 10) : 20
    ).run();

    return new Response(JSON.stringify({ success: true, song: { id, slug: finalSlug, is_locked, price } }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
