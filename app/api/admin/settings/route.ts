import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { query } from '@/lib/db'

interface SiteConfig {
  siteName: string
  siteUrl: string
  siteDescription: string
  logo: string
  favicon: string
  supportEmail: string
  supportPhone: string
}

interface SeoConfig {
  metaTitle: string
  metaDescription: string
  metaKeywords: string
  googleAnalyticsId: string
  facebookPixelId: string
}

interface SystemSettings {
  siteConfig: SiteConfig
  seoConfig: SeoConfig
  maintenanceMode: boolean
  rtpValue: number
  minSpinsForWithdrawal: number
  minWithdrawal: number
}

// GET - Buscar configurações
export async function GET() {
  try {
    const result = await query(`
      SELECT key, value 
      FROM system_settings 
      WHERE key IN (
        'site_name', 'site_url', 'site_description', 'site_logo', 'site_favicon',
        'support_email', 'support_phone', 'seo_meta_title', 'seo_meta_description',
        'seo_meta_keywords', 'seo_google_analytics', 'seo_facebook_pixel', 'maintenance_mode', 
        'rtp_value', 'min_spins_withdrawal', 'min_withdrawal_amount'
      )
    `)

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Configurações não encontradas' },
        { status: 404 }
      )
    }

    const config = result.rows.reduce((acc: Record<string, string>, row: any) => {
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
        maintenanceMode: config.maintenance_mode === 'true' || false,
        rtpValue: config.rtp_value ? parseInt(config.rtp_value) : 0,
        minSpinsForWithdrawal: config.min_spins_withdrawal ? parseInt(config.min_spins_withdrawal) : 0,
        minWithdrawal: config.min_withdrawal_amount ? parseFloat(config.min_withdrawal_amount) : 0
      }
    })

  } catch (error: any) {
    console.error('Error fetching settings:', error.message)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao buscar configurações',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// POST - Atualizar configurações
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  try {
    const body = await request.json()
    const settings: SystemSettings = body.settings

    if (!settings?.siteConfig || !settings?.seoConfig) {
      return NextResponse.json(
        { error: 'Dados de configuração inválidos' },
        { status: 400 }
      )
    }

    // Prepare all settings to update
    const updates = [
      { key: 'site_name', value: settings.siteConfig.siteName },
      { key: 'site_url', value: settings.siteConfig.siteUrl },
      { key: 'site_description', value: settings.siteConfig.siteDescription },
      { key: 'site_logo', value: settings.siteConfig.logo },
      { key: 'site_favicon', value: settings.siteConfig.favicon },
      { key: 'support_email', value: settings.siteConfig.supportEmail },
      { key: 'support_phone', value: settings.siteConfig.supportPhone },
      { key: 'seo_meta_title', value: settings.seoConfig.metaTitle },
      { key: 'seo_meta_description', value: settings.seoConfig.metaDescription },
      { key: 'seo_meta_keywords', value: settings.seoConfig.metaKeywords },
      { key: 'seo_google_analytics', value: settings.seoConfig.googleAnalyticsId },
      { key: 'seo_facebook_pixel', value: settings.seoConfig.facebookPixelId },
      { key: 'maintenance_mode', value: settings.maintenanceMode.toString() },
      { key: 'rtp_value', value: settings.rtpValue.toString() },
      { key: 'min_spins_withdrawal', value: settings.minSpinsForWithdrawal.toString() },
      { key: 'min_withdrawal_amount', value: settings.minWithdrawal.toString() },
    ]

    // Execute all updates in a transaction
    await query('BEGIN')
    
    for (const { key, value } of updates) {
      await query(
        `INSERT INTO system_settings (key, value)
         VALUES ($1, $2)
         ON CONFLICT (key) 
         DO UPDATE SET value = $2, updated_at = NOW()`,
        [key, value]
      )
    }
    
    await query('COMMIT')

    return NextResponse.json({
      success: true,
      message: 'Configurações atualizadas com sucesso',
    })

  } catch (error: any) {
    await query('ROLLBACK')
    console.error('Error updating settings:', error.message)
    return NextResponse.json(
      { 
        error: 'Erro ao atualizar configurações',
        details: error.message 
      },
      { status: 500 }
    )
  }
}