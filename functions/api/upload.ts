interface Env {
  DB?: any;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const body: any = await context.request.json();
    const { category_id, title_telugu, title_roman, slug, lyrics_telugu, lyrics_roman, tags } = body;

    if (!category_id || !title_telugu || !lyrics_telugu) {
      return new Response(
        JSON.stringify({ error: 'Category, Telugu title, and Telugu lyrics are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const finalSlug = (slug || title_roman || title_telugu)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const d1 = context.env.DB;
    if (!d1) {
      return new Response(JSON.stringify({ error: 'Database unavailable' }), { status: 500 });
    }

    const id = `song-${Date.now()}`;
    await d1.prepare(`
      INSERT INTO songs (id, category_id, title_telugu, title_roman, title_english, slug, lyrics_telugu, lyrics_roman, tags, view_count, download_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)
    `).bind(
      id,
      category_id,
      title_telugu,
      title_roman || title_telugu,
      title_roman || title_telugu,
      finalSlug,
      lyrics_telugu,
      lyrics_roman || lyrics_telugu,
      tags || ''
    ).run();

    return new Response(JSON.stringify({ success: true, song: { id, slug: finalSlug } }), {
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
