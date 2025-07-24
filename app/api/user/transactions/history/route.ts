// app/api/transactions/overview/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { query } from '@/lib/db'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')
  const status = searchParams.get('status') // optional filter

  try {
    let queryString = `
      SELECT 
        id,
        type,
        amount,
        status,
        payment_method,
        description,
        metadata,
        processed_at,
        created_at
      FROM payment_transactions
      WHERE user_id = $1
    `
    const params: any[] = [session.user.id]

    // Add status filter if provided
    if (status) {
      queryString += ` AND status = $${params.length + 1}`
      params.push(status)
    }

    queryString += `
      ORDER BY created_at DESC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `
    params.push(limit, offset)

    // Get transactions
    const result = await query(queryString, params)

    // Get counts for each type
    const counts = await query(
      `SELECT 
        type,
        COUNT(*) as count
      FROM payment_transactions
      WHERE user_id = $1
      GROUP BY type`,
      [session.user.id]
    )

    // Organize transactions
    const transactions = {
      deposits: [] as any[],
      withdrawals: [] as any[],
      others: [] as any[],
      counts: {
        deposits: 0,
        withdrawals: 0,
        others: 0
      }
    }

    // Process counts
    counts.rows.forEach(row => {
      switch (row.type) {
        case 'deposit':
          transactions.counts.deposits = parseInt(row.count)
          break
        case 'withdrawal':
          transactions.counts.withdrawals = parseInt(row.count)
          break
        default:
          transactions.counts.others += parseInt(row.count)
      }
    })

    // Categorize transactions
    result.rows.forEach(transaction => {
      switch (transaction.type) {
        case 'deposit':
          transactions.deposits.push({
            ...transaction,
            amount: parseFloat(transaction.amount)
          })
          break
        case 'withdrawal':
          transactions.withdrawals.push({
            ...transaction,
            amount: parseFloat(transaction.amount)
          })
          break
        default:
          transactions.others.push({
            ...transaction,
            amount: parseFloat(transaction.amount)
          })
      }
    })

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        limit,
        offset,
        total: transactions.counts.deposits + transactions.counts.withdrawals + transactions.counts.others
      }
    })

  } catch (error) {
    console.error('Error fetching transactions overview:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar transações' },
      { status: 500 }
    )
  }
}