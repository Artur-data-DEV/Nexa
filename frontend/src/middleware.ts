import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Get hostname from header or nextUrl, ensuring we handle ports correctly
  const hostHeader = request.headers.get('host')
  const hostname = hostHeader ? hostHeader.split(':')[0] : request.nextUrl.hostname

  // Redirect nexacreators.com to www.nexacreators.com
  if (hostname === 'nexacreators.com') {
    const url = request.nextUrl.clone()
    url.hostname = 'www.nexacreators.com'
    url.protocol = 'https'
    url.port = ''
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
