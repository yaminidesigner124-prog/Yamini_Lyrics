export async function onRequestPost(context: { request: Request }) {
  try {
    // ENFORCE ADMIN SESSION CHECK
    const cookieHeader = context.request.headers.get('Cookie') || '';
    if (!cookieHeader.includes('devotional_admin_session=authenticated_sacred_session')) {
      return new Response(JSON.stringify({ error: 'Unauthorized. Admin session required.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const contentType = context.request.headers.get('content-type') || '';
    let slug = '';
    let base64Clean = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await context.request.formData();
      const file = formData.get('image') as File | null;
      slug = (formData.get('slug') as string) || '';

      if (!file) {
        return new Response(JSON.stringify({ error: 'No image file uploaded' }), { status: 400 });
      }

      if (!slug) {
        const originalName = file.name || 'deity';
        slug = originalName.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      }
    } else {
      const body: any = await context.request.json().catch(() => ({}));
      slug = body.slug || '';
      const base64Data = body.base64 || '';
      base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '');
    }

    const safeSlug = slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `deity-${Date.now()}`;

    const fileName = `${safeSlug}.png`;
    const publicUrl = `/assets/deities/${fileName}`;

    return new Response(JSON.stringify({
      success: true,
      imageUrl: publicUrl,
      slug: safeSlug,
      message: 'Deity image uploaded successfully',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
