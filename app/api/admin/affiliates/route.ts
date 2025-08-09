import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { query } from '@/lib/db'

// Tipos para afiliados
export interface Affiliate {
  id: string
  name: string
  email: string
  referrals: number
  totalEarned: number
  pendingEarned: number
  joinDate: string
  status: string
}

// Tipos para estatísticas
interface AffiliateStats {
  totalAffiliates: number
  totalReferrals: number
  totalEarned: number
  totalPending: number
}

// Tipos para configurações
interface AffiliateSettings {
  minDeposit: string
  cpaValue: string
}

// GET - Listar afiliados e estatísticas ou detalhes de um afiliado
export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const affiliateId = searchParams.get('affiliateId')

  try {
    if (affiliateId) {
      // Obter estatísticas detalhadas para um afiliado específico
      const detailedQuery = `
        SELECT 
          (SELECT COUNT(*) FROM users r WHERE r.referred_by = $1 AND DATE(r.created_at) = CURRENT_DATE) as referrals_today,
          (SELECT COALESCE(SUM(pt.amount), 0) FROM payment_transactions pt WHERE pt.user_id IN (SELECT id FROM users WHERE referred_by = $1) AND pt.type = 'deposit' AND DATE(pt.created_at) = CURRENT_DATE AND pt.status = 'completed') as deposits_today,
          (SELECT COALESCE(SUM(pt.amount), 0) FROM payment_transactions pt WHERE pt.user_id IN (SELECT id FROM users WHERE referred_by = $1) AND pt.type = 'deposit' AND pt.status = 'completed') as total_deposits,
          (SELECT COALESCE(SUM(pt.amount), 0) FROM payment_transactions pt WHERE pt.user_id IN (SELECT id FROM users WHERE referred_by = $1) AND pt.type = 'deposit' AND pt.status = 'pending') as pending_deposits,
          (SELECT COALESCE(SUM(bonus_amount), 0) FROM referral_bonuses WHERE referrer_id = $1) as earnings,
          (SELECT COALESCE(SUM(amount), 0) FROM payment_transactions WHERE user_id = $1 AND type = 'withdrawal') as withdrawals
      `
      const detailedResult = await query(detailedQuery, [affiliateId])

      return NextResponse.json({
        success: true,
        data: {
          detailedStats: {
            referralsToday: parseInt(detailedResult.rows[0].referrals_today),
            depositsToday: parseFloat(detailedResult.rows[0].deposits_today),
            totalDeposits: parseFloat(detailedResult.rows[0].total_deposits),
            pendingDeposits: parseFloat(detailedResult.rows[0].pending_deposits),
            earnings: parseFloat(detailedResult.rows[0].earnings),
            withdrawals: parseFloat(detailedResult.rows[0].withdrawals),
          }
        }
      })
    } else {
      // Obter lista de afiliados
      const affiliatesQuery = `
        SELECT 
          u.id,
          u.name,
          u.email,
          (
            SELECT COUNT(DISTINCT r.id)
            FROM users r
            JOIN payment_transactions pt ON pt.user_id = r.id
            WHERE r.referred_by = u.id
              AND pt.type = 'deposit'
              AND pt.status = 'completed'
          ) AS referrals,
          (
            SELECT COALESCE(SUM(bonus_amount), 0)
            FROM referral_bonuses
            WHERE referrer_id = u.id AND status = 'paid'
          ) AS total_earned,
          (
            SELECT COALESCE(SUM(bonus_amount), 0)
            FROM referral_bonuses
            WHERE referrer_id = u.id AND status = 'pending'
          ) AS pending_earned,
          (
            SELECT COALESCE(SUM(pt.amount), 0)
            FROM users r
            JOIN payment_transactions pt ON pt.user_id = r.id
            WHERE r.referred_by = u.id
              AND pt.type = 'deposit'
              AND pt.status = 'completed'
          ) AS total_deposited_by_referrals,
          u.created_at AS join_date,
          CASE 
            WHEN u.is_active = false THEN 'Inativo'
            ELSE 'Ativo'
          END AS status
        FROM users u
        WHERE EXISTS (
          SELECT 1 FROM users r WHERE r.referred_by = u.id
        )
        GROUP BY u.id
        ORDER BY referrals DESC
        LIMIT $1 OFFSET $2
      `

      const affiliatesResult = await query(affiliatesQuery, [limit, (page - 1) * limit])

      // Obter estatísticas totais
      const statsQuery = `
        SELECT 
          COUNT(DISTINCT u.id) AS total_affiliates,
          (
            SELECT COUNT(DISTINCT r.id)
            FROM users r
            JOIN payment_transactions pt ON pt.user_id = r.id
            WHERE r.referred_by IS NOT NULL
              AND pt.type = 'deposit'
              AND pt.status = 'completed'
          ) AS total_referrals,
          (
            SELECT COALESCE(SUM(bonus_amount), 0)
            FROM referral_bonuses
            WHERE status = 'paid'
          ) AS total_earned,
          (
            SELECT COALESCE(SUM(bonus_amount), 0)
            FROM referral_bonuses
            WHERE status = 'pending'
          ) AS total_pending,
          (
            SELECT COALESCE(SUM(pt.amount), 0)
            FROM users r
            JOIN payment_transactions pt ON pt.user_id = r.id
            WHERE r.referred_by IS NOT NULL
              AND pt.type = 'deposit'
              AND pt.status = 'completed'
          ) AS total_deposits
        FROM users u
        WHERE EXISTS (
          SELECT 1 FROM users r WHERE r.referred_by = u.id
        )
      `

      const statsResult = await query(statsQuery)

      // Obter configurações do programa de afiliados
      const settingsQuery = `
        SELECT key, value 
        FROM system_settings 
        WHERE key IN ('affiliate_min_deposit', 'affiliate_cpa_value')
      `
      const settingsResult = await query(settingsQuery)

      // Formatar os resultados
      const affiliates: (Affiliate & { totalDepositedByReferrals: number })[] = affiliatesResult.rows.map(row => ({
        id: row.id,
        name: row.name,
        email: row.email,
        referrals: parseInt(row.referrals),
        totalEarned: parseFloat(row.total_earned),
        pendingEarned: parseFloat(row.pending_earned),
        totalDepositedByReferrals: parseFloat(row.total_deposited_by_referrals),
        joinDate: new Date(row.join_date).toISOString().split('T')[0],
        status: row.status
      }))

      const stats: AffiliateStats & { totalDeposits: number } = {
        totalAffiliates: parseInt(statsResult.rows[0].total_affiliates),
        totalReferrals: parseInt(statsResult.rows[0].total_referrals),
        totalEarned: parseFloat(statsResult.rows[0].total_earned),
        totalPending: parseFloat(statsResult.rows[0].total_pending),
        totalDeposits: parseFloat(statsResult.rows[0].total_deposits)
      }

      const settings: AffiliateSettings = {
        minDeposit: settingsResult.rows.find(s => s.key === 'affiliate_min_deposit')?.value || '20.00',
        cpaValue: settingsResult.rows.find(s => s.key === 'affiliate_cpa_value')?.value || '5.00'
      }

      return NextResponse.json({
        success: true,
        data: {
          affiliates,
          stats,
          settings
        }
      })
    }
  } catch (error) {
    console.error('Error fetching affiliates:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar afiliados' },
      { status: 500 }
    )
  }
}



