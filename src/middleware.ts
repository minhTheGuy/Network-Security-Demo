  import { NextRequest, NextResponse } from 'next/server';

  // Public pages that should not be redirected to sign-in
  const PUBLIC_PATHS = ['/sign-in', '/sign-up', '/faceid'];

  export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Nếu là trang công khai (sign-in, sign-up, faceid), không redirect — tránh vòng lặp
    if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
      return NextResponse.next();
    }

    // Kiểm tra cookie phiên
    const sessionCookieName = process.env.SESSION_COOKIE_NAME ?? 'myapp-webauthn';
    const sessionCookie = request.cookies.get(sessionCookieName)?.value;
    const tokenCookie = request.cookies.get('token')?.value;
    const legacySessionCookie = request.cookies.get('session')?.value;

    if (sessionCookie || tokenCookie || legacySessionCookie) {
      return NextResponse.next();
    }

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
