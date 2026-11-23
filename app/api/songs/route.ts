import { NextRequest, NextResponse } from 'next/server';
import { getSongs, getSongBySlug, incrementSongStat, updateSong, deleteSong } from '@/lib/d1';

export const runtime = 'edge';

// GET /api/songs?slug=... or ?query=... or ?category=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const query = searchParams.get('query') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;
    const categorySlug = searchParams.get('categorySlug') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;

    if (slug) {
      const song = await getSongBySlug(slug);
      if (!song) {
        return NextResponse.json({ error: 'Song not found' }, { status: 404 });
      }
      return NextResponse.json({ song });
    }

    const songs = await getSongs({
      query,
      categoryId,
      categorySlug,
      limit,
    });

    return NextResponse.json({ songs });
  } catch (error: any) {
    console.error('API /api/songs error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// POST /api/songs?slug=...&action=view|download
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const action = searchParams.get('action') as 'view' | 'download' | null;

    if (slug && (action === 'view' || action === 'download')) {
      await incrementSongStat(slug, action);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/songs - update existing song
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: 'Song ID is required' }, { status: 400 });
    }

    const updated = await updateSong(body.id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Song not found or update failed' }, { status: 404 });
    }

    return NextResponse.json({ song: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/songs?id=...
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Song ID is required' }, { status: 400 });
    }

    const success = await deleteSong(id);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
