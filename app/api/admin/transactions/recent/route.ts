// app/api/admin/transactions/recent/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { query } from '@/lib/db'

export interface ITransaction {
  id: string
  userId: string
  userName: string
  type: string
  amount: number
  status: string
  payment_method: string | null
  description: string
  created_at: string
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  


  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '5')

  try {
    // Obter transações recentes com informações do usuário
    const result = await query(`
      SELECT 
        pt.id,
        pt.user_id as "userId",
        u.name as "userName",
        pt.type,
        pt.amount,
        pt.status,
        pt.payment_method,
        pt.description,
        pt.created_at
      FROM payment_transactions pt
      JOIN users u ON pt.user_id = u.id
      ORDER BY pt.created_at DESC
      LIMIT $1
    `, [limit])

    const transactions: ITransaction[] = result.rows.map(row => ({
      ...row,
      amount: parseFloat(row.amount),
      created_at: new Date(row.created_at).toISOString()
    }))

    return NextResponse.json({
      success: true,
      transactions
    })

  } catch (error) {
    console.error('Error fetching recent transactions:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar transações recentes' },
      { status: 500 }
    )
  }
}