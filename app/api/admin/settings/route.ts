import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { query } from '@/lib/db'

// Tipos para as configurações
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

export interface SystemSettings {
  siteConfig: SiteConfig
  seoConfig: SeoConfig
  maintenanceMode: boolean
}

// Helper para converter settings do banco para o formato do frontend
function dbSettingsToFrontend(settings: any[]): SystemSettings {
  const settingsObj = settings.reduce((acc, setting) => {
    acc[setting.key] = setting.value
    return acc
  }, {})

  return {
    siteConfig: {
      siteName: settingsObj['site_name'] || '',
      siteUrl: settingsObj['site_url'] || '',
      siteDescription: settingsObj['site_description'] || '',
      logo: settingsObj['site_logo'] || '',
      favicon: settingsObj['site_favicon'] || '',
      supportEmail: settingsObj['support_email'] || '',
      supportPhone: settingsObj['support_phone'] || '',
    },
    seoConfig: {
      metaTitle: settingsObj['seo_meta_title'] || '',
      metaDescription: settingsObj['seo_meta_description'] || '',
      metaKeywords: settingsObj['seo_meta_keywords'] || '',
      googleAnalyticsId: settingsObj['seo_google_analytics'] || '',
      facebookPixelId: settingsObj['seo_facebook_pixel'] || '',
    },
    maintenanceMode: settingsObj['maintenance_mode'] === 'true',
  }
}

// Helper para converter settings do frontend para o banco
function frontendSettingsToDb(settings: SystemSettings): any[] {
  return [
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
  ]
}

// GET - Buscar configurações
export async function GET() {
  const session = await getServerSession(authOptions)


  try {
    // Buscar todas as configurações relevantes
    const result = await query(`
      SELECT key, value 
      FROM system_settings 
      WHERE key IN (
        'site_name', 'site_url', 'site_description', 'site_logo', 'site_favicon',
        'support_email', 'support_phone', 'seo_meta_title', 'seo_meta_description',
        'seo_meta_keywords', 'seo_google_analytics', 'seo_facebook_pixel',
      )
    `)

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Configurações não encontradas' },
        { status: 404 }
      )
    }

    const settings = dbSettingsToFrontend(result.rows)

    return NextResponse.json({
      success: true,
      data: settings,
    })

  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar configurações' },
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

    // Validar os dados recebidos
    if (!settings || !settings.siteConfig || !settings.seoConfig) {
      return NextResponse.json(
        { error: 'Dados de configuração inválidos' },
        { status: 400 }
      )
    }

    // Converter para formato do banco
    const dbSettings = frontendSettingsToDb(settings)

    // Atualizar cada configuração no banco
    for (const setting of dbSettings) {
      await query(`
        INSERT INTO system_settings (key, value)
        VALUES ($1, $2)
        ON CONFLICT (key) 
        DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
      `, [setting.key, setting.value])
    }

    // Registrar no log de auditoria
    await query(`
      INSERT INTO admin_audit_logs (admin_id, action, resource_type, new_values)
      VALUES ($1, $2, $3, $4)
    `, [
      "de91b299-18c9-4cc3-ad8e-ffc7d3f637be",
      'update',
      'system_settings',
      JSON.stringify({
        updated_by: "admin",
        updated_at: new Date().toISOString(),
        settings: dbSettings,
      }),
    ])

    return NextResponse.json({
      success: true,
      message: 'Configurações atualizadas com sucesso',
    })

  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar configurações' },
      { status: 500 }
    )
  }
}