// app/api/config/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Fetch configuration from database
    const result = await query('SELECT key, value FROM system_settings');
    const config = result.rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});

    // Prepare cookie options
    const cookieOptions = {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7, // 1 week
      httpOnly: true,
    };

    // Set all configuration cookies
    const cookieStore = await cookies();
    cookieStore.set('app_site_name', config.site_name || '', cookieOptions);
    cookieStore.set('app_site_description', config.site_description || '', cookieOptions);
    cookieStore.set('app_site_url', config.site_url || '', cookieOptions);
    cookieStore.set('app_site_logo', config.site_logo || '', cookieOptions);
    cookieStore.set('app_site_favicon', config.site_favicon || '', cookieOptions);
    cookieStore.set('app_meta_keywords', config.seo_meta_keywords || '', cookieOptions);
    cookieStore.set('app_support_email', config.support_email || '', cookieOptions);
    cookieStore.set('app_support_phone', config.support_phone || '', cookieOptions);
    cookieStore.set('app_ga_id', config.seo_google_analytics || '', cookieOptions);
    cookieStore.set('app_fb_pixel', config.seo_facebook_pixel || '', cookieOptions);

    // Return the configuration as JSON
    return NextResponse.json({
      success: true,
      data: config,
      message: 'Configuration loaded and cookies set successfully'
    });

  } catch (error) {
    console.error('Error fetching app config:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro ao carregar configuração',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}