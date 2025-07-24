// app/api/webhook/pix/route.ts
import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const transactionData = payload.requestBody

    // Validate required fields
    if (!transactionData || !transactionData.transactionId || !transactionData.external_id) {
      return NextResponse.json(
        { error: 'Dados da transação inválidos' },
        { status: 400 }
      )
    }

    // Only process paid transactions
    if (transactionData.status !== 'PAID') {
      return NextResponse.json(
        { success: true, message: 'Transação não paga, ignorando' }
      )
    }

    // Find the transaction in our database
    const transactionResult = await query(
      `SELECT id, user_id, amount 
       FROM payment_transactions 
       WHERE external_id = $1 AND status = 'pending'`,
      [transactionData.external_id]
    )

    if (transactionResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Transação não encontrada ou já processada' },
        { status: 404 }
      )
    }

    const transaction = transactionResult.rows[0]
    const amount = parseFloat(transaction.amount)

    // Start a database transaction
    await query('BEGIN')

    try {
      // Update transaction status
      await query(
        `UPDATE payment_transactions 
         SET 
           status = 'completed',
           processed_at = NOW(),
           metadata = jsonb_set(
             COALESCE(metadata, '{}'::jsonb),
             '{pixData}',
             $1::jsonb
           )
         WHERE id = $2`,
        [
          JSON.stringify({
            transactionId: transactionData.transactionId,
            dateApproval: transactionData.dateApproval,
            creditParty: transactionData.creditParty,
            debitParty: transactionData.debitParty
          }),
          transaction.id
        ]
      )

      // Update user balance
      await query(
        `UPDATE users 
         SET 
           balance = balance + $1,
           updated_at = NOW()
         WHERE id = $2`,
        [amount, transaction.user_id]
      )

      // Commit the transaction
      await query('COMMIT')

      console.log(`Depósito de R$${amount} processado para usuário ${transaction.user_id}`)

      return NextResponse.json(
        { success: true, message: 'Saldo atualizado com sucesso' }
      )

    } catch (error) {
      // Rollback in case of error
      await query('ROLLBACK')
      throw error
    }

  } catch (error) {
    console.error('Erro no webhook PIX:', error)
    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 500 }
    )
  }
}