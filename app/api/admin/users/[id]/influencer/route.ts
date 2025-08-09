// app/api/admin/users/[id]/influencer/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { query } from '@/lib/db'

export async function PATCH(
  request: Request,
  context: { params: { id: string } }
) {
  const params = context.params
  const session = await getServerSession(authOptions)
  
  try {
    // Verifica se o usuário existe
    const checkResult = await query('SELECT id FROM users WHERE id = $1', [params.id])
    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Transforma em influencer
    await query(`
      UPDATE users
      SET 
        influencer = true, 
        updated_at = NOW()
      WHERE id = $1
      RETURNING id, name, email, influencer
    `, [params.id])

    return NextResponse.json({
      success: true,
      message: 'Usuário transformado em influencer com sucesso'
    })

  } catch (error: any) {
    console.error('Error making influencer:', error.message)
    return NextResponse.json(
      { 
        error: 'Erro ao transformar em influencer',
        details: error.message 
      },
      { status: 500 }
    )
  }
}