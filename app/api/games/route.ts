import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { query } from '@/lib/db'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { action, prizeValue } = await request.json()

  if (!['play', 'win'].includes(action)) {
    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  }

  try {
    // Get current balance
    const userResult = await query(
      `SELECT balance FROM users WHERE id = $1`,
      [session.user.id]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const currentBalance = parseFloat(userResult.rows[0].balance)

    if (action === 'win') {
      // Parse Brazilian currency format (R$ 1.234,56 -> 1234.56)
      const parsedPrizeValue = parseFloat(
        prizeValue.replace(/[^\d,]/g, '').replace(',', '.')
      )

      if (isNaN(parsedPrizeValue)) {
        return NextResponse.json({ error: 'Valor de prêmio inválido' }, { status: 400 })
      }

      // Update balance
      await query(
        `UPDATE users SET balance = balance + $1 WHERE id = $2`,
        [parsedPrizeValue, session.user.id]
      )

      // Return new balance
      const newBalanceResult = await query(
        `SELECT balance FROM users WHERE id = $1`,
        [session.user.id]
      )

      return NextResponse.json({ 
        success: true, 
        newBalance: parseFloat(newBalanceResult.rows[0].balance)
      })
    }

    return NextResponse.json({ error: 'Ação não reconhecida' }, { status: 400 })
  } catch (error) {
    console.error('Erro ao processar vitória:', error)
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
  }
}