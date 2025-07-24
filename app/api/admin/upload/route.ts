// app/api/admin/upload/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { query } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import path from 'path'

// Configurações de upload
const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads')
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/x-icon']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

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
    if (!['logo', 'favicon'].includes(type)) {
      return NextResponse.json(
        { error: 'Tipo de upload inválido' },
        { status: 400 }
      )
    }

    // Ler o buffer do arquivo
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Gerar nome único para o arquivo
    const extension = path.extname(file.name)
    const filename = `${type}-${uuidv4()}${extension}`
    const filepath = path.join(UPLOAD_DIR, filename)
    
    // Salvar o arquivo
    await fs.promises.writeFile(filepath, buffer)

    // URL pública do arquivo
    const fileUrl = `/uploads/${filename}`

    // Atualizar no banco de dados
    const settingKey = type === 'logo' ? 'site_logo' : 'site_favicon'
    await query(`
      INSERT INTO system_settings (key, value)
      VALUES ($1, $2)
      ON CONFLICT (key) 
      DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `, [settingKey, fileUrl])

    // Registrar no log de auditoria
    await query(`
      INSERT INTO admin_audit_logs (admin_id, action, resource_type, new_values)
      VALUES ($1, $2, $3, $4)
    `, [
      "de91b299-18c9-4cc3-ad8e-ffc7d3f637be",
      'upload',
      type,
      JSON.stringify({
        filename,
        fileUrl,
        size: file.size,
        mimeType: file.type,
      }),
    ])

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