// app/api/admin/users/recent/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { query } from '@/lib/db'

export interface IUser {
  id: string
  name: string
  email: string
  phone: string | null
  balance: number
  isVerified: boolean
  createdAt: string
  lastActivityAt: string | null
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  


  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '5')

  try {
    // Obter usuários recentes
    const result = await query(`
      SELECT 
        id,
        name,
        email,
        phone,
        balance,
        is_verified as "isVerified",
        created_at as "createdAt",
        last_activity_at as "lastActivityAt"
      FROM users
      ORDER BY created_at DESC
      LIMIT $1
    `, [limit])

    const users: IUser[] = result.rows.map(row => ({
      ...row,
      balance: parseFloat(row.balance),
      createdAt: new Date(row.createdAt).toISOString(),
      lastActivityAt: row.lastActivityAt ? new Date(row.lastActivityAt).toISOString() : null
    }))

    return NextResponse.json({
      success: true,
      users
    })

  } catch (error) {
    console.error('Error fetching recent users:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar usuários recentes' },
      { status: 500 }
    )
  }
}