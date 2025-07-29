import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { query } from '@/lib/db'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    // Get basic user info
    const userResult = await query(
      `SELECT id, name, email, phone, balance, referral_code, total_earnings, referral_earnings, 
              bonus_balance, is_verified, created_at, last_login_at, total_bets, won_bets, lost_bets,
              referred_by
       FROM users 
       WHERE id = $1 AND is_active = true`,
      [session.user.id]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Total referrals (sem inflar)
    const totalReferralsResult = await query(
      `SELECT COUNT(*) AS total FROM users WHERE referred_by = $1`,
      [session.user.id]
    )

    // Active referrals (com transação 'completed' única por usuário)
    const activeReferralsResult = await query(
      `SELECT COUNT(DISTINCT u.id) AS total
       FROM users u
       JOIN payment_transactions pt ON u.id = pt.user_id
       WHERE u.referred_by = $1 AND pt.status = 'completed'`,
      [session.user.id]
    )

    // Total volume de afiliados
const totalVolumeResult = await query(
  `SELECT COALESCE(SUM(pt.amount), 0) AS total
   FROM users u
   JOIN payment_transactions pt ON u.id = pt.user_id
   WHERE u.referred_by = $1
     AND pt.status = 'completed'
     AND pt.type = 'deposit'`,
  [session.user.id]
)


    // Pending referral bonuses
    const pendingBonuses = await query(
      `SELECT COUNT(*) as count, COALESCE(SUM(bonus_amount), 0) as amount
       FROM referral_bonuses
       WHERE referrer_id = $1 AND status = 'pending'`,
      [session.user.id]
    )

    // Affiliate settings
    const settingsResult = await query(
      `SELECT 
        (SELECT value FROM system_settings WHERE key = 'affiliate_min_deposit') as min_deposit,
        (SELECT value FROM system_settings WHERE key = 'affiliate_cpa_value') as cpa_value,
        (SELECT value FROM system_settings WHERE key = 'referral_bonus') as referral_bonus`
    )

    const affiliateSettings = {
      min_deposit: parseFloat(settingsResult.rows[0]?.min_deposit || '0'),
      cpa_value: parseFloat(settingsResult.rows[0]?.cpa_value || '0'),
      referral_bonus: parseFloat(settingsResult.rows[0]?.referral_bonus || '0')
    }

    // Referrer info (if exists)
    let referrerInfo = null
    if (userResult.rows[0].referred_by) {
      const referrerResult = await query(
        `SELECT name, email, phone FROM users WHERE id = $1`,
        [userResult.rows[0].referred_by]
      )
      if (referrerResult.rows.length > 0) {
        referrerInfo = {
          name: referrerResult.rows[0].name,
          email: referrerResult.rows[0].email,
          phone: referrerResult.rows[0].phone
        }
      }
    }

    const user = {
      id: userResult.rows[0].id,
      name: userResult.rows[0].name,
      email: userResult.rows[0].email,
      phone: userResult.rows[0].phone,
      balance: parseFloat(userResult.rows[0].balance),
      avatar: userResult.rows[0].avatar || undefined,
      referralCode: userResult.rows[0].referral_code,
      totalEarnings: parseFloat(userResult.rows[0].total_earnings),
      referralEarnings: parseFloat(userResult.rows[0].referral_earnings),
      bonusBalance: parseFloat(userResult.rows[0].bonus_balance),
      isVerified: userResult.rows[0].is_verified,
      createdAt: userResult.rows[0].created_at.toISOString(),
      lastLoginAt: userResult.rows[0].last_login_at?.toISOString() || null,
      totalBets: parseInt(userResult.rows[0].total_bets),
      wonBets: parseInt(userResult.rows[0].won_bets),
      lostBets: parseInt(userResult.rows[0].lost_bets),
      referredBy: referrerInfo,
      affiliateStats: {
        totalReferrals: parseInt(totalReferralsResult.rows[0].total),
        activeReferrals: parseInt(activeReferralsResult.rows[0].total),
        totalVolume: parseFloat(totalVolumeResult.rows[0].total),
        pendingBonuses: {
          count: parseInt(pendingBonuses.rows[0].count),
          amount: parseFloat(pendingBonuses.rows[0].amount)
        }
      },
      affiliateSettings
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json({ error: 'Erro ao carregar perfil' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { updates } = await request.json()

  try {
    const allowedFields = ['name', 'email', 'phone', 'avatar']
    const updateFields = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ')

    if (!updateFields) {
      return NextResponse.json({ error: 'Nenhum campo válido para atualizar' }, { status: 400 })
    }

    const result = await query(
      `UPDATE users SET ${updateFields}, updated_at = NOW()
       WHERE id = $1
       RETURNING id, name, email, phone, avatar`,
      [
        session.user.id,
        ...Object.keys(updates)
          .filter(key => allowedFields.includes(key))
          .map(key => updates[key])
      ]
    )

    return NextResponse.json({ success: true, user: result.rows[0] })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
  }
}
