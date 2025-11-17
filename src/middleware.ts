import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('session')?.value;
  const tokenCookie = request.cookies.get('token')?.value;

  if (sessionCookie || tokenCookie) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/sign-in', request.url);
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/profile', '/(dashboard)(.*)'],
};
