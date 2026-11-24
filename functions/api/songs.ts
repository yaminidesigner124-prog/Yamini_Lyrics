interface Env {
  DB?: any;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  try {
    const { searchParams } = new URL(context.request.url);
    const slug = searchParams.get('slug');
    const query = searchParams.get('query');
    const categoryId = searchParams.get('categoryId');
    const categorySlug = searchParams.get('categorySlug');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50;

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
      await d1.prepare(`UPDATE songs SET ${col} = ${col} + 1 WHERE slug = ?`).bind(slug).run();
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

export async function onRequestPut(context: { request: Request; env: Env }) {
  try {
    const cookieHeader = context.request.headers.get('Cookie') || '';
    if (!cookieHeader.includes('devotional_admin_session=authenticated_sacred_session')) {
      return new Response(JSON.stringify({ error: 'Unauthorized. Admin session required.' }), { status: 401 });
    }

    const body: any = await context.request.json();
    const { id, title_telugu, title_roman, title_english, lyrics_telugu, lyrics_roman, tags, is_locked, price } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Song ID is required' }), { status: 400 });
    }

    const d1 = context.env.DB;
    if (!d1) {
      return new Response(JSON.stringify({ error: 'Database unavailable' }), { status: 500 });
    }

    await d1.prepare(`
      UPDATE songs SET
        title_telugu = COALESCE(?, title_telugu),
        title_roman = COALESCE(?, title_roman),
        title_english = COALESCE(?, title_english),
        lyrics_telugu = COALESCE(?, lyrics_telugu),
        lyrics_roman = COALESCE(?, lyrics_roman),
        tags = COALESCE(?, tags),
        is_locked = COALESCE(?, is_locked),
        price = COALESCE(?, price)
      WHERE id = ?
    `).bind(title_telugu, title_roman, title_english, lyrics_telugu, lyrics_roman, tags, is_locked, price, id).run();

    return new Response(JSON.stringify({ success: true }), {
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
      await d1.prepare('DELETE FROM songs WHERE id = ?').bind(id).run();
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