// POST - Atualizar configurações ou pagar afiliado
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)


  try {
    const body = await request.json()
    const { action, data } = body

    if (action === 'update_settings') {
      // Atualizar configurações do programa de afiliados
      const { minDeposit, cpaValue } = data as AffiliateSettings

      await query(`
        INSERT INTO system_settings (key, value)
        VALUES 
          ('affiliate_min_deposit', $1),
          ('affiliate_cpa_value', $2)
        ON CONFLICT (key) 
        DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
      `, [minDeposit, cpaValue])

      return NextResponse.json({
        success: true,
        message: 'Configurações atualizadas com sucesso'
      })

    } else if (action === 'pay_affiliate') {
      // Pagar um afiliado (marcar bônus pendentes como pagos)
      const { affiliateId } = data as { affiliateId: string }

      // Calcular o total pendente primeiro
      const sumResult = await query(`
        SELECT SUM(bonus_amount) as total_paid
        FROM referral_bonuses
        WHERE referrer_id = $1 AND status = 'pending'
      `, [affiliateId])

      const totalPaid = parseFloat(sumResult.rows[0].total_paid || '0')

      if (totalPaid > 0) {
        // Atualizar os bônus pendentes para pago
        await query(`
          UPDATE referral_bonuses
          SET status = 'paid', paid_at = NOW()
          WHERE referrer_id = $1 AND status = 'pending'
        `, [affiliateId])

        // Registrar no log de auditoria se necessário

        return NextResponse.json({
          success: true,
          message: `Pagamento de R$ ${totalPaid.toFixed(2)} processado com sucesso`
        })
      } else {
        return NextResponse.json(
          { error: 'Nenhum bônus pendente para pagar' },
          { status: 400 }
        )
      }

    } else {
      return NextResponse.json(
        { error: 'Ação inválida' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error processing affiliate action:', error)
    return NextResponse.json(
      { error: 'Erro ao processar ação' },
      { status: 500 }
    )
  }
}