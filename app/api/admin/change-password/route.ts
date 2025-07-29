import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import bcrypt from 'bcrypt'

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json()
    const { currentPassword, newPassword } = body

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Senha atual e nova senha são obrigatórias.' },
        { status: 400 }
      )
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'A nova senha deve ter pelo menos 8 caracteres.' },
        { status: 400 }
      )
    }

    // Fetch the user with fixed id = 1
    const result = await query(
      'SELECT password_hash FROM admin_users WHERE id = $1',
      ["de91b299-18c9-4cc3-ad8e-ffc7d3f637be"]
    )

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado.' },
        { status: 404 }
      )
    }

    const user = result.rows[0]

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash)
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Senha atual incorreta.' },
        { status: 401 }
      )
    }

    // Hash new password
    const saltRounds = 12
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds)

    // Update password in the database
    await query(
      'UPDATE admin_users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, "de91b299-18c9-4cc3-ad8e-ffc7d3f637be"]
    )

    return NextResponse.json({
      success: true,
      message: 'Senha alterada com sucesso.',
    })

  } catch (error: any) {
    console.error('Error changing password:', error.message)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao alterar a senha.',
        details: error.message 
      },
      { status: 500 }
    )
  }
}