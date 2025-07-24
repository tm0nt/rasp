import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const result = await query(`
      SELECT key, value 
      FROM system_settings 
      WHERE key IN (
        'site_name', 'site_url', 'site_description', 'site_logo', 'site_favicon',
        'support_email', 'support_phone', 'seo_meta_title', 'seo_meta_description',
        'seo_meta_keywords', 'seo_google_analytics', 'seo_facebook_pixel'
      )
    `)

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Configurações não encontradas' },
        { status: 404 }
      )
    }

    // Convert to object
    const config = result.rows.reduce((acc: Record<string, any>, row: any) => {
      acc[row.key] = row.value
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      data: {
        siteConfig: {
          siteName: config.site_name || '',
          siteUrl: config.site_url || '',
          siteDescription: config.site_description || '',
          logo: config.site_logo || '',
          favicon: config.site_favicon || '',
          supportEmail: config.support_email || '',
          supportPhone: config.support_phone || '',
        },
        seoConfig: {
          metaTitle: config.seo_meta_title || '',
          metaDescription: config.seo_meta_description || '',
          metaKeywords: config.seo_meta_keywords || '',
          googleAnalyticsId: config.seo_google_analytics || '',
          facebookPixelId: config.seo_facebook_pixel || '',
        },
        maintenanceMode: false // Add this if you use maintenance mode
      }
    })

  } catch (error) {
    console.error('Error fetching app config:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar configurações do app' },
      { status: 500 }
    )
  }
}