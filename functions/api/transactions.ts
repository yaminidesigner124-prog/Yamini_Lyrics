interface Env {
  DB?: any;
}

// POST: Public endpoint to verify UTR, unlock PDF, and record payment
export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const body: any = await context.request.json().catch(() => ({}));
    const songParam = body.song_id || body.songId || body.song_slug || body.songSlug;
    const utr = body.utr_number || body.utrNumber || body.utr;
    const amount = body.amount !== undefined ? parseInt(String(body.amount), 10) : 20;
    const userName = String(body.user_name || body.userName || '').trim();
    const userPhone = body.user_phone || body.userPhone || '';
    let songTitle = body.song_title || body.songTitle || 'Devotional Song';

    if (!userName) {
      return new Response(
        JSON.stringify({ error: 'Devotee Name is required. Please provide your name to verify payment.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!songParam || !utr) {
      return new Response(
        JSON.stringify({ error: 'Song reference and UTR Number are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const cleanUtr = String(utr).trim().replace(/[^a-zA-Z0-9]/g, '');
    if (cleanUtr.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Invalid UTR format. Please enter a valid 12-digit transaction reference number.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const d1 = context.env.DB;
    if (!d1) {
      return new Response(JSON.stringify({ error: 'Database unavailable' }), { status: 500 });
    }

    // Resolve song_id and title if slug was provided
    let finalSongId = songParam;
    try {
      const songRow: any = await d1.prepare(`
        SELECT id, title_roman, title_telugu FROM songs WHERE id = ? OR slug = ? LIMIT 1
      `).bind(songParam, songParam).first();

      if (songRow) {
        finalSongId = songRow.id;
        songTitle = songRow.title_roman || songRow.title_telugu || songTitle;
      }
    } catch {}

    const txnId = `txn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // 1. Record transaction in database
    await d1.prepare(`
      INSERT INTO transactions (id, song_id, song_title, amount, utr_number, user_name, user_phone, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'completed')
    `).bind(
      txnId,
      finalSongId,
      songTitle,
      amount,
      cleanUtr,
      userName,
      userPhone
    ).run();

    // 2. Increment song's download count
    await d1.prepare(`
      UPDATE songs SET download_count = download_count + 1 WHERE id = ?
    `).bind(finalSongId).run();

    return new Response(
      JSON.stringify({
        success: true,
        unlocked: true,
        transactionId: txnId,
        message: 'Payment verified and PDF unlocked successfully'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// GET: Admin-ONLY endpoint to view earnings, stats, and audit history
export async function onRequestGet(context: { request: Request; env: Env }) {
  try {
    // ENFORCE ADMIN SESSION CHECK (Prevents financial data and UTR leak)
    const cookieHeader = context.request.headers.get('Cookie') || '';
    if (!cookieHeader.includes('devotional_admin_session=authenticated_sacred_session')) {
      return new Response(JSON.stringify({ error: 'Unauthorized. Admin session required.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const d1 = context.env.DB;
    if (!d1) {
      return new Response(JSON.stringify({ totalRevenue: 0, totalTransactions: 0, recentTransactions: [] }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Total revenue & count
    const statsRow: any = await d1.prepare(`
      SELECT 
        COALESCE(SUM(amount), 0) as totalRevenue,
        COUNT(id) as totalTransactions
      FROM transactions
    `).first();

    // Recent 50 transactions
    const listRes: any = await d1.prepare(`
      SELECT * FROM transactions
      ORDER BY created_at DESC
      LIMIT 50
    `).all();

    // Settings
    const upiRow: any = await d1.prepare(`SELECT value FROM settings WHERE key = 'admin_upi_id'`).first();
    const nameRow: any = await d1.prepare(`SELECT value FROM settings WHERE key = 'admin_upi_name'`).first();
    const priceRow: any = await d1.prepare(`SELECT value FROM settings WHERE key = 'default_pdf_price'`).first();

    return new Response(
      JSON.stringify({
        totalRevenue: statsRow?.totalRevenue || 0,
        totalTransactions: statsRow?.totalTransactions || 0,
        upiId: upiRow?.value || 'yaminidesigner124@okicici',
        upiName: nameRow?.value || 'Yamini Lyrics',
        defaultPrice: parseInt(priceRow?.value || '20', 10),
        recentTransactions: listRes?.results || [],
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
