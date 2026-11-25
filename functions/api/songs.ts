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

export async function onRequestGet(context: { request: Request; env: Env }) {
  try {
    const { searchParams } = new URL(context.request.url);
    const slug = searchParams.get('slug');
    const query = searchParams.get('query');
    const categoryId = searchParams.get('categoryId');
    const categorySlug = searchParams.get('categorySlug');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 100;

    const d1 = context.env.DB;
    if (!d1) {
      return new Response(JSON.stringify({ error: 'Database unavailable' }), { status: 500 });
    }

    if (slug) {
      const song = await d1.prepare(`
        SELECT s.*, c.name_telugu as category_name_telugu, c.name_english as category_name_english, c.slug as category_slug
        FROM songs s
        LEFT JOIN categories c ON s.category_id = c.id
        WHERE s.slug = ?
        LIMIT 1
      `).bind(slug).first();

      if (!song) {
        return new Response(JSON.stringify({ error: 'Song not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ song }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let sql = `
      SELECT s.*, c.name_telugu as category_name_telugu, c.name_english as category_name_english, c.slug as category_slug
      FROM songs s
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE 1=1
    `;
    const bindings: any[] = [];

    if (categorySlug) {
      sql += ' AND c.slug = ?';
      bindings.push(categorySlug);
    }
    if (categoryId) {
      sql += ' AND s.category_id = ?';
      bindings.push(categoryId);
    }
    if (query) {
      sql += ` AND (s.title_telugu LIKE ? OR s.title_roman LIKE ? OR s.title_english LIKE ? OR s.tags LIKE ?)`;
      const term = `%${query}%`;
      bindings.push(term, term, term, term);
    }

    sql += ' ORDER BY s.view_count DESC LIMIT ?';
    bindings.push(limit);

    const { results } = await d1.prepare(sql).bind(...bindings).all();

    return new Response(JSON.stringify({ songs: results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const { searchParams } = new URL(context.request.url);
    const slug = searchParams.get('slug');
    const action = searchParams.get('action');

    const d1 = context.env.DB;
    if (d1 && slug && (action === 'view' || action === 'download')) {
      const col = action === 'view' ? 'view_count' : 'download_count';
      await d1.prepare(`UPDATE songs SET ${col} = ${col} + 1 WHERE slug = ? OR id = ?`).bind(slug, slug).run();
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid parameters' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// PUT: Dynamic Update supporting partial fields (eliminates undefined D1_TYPE_ERROR)
export async function onRequestPut(context: { request: Request; env: Env }) {
  try {
    const cookieHeader = context.request.headers.get('Cookie') || '';
    if (!cookieHeader.includes('devotional_admin_session=authenticated_sacred_session')) {
      return new Response(JSON.stringify({ error: 'Unauthorized. Admin session required.' }), { status: 401 });
    }

    const body: any = await context.request.json().catch(() => ({}));
    const { 
      id, 
      category_id,
      title_telugu, 
      title_roman, 
      title_english, 
      lyrics_telugu, 
      lyrics_roman, 
      meaning_english,
      tags, 
      is_locked, 
      price 
    } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Song ID is required' }), { status: 400 });
    }

    const d1 = context.env.DB;
    if (!d1) {
      return new Response(JSON.stringify({ error: 'Database unavailable' }), { status: 500 });
    }

    // Build dynamic update clauses so NO `undefined` is ever passed to D1!
    const updates: string[] = [];
    const bindings: any[] = [];

    if (category_id !== undefined && category_id !== null) {
      updates.push('category_id = ?');
      bindings.push(toSafeString(category_id));
    }
    if (title_telugu !== undefined && title_telugu !== null) {
      updates.push('title_telugu = ?');
      bindings.push(toSafeString(title_telugu));
    }
    if (title_roman !== undefined && title_roman !== null) {
      updates.push('title_roman = ?');
      bindings.push(toSafeString(title_roman));
    }
    if (title_english !== undefined && title_english !== null) {
      updates.push('title_english = ?');
      bindings.push(toSafeString(title_english));
    }
    if (lyrics_telugu !== undefined && lyrics_telugu !== null) {
      updates.push('lyrics_telugu = ?');
      bindings.push(toSafeString(lyrics_telugu));
    }
    if (lyrics_roman !== undefined && lyrics_roman !== null) {
      updates.push('lyrics_roman = ?');
      bindings.push(toSafeString(lyrics_roman));
    }
    if (meaning_english !== undefined && meaning_english !== null) {
      updates.push('meaning_english = ?');
      bindings.push(toSafeString(meaning_english));
    }
    if (tags !== undefined && tags !== null) {
      updates.push('tags = ?');
      bindings.push(toSafeString(tags));
    }
    if (is_locked !== undefined && is_locked !== null) {
      updates.push('is_locked = ?');
      bindings.push(Number(is_locked) === 1 ? 1 : 0);
    }
    if (price !== undefined && price !== null) {
      updates.push('price = ?');
      bindings.push(parseInt(String(price), 10) || 20);
    }

    if (updates.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No fields to update' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    bindings.push(id);
    await d1.prepare(`UPDATE songs SET ${updates.join(', ')} WHERE id = ?`).bind(...bindings).run();

    return new Response(JSON.stringify({ success: true, message: 'Song updated successfully in D1 database' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function onRequestDelete(context: { request: Request; env: Env }) {
  try {
    const cookieHeader = context.request.headers.get('Cookie') || '';
    if (!cookieHeader.includes('devotional_admin_session=authenticated_sacred_session')) {
      return new Response(JSON.stringify({ error: 'Unauthorized. Admin session required.' }), { status: 401 });
    }

    const { searchParams } = new URL(context.request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ error: 'Song ID is required' }), { status: 400 });
    }

    const d1 = context.env.DB;
    if (d1) {
      // Also delete any transaction records associated with this song
      await d1.prepare('DELETE FROM transactions WHERE song_id = ?').bind(id).run().catch(() => {});
      await d1.prepare('DELETE FROM songs WHERE id = ?').bind(id).run();
    }

    return new Response(JSON.stringify({ success: true, message: 'Song deleted from D1 database' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
