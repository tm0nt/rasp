// app/api/admin/users/[id]/deactivate/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { query } from '@/lib/db'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json(
      { error: 'Não autorizado' },
      { status: 401 }
    )
  }

  try {
    // Verifica se o usuário existe
    const checkResult = await query('SELECT id FROM users WHERE id = $1', [params.id])
    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Desativa o usuário (soft delete)
    await query(`
      UPDATE users
      SET 
        is_active = false, 
        updated_at = NOW(),
        deactivated_at = NOW()
      WHERE id = $1
      RETURNING id, name, email, is_active
    `, [params.id])

    return NextResponse.json({
      success: true,
      message: 'Usuário desativado com sucesso'
    })

  } catch (error: any) {
    console.error('Error deactivating user:', error.message)
    return NextResponse.json(
      { 
        error: 'Erro ao desativar usuário',
        details: error.message 
      },
      { status: 500 }
    )
  }
}