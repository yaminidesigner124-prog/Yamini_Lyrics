interface Env {
  DB?: any;
}

// POST: Public endpoint to verify UTR, unlock PDF, and record payment
export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const body: any = await context.request.json().catch(() => ({}));
    const { song_id, song_title, utr_number, amount = 20, user_name, user_phone } = body;

    if (!song_id || !utr_number) {
      return new Response(
        JSON.stringify({ error: 'Song ID and UTR Number are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const cleanUtr = String(utr_number).trim().replace(/[^a-zA-Z0-9]/g, '');
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

    const txnId = `txn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // 1. Record transaction in database
    await d1.prepare(`
      INSERT INTO transactions (id, song_id, song_title, amount, utr_number, user_name, user_phone, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'completed')
    `).bind(
      txnId,
      song_id,
      song_title || 'Devotional Song',
      amount,
      cleanUtr,
      user_name || 'Devotee',
      user_phone || ''
    ).run();

    // 2. Increment song's download count
    await d1.prepare(`
      UPDATE songs SET download_count = download_count + 1 WHERE id = ?
    `).bind(song_id).run();

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

// GET: Admin endpoint to view earnings, stats, and audit history
export async function onRequestGet(context: { request: Request; env: Env }) {
  try {
    const d1 = context.env.DB;
    if (!d1) {
      return new Response(JSON.stringify({ totalRevenue: 0, totalTransactions: 0, recentTransactions: [] }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Total revenue & count
    const statsRow = await d1.prepare(`
      SELECT 
        COALESCE(SUM(amount), 0) as totalRevenue,
        COUNT(id) as totalTransactions
      FROM transactions
    `).first();

    // Recent 50 transactions
    const listRes = await d1.prepare(`
      SELECT * FROM transactions
      ORDER BY created_at DESC
      LIMIT 50
    `).all();

    // Settings
    const upiRow = await d1.prepare(`SELECT value FROM settings WHERE key = 'admin_upi_id'`).first();
    const nameRow = await d1.prepare(`SELECT value FROM settings WHERE key = 'admin_upi_name'`).first();
    const priceRow = await d1.prepare(`SELECT value FROM settings WHERE key = 'default_pdf_price'`).first();

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
