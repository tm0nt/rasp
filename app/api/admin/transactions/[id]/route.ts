// app/api/admin/transactions/[id]/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { query } from '@/lib/db'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  


  try {
    const body = await request.json()
    const { status, admin_note } = body

    if (!['completed', 'processing', 'failed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido' },
        { status: 400 }
      )
    }

    // Atualiza a transação
    const result = await query(`
      UPDATE payment_transactions
      SET 
        status = $1,
        metadata = jsonb_set(
          COALESCE(metadata, '{}'::jsonb), 
          '{admin_note}', 
          $2::jsonb,
          true
        ),
        processed_at = CASE 
          WHEN $1 = 'completed' THEN NOW()
          ELSE processed_at
        END
      WHERE id = $3
      RETURNING *
    `, [status, JSON.stringify(admin_note || null), params.id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 })
    }

    // Se for um saque aprovado, atualiza o saldo do usuário
    if (status === 'completed' && result.rows[0].type === 'withdrawal') {
      await query(`
        UPDATE users
        SET balance = balance - $1
        WHERE id = $2
      `, [result.rows[0].amount, result.rows[0].user_id])
    }

    return NextResponse.json({
      success: true,
      data: {
        ...result.rows[0],
        amount: parseFloat(result.rows[0].amount)
      }
    })

  } catch (error) {
    console.error('Error updating transaction:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar transação' },
      { status: 500 }
    )
  }
}