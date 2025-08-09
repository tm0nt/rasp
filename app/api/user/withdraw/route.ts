// app/api/withdrawals/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { query } from '@/lib/db'
import { z } from 'zod'

const withdrawalSchema = (minWithdrawal: number) => z.object({
  amount: z.number().min(minWithdrawal, `O valor mínimo para saque é R$ ${minWithdrawal.toFixed(2)}`).max(5000, 'O valor máximo para saque é R$ 5.000,00'),
  pixKey: z.string().min(5, 'Chave PIX inválida'),
  pixKeyType: z.enum(['cpf', 'email', 'phone', 'random']),
  withdrawType: z.enum(['balance', 'referral']),
  cpf: z.string().min(11, 'CPF inválido').max(14, 'CPF inválido'),
})

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    // Obter configurações mínimas
    const settingsResult = await query(`
      SELECT key, value 
      FROM system_settings 
      WHERE key IN ('min_spins_withdrawal', 'min_withdrawal_amount')
    `)
    
    const settings = settingsResult.rows.reduce((acc: Record<string, string>, row: any) => {
      acc[row.key] = row.value
      return acc
    }, {})

    const minSpins = parseInt(settings.min_spins_withdrawal || '10')
    const minWithdrawal = parseFloat(settings.min_withdrawal_amount || '10.00')

    // Verificar número de spins (bets)
    const betsResult = await query(`
      SELECT COUNT(*) as total_bets
      FROM payment_transactions
      WHERE user_id = $1 AND type = 'bet'
    `, [session.user.id])
    
    const totalBets = parseInt(betsResult.rows[0].total_bets || '0')
    
    if (totalBets < minSpins) {
      return NextResponse.json(
        { error: `Você precisa de pelo menos ${minSpins} giros para solicitar um saque. Você tem ${totalBets} giros.` },
        { status: 400 }
      )
    }

    // Validar dados da requisição com schema dinâmico
    const body = await request.json()
    const validation = withdrawalSchema(minWithdrawal).safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { amount, pixKey, pixKeyType, withdrawType, cpf } = validation.data
    const field = withdrawType === 'balance' ? 'balance' : 'referral_earnings'

    // Verificar saldo do usuário
    const balanceResult = await query(
      `SELECT ${field} FROM users WHERE id = $1`,
      [session.user.id]
    )
    
    if (balanceResult.rows.length === 0) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const userBalance = parseFloat(balanceResult.rows[0][field])
    
    // Verificar se o saldo é suficiente
    if (amount > userBalance) {
      return NextResponse.json(
        { error: 'Saldo insuficiente' },
        { status: 400 }
      )
    }

    // Criar transação de saque
    const result = await query(
      `INSERT INTO payment_transactions (
        user_id,
        type,
        amount,
        status,
        payment_method,
        description,
        metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        session.user.id,
        'withdrawal',
        amount,
        'pending',
        'pix',
        `Solicitação de saque via PIX (${pixKeyType}) de ${withdrawType}`,
        JSON.stringify({
          pixKey,
          pixKeyType,
          cpfHolder: cpf.replace(/\D/g, ''), // Armazena apenas números
          requestedAt: new Date().toISOString(),
          additionalInfo: {
            withdrawSource: withdrawType,
            userIp: request.headers.get('x-forwarded-for') || 'unknown'
          }
        })
      ]
    )

    // Atualizar saldo do usuário (deduzir o valor do saque)
    await query(
      `UPDATE users SET ${field} = ${field} - $1 WHERE id = $2`,
      [amount, session.user.id]
    )

    return NextResponse.json({
      success: true,
      withdrawal: {
        ...result.rows[0],
        amount: parseFloat(result.rows[0].amount),
        metadata: {
          ...result.rows[0].metadata,
          // Ocultamos parte do CPF por segurança na resposta
          cpfHolder: `${cpf.substring(0, 3)}.***.***-${cpf.substring(9)}`
        }
      }
    })

  } catch (error) {
    console.error('Erro ao processar saque:', error)
    return NextResponse.json(
      { error: 'Erro interno ao processar saque' },
      { status: 500 }
    )
  }
}