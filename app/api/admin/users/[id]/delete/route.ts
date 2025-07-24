// app/api/admin/users/[id]/delete/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { query } from '@/lib/db'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  

  try {
    // Verifica se o usuário existe
    const checkResult = await query('SELECT id FROM users WHERE id = $1', [params.id])
    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Inicia uma transação
    await query('BEGIN')

    // Primeiro deleta todas as dependências do usuário
    await query('DELETE FROM payment_transactions WHERE user_id = $1', [params.id])
    await query('DELETE FROM user_bets WHERE user_id = $1', [params.id])
    await query('DELETE FROM bonus_transactions WHERE user_id = $1', [params.id])
    await query('DELETE FROM referral_bonuses WHERE referrer_id = $1 OR referred_id = $1', [params.id])
    await query('DELETE FROM refresh_tokens WHERE user_id = $1', [params.id])
    await query('DELETE FROM user_notifications WHERE user_id = $1', [params.id])
    await query('DELETE FROM user_analytics WHERE user_id = $1', [params.id])

    // Atualiza referências de usuários indicados
    await query('UPDATE users SET referred_by = NULL WHERE referred_by = $1', [params.id])

    // Depois remove o usuário
    await query('DELETE FROM users WHERE id = $1', [params.id])

    // Confirma a transação
    await query('COMMIT')

    return NextResponse.json({
      success: true,
      message: 'Usuário excluído permanentemente com sucesso'
    })

  } catch (error: any) {
    // Reverte a transação em caso de erro
    await query('ROLLBACK')
    console.error('Error deleting user:', error.message)
    
    return NextResponse.json(
      { 
        error: 'Erro ao excluir usuário',
        details: error.message 
      },
      { status: 500 }
    )
  }
}