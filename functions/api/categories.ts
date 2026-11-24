interface Env {
  DB?: any;
}

export async function onRequestGet(context: { env: Env }) {
  try {
    const d1 = context.env.DB;
    if (d1) {
      const { results } = await d1.prepare(`
        SELECT c.*, COUNT(s.id) as song_count 
        FROM categories c 
        LEFT JOIN songs s ON c.id = s.category_id 
        GROUP BY c.id 
        ORDER BY c.display_order ASC
      `).all();
      return new Response(JSON.stringify({ categories: results }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ categories: [] }), {
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
    const { request, env } = context;
    const body: any = await request.json();
    const name_english = body.name_english || body.nameEnglish;
    const name_telugu = body.name_telugu || body.nameTelugu;
    const slug = body.slug;
    const subtitle_english = body.subtitle_english || body.subtitleEnglish || body.description || 'Devotional Stotrams & Sacred Hymns';
    const icon = body.icon || `/assets/deities/${(slug || name_english).toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;

    if (!name_english || !name_english.trim()) {
      return new Response(JSON.stringify({ error: 'Deity name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const finalSlug = (slug || name_english)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const d1 = env.DB;
    if (!d1) {
      return new Response(JSON.stringify({ error: 'Database binding unavailable' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const id = `cat-${Date.now()}`;
    await d1.prepare(`
      INSERT INTO categories (id, name_telugu, name_english, subtitle_english, slug, icon, display_order)
      VALUES (?, ?, ?, ?, ?, ?, 99)
    `).bind(id, (name_telugu || name_english).trim(), name_english.trim(), subtitle_english, finalSlug, icon).run();

    return new Response(JSON.stringify({
      success: true,
      category: { id, name_telugu, name_english, subtitle_english, slug: finalSlug, icon, song_count: 0 }
    }), {
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

export async function onRequestDelete(context: { request: Request; env: Env }) {
  try {
    const url = new URL(context.request.url);
    const id = url.searchParams.get('id');
    const slug = url.searchParams.get('slug');

    const d1 = context.env.DB;
    if (!d1) {
      return new Response(JSON.stringify({ error: 'Database unavailable' }), { status: 500 });
    }

    if (id) {
      await d1.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();
    } else if (slug) {
      await d1.prepare('DELETE FROM categories WHERE slug = ?').bind(slug).run();
    } else {
      return new Response(JSON.stringify({ error: 'Category ID or slug is required' }), { status: 400 });
    }

    return new Response(JSON.stringify({ success: true }));
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
