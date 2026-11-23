import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'LordVen@0007';
const AUTH_COOKIE = 'devotional_admin_session';

// POST /api/auth - Admin login with password
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password, pin } = body;
    const incomingPass = String(password || pin || '').trim();

    if (incomingPass !== ADMIN_PASSWORD) {
      return NextResponse.json({ authenticated: false, message: 'Invalid Admin Password' }, { status: 401 });
    }

    const res = NextResponse.json({ authenticated: true, message: 'Authentication successful' });
    
    // Set secure cookie
    res.cookies.set(AUTH_COOKIE, 'authenticated_sacred_session', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return res;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/auth - Check admin session
export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(AUTH_COOKIE);
  const isAuthenticated = cookie?.value === 'authenticated_sacred_session';
  return NextResponse.json({ authenticated: isAuthenticated });
}

// DELETE /api/auth - Logout
export async function DELETE() {
  const res = NextResponse.json({ success: true, message: 'Logged out' });
  res.cookies.delete(AUTH_COOKIE);
  return res;
}
