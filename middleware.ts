import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function middleware(request: NextRequest) {
  const referralCode = request.nextUrl.searchParams.get('code');
  if (referralCode) {
    const cookieStore = await cookies();
    cookieStore.set('referral_code', referralCode, { path: '/', secure: true });
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};