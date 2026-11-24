// functions/admin/_middleware.ts: Cloudflare Pages Edge Authentication Guard
export async function onRequest(context: { request: Request; next: () => Promise<Response> }) {
  const url = new URL(context.request.url);

  // 1. Allow login page to load without restrictions
  if (
    url.pathname === '/admin/login' || 
    url.pathname === '/admin/login/' || 
    url.pathname.startsWith('/admin/login')
  ) {
    return context.next();
  }

  // 2. Check for sacred session cookie
  const cookieHeader = context.request.headers.get('Cookie') || '';
  const isAuthenticated = cookieHeader.includes('devotional_admin_session=authenticated_sacred_session');

  // 3. If unauthenticated, redirect immediately at Cloudflare Edge before serving any page HTML
  if (!isAuthenticated) {
    const loginUrl = new URL('/admin/login', context.request.url);
    loginUrl.searchParams.set('redirect', url.pathname);
    return Response.redirect(loginUrl.toString(), 302);
  }

  // 4. If authenticated, allow access to requested admin route
  return context.next();
}
