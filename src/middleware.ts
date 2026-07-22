import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { get, has } from '@vercel/edge-config';
import { proxy } from './proxy';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Auth0 Proxy Middleware
  const authResponse = await proxy(request);
  if (authResponse) return authResponse;

  // 2. Existing Edge Config logic
  if (pathname === '/welcome' || pathname === '/api/welcome') {
    try {
      if (await has('greeting')) {
        const greeting = await get('greeting');
        return NextResponse.json({
          greeting: greeting || "hello world",
          source: "vercel-edge-config-middleware",
          timestamp: new Date().toISOString()
        }, {
          headers: { 'x-middleware-cache': 'hit' }
        });
      }
    } catch (err) {
      console.error('Middleware Edge Config Error:', err);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (handled by SDK handleAuth, though proxy might overlap)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
