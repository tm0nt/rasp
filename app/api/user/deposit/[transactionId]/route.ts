// app/api/user/deposit/[transactionId]/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { query } from '@/lib/db'

export async function GET(
  request: Request, 
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    // Await the session promise
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Await params to get transactionId
    const { transactionId } = await params

    try {
      const result = await query(
        `SELECT status 
         FROM payment_transactions 
         WHERE external_id = $1 AND user_id = $2 AND type = 'deposit'`,
        [transactionId, session.user.id]
      )

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Transação não encontrada' }, 
          { status: 404 }
        )
      }

      const isPaid = result.rows[0].status === 'completed'

      return NextResponse.json({
        success: true,
        paid: isPaid
      })

    } catch (error) {
      console.error('Error checking deposit status:', error)
      return NextResponse.json(
        { error: 'Erro ao verificar status da transação' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error in route handler:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}