// app/api/admin/users/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { query } from '@/lib/db'

export interface IUser {
  id: string
  name: string
  email: string
  phone: string | null
  cpf: string | null
  balance: number
  bonus_balance: number
  is_verified: boolean
  is_active: boolean
  created_at: string
  last_activity_at: string | null
  status: 'active' | 'inactive' | 'pending'
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  
  const { searchParams } = new URL(request.url)
  const searchTerm = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  // Removido status, usado influencer
  const influencer = searchParams.get('influencer') || 'all' 

  try {
    let queryString = `
      SELECT 
        id,
        name,
        email,
        phone,
        cpf,
        balance,
        bonus_balance,
        is_verified,
        is_active,
        CASE
          WHEN is_active = false THEN 'inactive'
          WHEN is_verified = false THEN 'pending'
          ELSE 'active'
        END as status,
        created_at,
        last_activity_at,
        influencer
      FROM users
    `

    const params: any[] = []
    const whereClauses: string[] = []

    // Filtro de busca
    if (searchTerm) {
      whereClauses.push(`
        (name ILIKE $${params.length + 1} OR 
        email ILIKE $${params.length + 1} OR 
        phone ILIKE $${params.length + 1} OR 
        cpf ILIKE $${params.length + 1})
      `)
      params.push(`%${searchTerm}%`)
    }

    // Filtro influencer
    if (influencer !== 'all') {
      if (influencer === 'yes') {
        whereClauses.push(`influencer = true`)
      } else if (influencer === 'no') {
        whereClauses.push(`influencer = false`)
      }
    }

    if (whereClauses.length > 0) {
      queryString += ' WHERE ' + whereClauses.join(' AND ')
    }

    // Ordenação e paginação
    queryString += `
      ORDER BY created_at DESC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `
    params.push(limit, (page - 1) * limit)

    const result = await query(queryString, params)

    // Query para total de registros (sem limit e offset)
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM users
      ${whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : ''}
    `
    const countParams = params.slice(0, params.length - 2) // Remove limit e offset para count
    const countResult = await query(countQuery, countParams)

    const users: IUser[] = result.rows.map(row => ({
      ...row,
      balance: parseFloat(row.balance),
      bonus_balance: parseFloat(row.bonus_balance),
      created_at: new Date(row.created_at).toISOString(),
      last_activity_at: row.last_activity_at ? new Date(row.last_activity_at).toISOString() : null,
    }))

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].total, 10),
        totalPages: Math.ceil(countResult.rows[0].total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar usuários' },
      { status: 500 }
    )
  }
}
