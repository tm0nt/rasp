// app/api/admin/transactions/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { query } from '@/lib/db'

export interface ITransaction {
  id: string
  user_id: string
  user_name: string
  type: 'deposit' | 'withdrawal' | 'bet' | 'win' | 'bonus'
  amount: number
  status: 'pending' | 'completed' | 'processing' | 'failed' | 'cancelled'
  payment_method: string | null
  description: string
  reference: string
  created_at: string
  metadata: any
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  const { searchParams } = new URL(request.url)
  const searchTerm = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const type = searchParams.get('type') || 'all'
  const status = searchParams.get('status') || 'all'

  try {
    let queryString = `
      SELECT 
        pt.id,
        pt.user_id,
        u.name as user_name,
        pt.type,
        pt.amount,
        pt.status,
        pt.payment_method,
        pt.description,
        pt.metadata->>'external_id' as reference,
        pt.created_at,
        pt.metadata
      FROM payment_transactions pt
      JOIN users u ON pt.user_id = u.id
    `

    const params: any[] = []
    let whereClauses: string[] = []

    // Filtro de busca
    if (searchTerm) {
      whereClauses.push(`
        (u.name ILIKE $${params.length + 1} OR 
        u.email ILIKE $${params.length + 1} OR 
        pt.metadata->>'external_id' ILIKE $${params.length + 1})
      `)
      params.push(`%${searchTerm}%`)
    }

    // Filtro de tipo
    if (type !== 'all') {
      whereClauses.push(`pt.type = $${params.length + 1}`)
      params.push(type)
    }

    // Filtro de status
    if (status !== 'all') {
      whereClauses.push(`pt.status = $${params.length + 1}`)
      params.push(status)
    }

    // Adiciona WHERE se houver filtros
    if (whereClauses.length > 0) {
      queryString += ' WHERE ' + whereClauses.join(' AND ')
    }

    // Ordenação e paginação
    queryString += `
      ORDER BY pt.created_at DESC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `
    params.push(limit, (page - 1) * limit)

    // Query principal
    const result = await query(queryString, params)

    // Query para total de registros
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM payment_transactions pt
      JOIN users u ON pt.user_id = u.id
      ${whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : ''}
    `
    const countResult = await query(countQuery, params.slice(0, -2)) // Remove limit e offset

    const transactions: ITransaction[] = result.rows.map(row => ({
      ...row,
      amount: parseFloat(row.amount),
      created_at: new Date(row.created_at).toISOString()
    }))

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].total),
        totalPages: Math.ceil(countResult.rows[0].total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar transações' },
      { status: 500 }
    )
  }
}