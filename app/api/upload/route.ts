import { NextRequest, NextResponse } from 'next/server';
import { createSong, getSongBySlug } from '@/lib/d1';

export const runtime = 'edge';

// POST /api/upload - Ingest & save song to D1
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category_id, title_telugu, title_roman, slug, lyrics_telugu, lyrics_roman, tags } = body;

    if (!category_id || !title_telugu || !lyrics_telugu) {
      return NextResponse.json(
        { error: 'Category, Telugu title, and Telugu lyrics are required' },
        { status: 400 }
      );
    }

    const finalSlug = (slug || title_roman || title_telugu)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check if slug already exists
    const existing = await getSongBySlug(finalSlug);
    if (existing) {
      return NextResponse.json(
        { error: `A devotional song with slug '${finalSlug}' already exists. Please choose a distinct slug.` },
        { status: 409 }
      );
    }

    const newSong = await createSong({
      category_id,
      title_telugu,
      title_roman: title_roman || title_telugu,
      slug: finalSlug,
      lyrics_telugu,
      lyrics_roman: lyrics_roman || lyrics_telugu,
      tags: tags || '',
    });

    return NextResponse.json({ success: true, song: newSong }, { status: 201 });
  } catch (error: any) {
    console.error('Upload API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
