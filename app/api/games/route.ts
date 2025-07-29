import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { query } from '@/lib/db'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { action, prizeValue, transactionId } = await request.json()

  if (!['play', 'win', 'lost'].includes(action)) {
    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  }

  try {
    const userResult = await query(
      `SELECT balance FROM users WHERE id = $1`,
      [session.user.id]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const currentBalance = parseFloat(userResult.rows[0].balance)

    // WIN
    if (action === 'win') {
      if (!transactionId) {
        return NextResponse.json({ error: 'transactionId é obrigatório para ação win' }, { status: 400 })
      }

      const parsedPrizeValue = parseFloat(
        prizeValue.replace(/[^\d,]/g, '').replace(',', '.')
      )

      if (isNaN(parsedPrizeValue)) {
        return NextResponse.json({ error: 'Valor de prêmio inválido' }, { status: 400 })
      }

      // Verifica se a transação pertence ao usuário
      const txCheck = await query(
        `SELECT id FROM payment_transactions WHERE id = $1 AND user_id = $2`,
        [transactionId, session.user.id]
      )

      // Atualiza o saldo
      await query(
        `UPDATE users SET balance = balance + $1 WHERE id = $2`,
        [parsedPrizeValue, session.user.id]
      )

      // Atualiza o metadata com result = win
      const update = await query(
        `UPDATE payment_transactions
         SET metadata = jsonb_set(COALESCE(metadata, '{}'), '{result}', to_jsonb('win'::text), true)
         WHERE id = $1
         RETURNING id, metadata`,
        [transactionId]
      )

      // Retorna novo saldo
      const newBalanceResult = await query(
        `SELECT balance FROM users WHERE id = $1`,
        [session.user.id]
      )

      return NextResponse.json({ 
        success: true,
        updatedTransactionId: update.rows[0].id,
        metadata: update.rows[0].metadata,
        newBalance: parseFloat(newBalanceResult.rows[0].balance)
      })
    }

    // LOST
    if (action === 'lost') {
      if (!transactionId) {
        return NextResponse.json({ error: 'transactionId é obrigatório para ação lost' }, { status: 400 })
      }

      const txCheck = await query(
        `SELECT id FROM payment_transactions WHERE id = $1 AND user_id = $2`,
        [transactionId, session.user.id]
      )

      if (txCheck.rowCount === 0) {
        return NextResponse.json({ error: 'Transação não encontrada ou não pertence ao usuário' }, { status: 404 })
      }

      const update = await query(
        `UPDATE payment_transactions
         SET metadata = jsonb_set(COALESCE(metadata, '{}'), '{result}', to_jsonb('lost'::text), true)
         WHERE id = $1
         RETURNING id, metadata`,
        [transactionId]
      )

      return NextResponse.json({
        success: true,
        updatedTransactionId: update.rows[0].id,
        metadata: update.rows[0].metadata
      })
    }

    return NextResponse.json({ error: 'Ação não reconhecida' }, { status: 400 })
  } catch (error) {
    console.error('Erro ao processar ação:', error)
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
  }
}
