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

    // Find the transaction in our database, regardless of status
    const transactionResult = await query(
      `SELECT id, user_id, amount, status 
       FROM payment_transactions 
       WHERE external_id = $1`,
      [transactionData.external_id]
    )

    if (transactionResult.rows.length === 0) {
      console.log(`Transação não encontrada: ${transactionData.external_id}`)
      return NextResponse.json(
        { success: true, message: 'Transação não encontrada, ignorando' }
      )
    }

    const transaction = transactionResult.rows[0]

    if (transaction.status === 'completed') {
      return NextResponse.json(
        { success: true, message: 'Transação já processada' }
      )
    }

    if (transaction.status !== 'pending') {
      console.log(`Transação em status inválido: ${transaction.status}`)
      return NextResponse.json(
        { success: true, message: 'Status da transação inválido, ignorando' }
      )
    }

    const amount = parseFloat(transaction.amount)

    // Start a database transaction
    await query('BEGIN')

    try {
      // 1. Update transaction status
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

      // 2. Update user balance
      await query(
        `UPDATE users 
         SET 
           balance = balance + $1,
           updated_at = NOW()
         WHERE id = $2`,
        [amount, transaction.user_id]
      )

      // 3. Check if user was referred by someone and process affiliate bonus
      const userResult = await query(
        `SELECT referred_by FROM users WHERE id = $1`,
        [transaction.user_id]
      )

      if (userResult.rows.length > 0 && userResult.rows[0].referred_by) {
        const referrerId = userResult.rows[0].referred_by

        // Get affiliate program settings
        const settingsResult = await query(
          `SELECT 
            (SELECT value FROM system_settings WHERE key = 'affiliate_min_deposit') as min_deposit,
            (SELECT value FROM system_settings WHERE key = 'affiliate_cpa_value') as cpa_value`
        )

        const minDeposit = parseFloat(settingsResult.rows[0].min_deposit || '0')
        const cpaValue = parseFloat(settingsResult.rows[0].cpa_value || '0')

        // Check if deposit meets minimum requirement
        if (amount >= minDeposit && cpaValue > 0) {
          // Create referral bonus record
          await query(
            `INSERT INTO referral_bonuses (
              referrer_id, 
              referred_id, 
              bonus_amount, 
              status
            ) VALUES ($1, $2, $3, 'pending')`,
            [referrerId, transaction.user_id, cpaValue]
          )

          // Update referrer's earnings
          await query(
            `UPDATE users 
             SET 
               referral_earnings = referral_earnings + $1,
               updated_at = NOW()
             WHERE id = $2`,
            [cpaValue, referrerId]
          )

          console.log(`Bônus de afiliado de R$${cpaValue} creditado para ${referrerId}`)
        }
      }

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