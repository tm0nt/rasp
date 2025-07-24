// app/api/config/app/route.ts
import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    // Buscar todas as configurações relevantes
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
        { error: 'Configurações não encontradas' },
        { status: 404 }
      )
    }

    // Converter para objeto simples
    const config = result.rows.reduce((acc: Record<string, any>, row: any) => {
      acc[row.key] = row.value
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      data: {
        site_name: config.site_name || '',
        site_url: config.site_url || '',
        site_description: config.site_description || '',
        site_logo: config.site_logo || '',
        site_favicon: config.site_favicon || '',
        support_email: config.support_email || '',
        support_phone: config.support_phone || '',
        seo_meta_title: config.seo_meta_title || '',
        seo_meta_description: config.seo_meta_description || '',
        seo_meta_keywords: config.seo_meta_keywords || '',
        seo_google_analytics: config.seo_google_analytics || '',
        seo_facebook_pixel: config.seo_facebook_pixel || '',
      }
    })

  } catch (error) {
    console.error('Error fetching app config:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar configurações do app' },
      { status: 500 }
    )
  }
}