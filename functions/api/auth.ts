interface Env {
  ADMIN_PASSWORD?: string;
  DB?: any;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const { request, env } = context;
    const body: any = await request.json().catch(() => ({}));
    const { password, code } = body;
    const incoming = String(password || code || '').trim();
    const adminPass = env.ADMIN_PASSWORD || 'LordVen@0007';

    // Identify client IP or rate limit key from Cloudflare headers
    const clientIp = request.headers.get('CF-Connecting-IP') || 'admin_security_key';
    const now = Date.now();
    const d1 = env.DB;

    let attempts = 0;
    let lockedUntil = 0;

    // Check rate limit state in D1
    if (d1) {
      try {
        const row: any = await d1.prepare('SELECT attempts, locked_until FROM admin_login_rate_limit WHERE key = ?').bind(clientIp).first();
        if (row) {
          attempts = row.attempts || 0;
          lockedUntil = row.locked_until || 0;
        }
      } catch {}
    }

    // 1. Check if currently locked out
    if (lockedUntil > now) {
      const minutesRemaining = Math.max(1, Math.ceil((lockedUntil - now) / 60000));
      return new Response(
        JSON.stringify({
          authenticated: false,
          locked: true,
          message: `Too many failed attempts (5/5). Account locked for ${minutesRemaining} minute(s) for security. Please try again later.`,
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // If lockout window passed, reset attempts
    if (lockedUntil > 0 && lockedUntil <= now) {
      attempts = 0;
      lockedUntil = 0;
    }

    // 2. Validate ONLY the secret code: LordVen@0007 (PIN 1008 removed)
    if (incoming !== adminPass) {
      const newAttempts = attempts + 1;
      let newLockedUntil = 0;

      if (newAttempts >= 5) {
        newLockedUntil = now + 15 * 60 * 1000; // Lock for 15 minutes
      }

      if (d1) {
        try {
          await d1.prepare(`
            INSERT INTO admin_login_rate_limit (key, attempts, locked_until, last_attempt)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET
              attempts = ?,
              locked_until = ?,
              last_attempt = ?
          `).bind(clientIp, newAttempts, newLockedUntil, now, newAttempts, newLockedUntil, now).run();
        } catch {}
      }

      if (newAttempts >= 5) {
        return new Response(
          JSON.stringify({
            authenticated: false,
            locked: true,
            message: 'Too many failed attempts (5/5). Account locked for 15 minutes for security.',
          }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const remainingAttempts = 5 - newAttempts;
      return new Response(
        JSON.stringify({
          authenticated: false,
          attempts: newAttempts,
          remainingAttempts,
          message: `Incorrect Secret Code. ${remainingAttempts} attempt(s) remaining before 15-minute security lockout.`,
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Successful authentication: Reset failed attempts
    if (d1) {
      try {
        await d1.prepare(`
          INSERT INTO admin_login_rate_limit (key, attempts, locked_until, last_attempt)
          VALUES (?, 0, 0, ?)
          ON CONFLICT(key) DO UPDATE SET
            attempts = 0,
            locked_until = 0,
            last_attempt = ?
        `).bind(clientIp, now, now).run();
      } catch {}
    }

    // Session duration: 4 hours (14400 seconds)
    return new Response(
      JSON.stringify({ authenticated: true, message: 'Authentication successful' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': 'devotional_admin_session=authenticated_sacred_session; Path=/; HttpOnly; SameSite=Lax; Max-Age=14400',
        },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestGet(context: { request: Request }) {
  const cookieHeader = context.request.headers.get('Cookie') || '';
  const isAuthenticated = cookieHeader.includes('devotional_admin_session=authenticated_sacred_session');
  return new Response(JSON.stringify({ authenticated: isAuthenticated }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestDelete() {
  return new Response(JSON.stringify({ success: true, message: 'Logged out' }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': 'devotional_admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
    },
  });
}
