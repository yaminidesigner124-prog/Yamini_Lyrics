interface Env {
  ADMIN_PASSWORD?: string;
  DB?: any;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const { request, env } = context;
    const body: any = await request.json().catch(() => ({}));
    const { password, pin } = body;
    const incoming = String(password || pin || '').trim();
    const adminPass = env.ADMIN_PASSWORD || 'LordVen@0007';

    if (incoming !== adminPass && incoming !== '1008') {
      return new Response(
        JSON.stringify({ authenticated: false, message: 'Invalid Admin Password or PIN' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ authenticated: true, message: 'Authentication successful' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': 'devotional_admin_session=authenticated_sacred_session; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800',
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
