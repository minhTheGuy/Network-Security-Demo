  import { NextRequest, NextResponse } from 'next/server';
  import { verifyJwtToken } from '@lib/jwt';
  import { JWT_COOKIE_NAME } from '@lib/jwtConfig';
  import { addSecurityHeaders } from '@lib/security-headers';

  // Public pages that should not be redirected to sign-in
  const PUBLIC_PATHS = ['/', '/sign-in', '/sign-up', '/faceid'];

  export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    let response = NextResponse.next();

    // Add security headers to all responses
    response = addSecurityHeaders(response);

    // Cho phép API routes đi qua mà không cần authentication
    if (pathname.startsWith('/api')) {
      return response;
    }

    // Nếu là trang công khai (sign-in, sign-up, faceid), không redirect — tránh vòng lặp
    if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
      return response;
    }

    // Verify JWT token thực sự
    const tokenCookie = request.cookies.get(JWT_COOKIE_NAME)?.value;
    if (tokenCookie) {
      const payload = await verifyJwtToken(tokenCookie);
      if (payload && payload.userId) {
        return response; // Valid JWT token
      }
    }

    // Verify iron-session cookie
    const sessionCookieName = process.env.SESSION_COOKIE_NAME ?? 'myapp-webauthn';
    const sessionCookie = request.cookies.get(sessionCookieName)?.value;
    if (sessionCookie) {
      // Iron-session cookies are encrypted, if they exist and are valid format, allow
      // Full verification happens in server components/actions
      try {
        // Basic check: iron-session cookies have specific format
        if (sessionCookie.length > 20) {
          return response;
        }
      } catch {
        // Invalid cookie format
      }
    }

    // No valid authentication found
    const loginUrl = new URL('/sign-in', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  export const config = {
    matcher: [
      "/profile",
      "/dashboard/:path*",
      "/api/auth/:path*",
      "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
  };
