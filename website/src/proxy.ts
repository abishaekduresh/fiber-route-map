import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js 16 Proxy (replaces middleware.ts)
 *
 * Redirects /setup → /login if setup_complete cookie is set.
 * The cookie is written by the setup wizard after a successful run.
 */
export function proxy(request: NextRequest) {
  const setupComplete = request.cookies.get('setup_complete')?.value === 'true';
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/setup') && setupComplete) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/setup', '/setup/:path*'],
};
