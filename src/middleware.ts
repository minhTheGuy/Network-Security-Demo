import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Cho phép truy cập các route auth và faceid
  if (
    pathname.startsWith('/sign-in') || 
    pathname.startsWith('/sign-up') ||
    pathname.startsWith('/faceid') ||
    pathname.startsWith('/api')
  ) {
    return NextResponse.next();
  }

  // Lấy cookie name từ env hoặc dùng default
  const sessionCookieName = process.env.SESSION_COOKIE_NAME ?? 'myapp-webauthn';
  
  // Kiểm tra session cookie (iron-session)
  const sessionCookie = request.cookies.get(sessionCookieName)?.value;
  // Kiểm tra token cookie (nếu có dùng JWT)
  const tokenCookie = request.cookies.get('token')?.value;
  // Kiểm tra session cookie cũ (backward compatibility)
  const legacySessionCookie = request.cookies.get('session')?.value;

  if (sessionCookie || tokenCookie || legacySessionCookie) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/sign-in', request.url);
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/profile', '/(dashboard)(.*)'],
};
