// app/api/admin/users/[id]/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { query } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  try {
    const result = await query(`
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
        referral_code,
        referred_by,
        total_earnings,
        referral_earnings,
        total_bets,
        won_bets,
        lost_bets,
        created_at,
        updated_at,
        last_login_at,
        last_activity_at,
        CASE
          WHEN is_active = false THEN 'inactive'
          WHEN is_verified = false THEN 'pending'
          ELSE 'active'
        END as status
      FROM users
      WHERE id = $1
    `, [params.id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const user = result.rows[0]
    const formattedUser = {
      ...user,
      balance: parseFloat(user.balance),
      bonus_balance: parseFloat(user.bonus_balance),
      total_earnings: parseFloat(user.total_earnings),
      referral_earnings: parseFloat(user.referral_earnings),
      created_at: new Date(user.created_at).toISOString(),
      updated_at: new Date(user.updated_at).toISOString(),
      last_login_at: user.last_login_at ? new Date(user.last_login_at).toISOString() : null,
      last_activity_at: user.last_activity_at ? new Date(user.last_activity_at).toISOString() : null,
      referred_by: user.referred_by || null
    }

    return NextResponse.json({
      success: true,
      data: formattedUser
    })

  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar usuário' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  
  try {
    const body = await request.json()
    const { name, email, phone, is_verified, is_active, balance, bonus_balance } = body

    // Validação básica
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Nome e email são obrigatórios' },
        { status: 400 }
      )
    }

    const result = await query(`
      UPDATE users
      SET 
        name = $1,
        email = $2,
        phone = $3,
        is_verified = $4,
        is_active = $5,
        balance = $6,
        bonus_balance = $7,
        updated_at = NOW()
      WHERE id = $8
      RETURNING *
    `, [name, email, phone || null, is_verified, is_active, balance, bonus_balance, params.id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const updatedUser = result.rows[0]
    const formattedUser = {
      ...updatedUser,
      balance: parseFloat(updatedUser.balance),
      bonus_balance: parseFloat(updatedUser.bonus_balance),
      created_at: new Date(updatedUser.created_at).toISOString(),
      updated_at: new Date(updatedUser.updated_at).toISOString()
    }

    return NextResponse.json({
      success: true,
      data: formattedUser
    })

  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar usuário' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  
  try {
    // Verifica se o usuário existe
    const checkResult = await query('SELECT id FROM users WHERE id = $1', [params.id])
    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Desativa o usuário em vez de deletar (soft delete)
    await query(`
      UPDATE users
      SET is_active = false, updated_at = NOW()
      WHERE id = $1
    `, [params.id])

    return NextResponse.json({
      success: true,
      message: 'Usuário desativado com sucesso'
    })

  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Erro ao desativar usuário' },
      { status: 500 }
    )
  }
}