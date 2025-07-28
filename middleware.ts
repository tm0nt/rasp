// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const isProduction = process.env.NODE_ENV === 'production';

  // 1. Handle referral code
  const referralCode = request.nextUrl.searchParams.get('code');
  if (referralCode) {
    response.cookies.set({
      name: 'referral_code',
      value: referralCode,
      path: '/',
      secure: isProduction,
      sameSite: 'lax',
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30, // 30 dias
    });
  }
  return response;
}

export const config = {
  matcher: [
    '/((?!api/webhook|api|_next/static|_next/image|favicon.ico).*)',
  ],
};
