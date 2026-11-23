import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Safe optional Node.js modules for local dev fallback (hidden from edge bundler)
let fsModule: any = null;
let pathModule: any = null;
if (typeof window === 'undefined' && typeof process !== 'undefined' && process.versions?.node && !(globalThis as any).EdgeRuntime) {
  try {
    const nodeRequire = (globalThis as any).__non_webpack_require__ || eval('require');
    fsModule = nodeRequire('fs');
    pathModule = nodeRequire('path');
  } catch {}
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    let slug = '';
    let buffer: Buffer | null = null;
    let base64Clean = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('image') as File | null;
      slug = (formData.get('slug') as string) || '';

      if (!file) {
        return NextResponse.json({ error: 'No image file uploaded' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);

      if (!slug) {
        const originalName = file.name || 'deity';
        slug = originalName.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      }
    } else {
      // JSON body with base64
      const body = await req.json();
      slug = body.slug || '';
      const base64Data = body.base64 || '';

      if (!base64Data) {
        return NextResponse.json({ error: 'No base64 image data provided' }, { status: 400 });
      }

      base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '');
      buffer = Buffer.from(base64Clean, 'base64');
    }

    const safeSlug = slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `deity-${Date.now()}`;

    const fileName = `${safeSlug}.png`;

    // If running in local Node environment, write to disk
    if (fsModule && pathModule && buffer) {
      try {
        const targetDir = pathModule.join(process.cwd(), 'public', 'assets', 'deities');
        if (!fsModule.existsSync(targetDir)) {
          fsModule.mkdirSync(targetDir, { recursive: true });
        }
        const targetPath = pathModule.join(targetDir, fileName);
        fsModule.writeFileSync(targetPath, buffer);
      } catch (err) {
        console.warn('Could not write image to local filesystem in edge runtime:', err);
      }
    }

    const publicUrl = `/assets/deities/${fileName}`;

    return NextResponse.json({
      success: true,
      imageUrl: publicUrl,
      slug: safeSlug,
      message: 'Deity image uploaded successfully',
    });
  } catch (error: any) {
    console.error('Image upload error:', error);
    return NextResponse.json({ error: error.message || 'Image upload failed' }, { status: 500 });
  }
}
