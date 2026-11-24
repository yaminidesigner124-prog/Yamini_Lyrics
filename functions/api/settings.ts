interface Env {
  DB?: any;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  try {
    const d1 = context.env.DB;
    if (!d1) {
      return new Response(JSON.stringify({
        upiId: 'yaminidesigner124@okicici',
        upiName: 'Yamini Lyrics',
        defaultPrice: 20,
        geminiApiKey: '',
        groqApiKey: '',
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    const rows = await d1.prepare('SELECT key, value FROM settings').all();
    const settingsMap: Record<string, string> = {};
    if (rows && rows.results) {
      for (const row of rows.results as any[]) {
        settingsMap[row.key] = row.value;
      }
    }

    return new Response(JSON.stringify({
      upiId: settingsMap['admin_upi_id'] || 'yaminidesigner124@okicici',
      upiName: settingsMap['admin_upi_name'] || 'Yamini Lyrics',
      defaultPrice: parseInt(settingsMap['default_pdf_price'] || '20', 10),
      geminiApiKey: settingsMap['gemini_api_key'] || '',
      groqApiKey: settingsMap['groq_api_key'] || '',
    }), {
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
    // Check admin session
    const cookieHeader = context.request.headers.get('Cookie') || '';
    if (!cookieHeader.includes('devotional_admin_session=authenticated_sacred_session')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body: any = await context.request.json();
    const { upiId, upiName, defaultPrice, geminiApiKey, groqApiKey } = body;

    const d1 = context.env.DB;
    if (!d1) {
      return new Response(JSON.stringify({ error: 'Database unavailable' }), { status: 500 });
    }

    if (upiId) {
      await d1.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').bind('admin_upi_id', String(upiId).trim()).run();
    }
    if (upiName) {
      await d1.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').bind('admin_upi_name', String(upiName).trim()).run();
    }
    if (defaultPrice !== undefined) {
      await d1.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').bind('default_pdf_price', String(defaultPrice)).run();
    }
    if (geminiApiKey !== undefined && String(geminiApiKey).trim() !== '') {
      await d1.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').bind('gemini_api_key', String(geminiApiKey).trim()).run();
    }
    if (groqApiKey !== undefined && String(groqApiKey).trim() !== '') {
      await d1.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').bind('groq_api_key', String(groqApiKey).trim()).run();
    }

    return new Response(JSON.stringify({ success: true, message: 'Settings saved' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
