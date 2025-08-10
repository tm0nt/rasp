// app/api/admin/upload/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { query } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

// Configurações de upload
const UPLOAD_DIR = path.join(process.cwd(), 'public/images')
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/x-icon']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

const allowedTypes = ['logo', 'favicon', 'banner', 'mobile-login-banner', 'mobile-register-banner', 'modal-promo-banner'] as const;
type AllowedType = typeof allowedTypes[number];

const settingKeys: Record<AllowedType, string> = {
  'logo': 'site_logo',
  'favicon': 'site_favicon',
  'banner': 'site_banner',
  'mobile-login-banner': 'site_mobile_login_banner',
  'mobile-register-banner': 'site_mobile_register_banner',
  'modal-promo-banner': 'site_modal_promo_banner',
};

// Certifique-se que o diretório de upload existe
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = formData.get('type') as string | null

    if (!file || !type) {
      return NextResponse.json(
        { error: 'Arquivo e tipo são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar tipo de arquivo permitido
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido' },
        { status: 400 }
      )
    }

    // Verificar tamanho do arquivo
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Arquivo muito grande (máximo 5MB)' },
        { status: 400 }
      )
    }

    // Verificar tipo de upload permitido
    if (!allowedTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Tipo de upload inválido' },
        { status: 400 }
      )
    }

    // Ler o buffer do arquivo
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Determinar extensão e se é ICO
    let extension = '.png'
    let isIco = false
    if (type === 'favicon' && file.type === 'image/x-icon') {
      extension = '.ico'
      isIco = true
    }
    
    // Nome fixo para o arquivo
    const filename = `${type}${extension}`
    const filepath = path.join(UPLOAD_DIR, filename)
    
    // Salvar o arquivo
    if (isIco) {
      fs.writeFileSync(filepath, buffer)
    } else {
      await sharp(buffer).png().toFile(filepath)
    }

    // URL pública do arquivo
    const fileUrl = `/images/${filename}`

    // Atualizar no banco de dados
    const settingKey = settingKeys[type];
    await query(`
      INSERT INTO system_settings (key, value)
      VALUES ($1, $2)
      ON CONFLICT (key) 
      DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `, [settingKey, fileUrl])

    return NextResponse.json({
      success: true,
      fileUrl,
      message: 'Upload realizado com sucesso',
    })

  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Erro ao processar upload' },
      { status: 500 }
    )
  }
}