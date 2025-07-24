// app/api/withdrawals/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { query } from '@/lib/db'
import { z } from 'zod'

const withdrawalSchema = z.object({
  amount: z.number().min(10, 'O valor mínimo para saque é R$ 10,00').max(5000, 'O valor máximo para saque é R$ 5.000,00'),
  pixKey: z.string().min(5, 'Chave PIX inválida'),
  pixKeyType: z.enum(['cpf', 'email', 'phone', 'random']),
})

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    // Verificar saldo do usuário
    const balanceResult = await query(
      'SELECT balance FROM users WHERE id = $1',
      [session.user.id]
    )
    
    if (balanceResult.rows.length === 0) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const userBalance = parseFloat(balanceResult.rows[0].balance)
    
    // Validar dados da requisição
    const body = await request.json()
    const validation = withdrawalSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { amount, pixKey, pixKeyType } = validation.data

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
        `Solicitação de saque via PIX (${pixKeyType})`,
        JSON.stringify({
          pixKey,
          pixKeyType,
          requestedAt: new Date().toISOString()
        })
      ]
    )

    // Atualizar saldo do usuário (deduzir o valor do saque)
    await query(
      'UPDATE users SET balance = balance - $1 WHERE id = $2',
      [amount, session.user.id]
    )

    return NextResponse.json({
      success: true,
      withdrawal: {
        ...result.rows[0],
        amount: parseFloat(result.rows[0].amount)
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