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

  // 2. Fetch app config and set cookies for layout
  try {
    const configUrl = new URL('/api/config/app', request.nextUrl.origin);
    const configResponse = await fetch(configUrl, {
      cache: 'no-store',
      headers: { 
        cookie: request.headers.get('cookie') || '',
        'x-middleware-request': 'true'
      },
    });

    if (configResponse.ok) {
      const configData = await configResponse.json();
      
      // Configurações de cookie padrão
      const cookieOptions = {
        path: '/',
        secure: isProduction,
        sameSite: 'lax' as const,
        maxAge: 60 * 60 * 1, // 1 hora de cache
        httpOnly: true,
      };

      // Definir cookies usando a nova API
      const cookiesToSet = [
        { name: 'app_site_name', value: configData.site_name },
        { name: 'app_site_description', value: configData.site_description },
        { name: 'app_site_url', value: configData.site_url },
        { name: 'app_site_logo', value: configData.site_logo },
        { name: 'app_site_favicon', value: configData.site_favicon },
        { name: 'app_meta_keywords', value: configData.seo_meta_keywords },
        { name: 'app_support_email', value: configData.support_email },
        { name: 'app_support_phone', value: configData.support_phone },
        { name: 'app_ga_id', value: configData.seo_google_analytics },
        { name: 'app_fb_pixel', value: configData.seo_facebook_pixel },
      ];

      // Usando response.cookies para definir múltiplos cookies
      cookiesToSet.forEach(({ name, value }) => {
        if (value) {
          response.cookies.set(name, value, cookieOptions);
        }
      });
    } else {
      console.error('Config API response not OK:', configResponse.status);
    }
  } catch (error) {
    console.error('Failed to fetch app config in middleware:', error);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api/webhook|api|_next/static|_next/image|favicon.ico).*)',
  ],
};
