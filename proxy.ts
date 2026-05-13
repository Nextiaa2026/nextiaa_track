import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // Remove locale prefix (e.g. /en, /fr) to get the real path
  const pathnameWithoutLocale = nextUrl.pathname.replace(/^\/(en|fr)(\/|$)/, '/');

  const isProtectedPath =
    pathnameWithoutLocale === '/track' ||
    pathnameWithoutLocale.startsWith('/track/') ||
    pathnameWithoutLocale === '/dashboard' ||
    pathnameWithoutLocale.startsWith('/dashboard/');

  const isAuthPath =
    pathnameWithoutLocale === '/login' ||
    pathnameWithoutLocale.startsWith('/login/');

  if (isProtectedPath && !isLoggedIn) {
    // Let next-intl handle the locale on the response side — just redirect to /login
    // and the intl middleware will add the right locale prefix
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (isAuthPath && isLoggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: ['/((?!api|trpc|_next|_vercel|.*\\..*).*)'],
};
