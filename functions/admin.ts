// functions/admin.ts: Cloudflare Pages route redirect for /admin
export async function onRequest(context: { request: Request }) {
  const url = new URL(context.request.url);
  return Response.redirect(new URL('/admin/manage', context.request.url).toString(), 302);
}
