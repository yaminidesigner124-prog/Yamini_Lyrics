import { NextRequest, NextResponse } from 'next/server';
import { getCategories, createCategory, getCategoryBySlug, deleteCategory } from '@/lib/d1';

export const runtime = 'edge';

// GET /api/categories
export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json({ categories });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/categories - Admin creates new deity folder/category
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name_english = body.name_english || body.nameEnglish;
    const name_telugu = body.name_telugu || body.nameTelugu;
    const slug = body.slug;
    const subtitle_english = body.subtitle_english || body.subtitleEnglish || body.description;
    const icon = body.icon;

    if (!name_english || !name_english.trim()) {
      return NextResponse.json({ error: 'Deity name (name_english) is required' }, { status: 400 });
    }

    const finalSlug = (slug || name_english)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const existing = await getCategoryBySlug(finalSlug);
    if (existing) {
      return NextResponse.json(
        { error: `A deity folder with slug '${finalSlug}' already exists.` },
        { status: 409 }
      );
    }

    const newCategory = await createCategory({
      name_english: name_english.trim(),
      name_telugu: (name_telugu || name_english).trim(),
      slug: finalSlug,
      subtitle_english: subtitle_english || 'Devotional Stotrams & Sacred Hymns',
      icon: icon || `/assets/deities/${finalSlug}.png`,
      display_order: 99,
    });

    return NextResponse.json({ success: true, category: newCategory }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/categories?id=... or ?slug=...
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');
    const target = id || slug;

    if (!target) {
      return NextResponse.json({ error: 'Category id or slug is required' }, { status: 400 });
    }

    const deleted = await deleteCategory(target);
    if (!deleted) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Deity folder deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
