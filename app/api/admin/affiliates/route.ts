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

// GET - Listar afiliados e estatísticas
export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')

  try {
    // Obter afiliados (usuários que têm referências)
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
        COALESCE(SUM(CASE WHEN rb.status = 'paid' THEN rb.bonus_amount ELSE 0 END), 0) as total_earned,
        COALESCE(SUM(CASE WHEN rb.status = 'pending' THEN rb.bonus_amount ELSE 0 END), 0) as pending_earned,
        u.created_at as join_date,
        CASE 
          WHEN u.is_active = false THEN 'Inativo'
          ELSE 'Ativo'
        END as status
      FROM users u
      LEFT JOIN referral_bonuses rb ON u.id = rb.referrer_id
      WHERE EXISTS (SELECT 1 FROM referral_bonuses WHERE referrer_id = u.id)
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT $1 OFFSET $2
    `

    const affiliatesResult = await query(affiliatesQuery, [limit, (page - 1) * limit])

    // Obter estatísticas totais
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT u.id) as total_affiliates,
        (
          SELECT COUNT(DISTINCT r.id)
          FROM users r
          JOIN payment_transactions pt ON pt.user_id = r.id
          WHERE r.referred_by IS NOT NULL
            AND pt.type = 'deposit'
            AND pt.status = 'completed'
        ) as total_referrals,
        COALESCE(SUM(CASE WHEN rb.status = 'paid' THEN rb.bonus_amount ELSE 0 END), 0) as total_earned,
        COALESCE(SUM(CASE WHEN rb.status = 'pending' THEN rb.bonus_amount ELSE 0 END), 0) as total_pending
      FROM users u
      LEFT JOIN referral_bonuses rb ON u.id = rb.referrer_id
      WHERE EXISTS (SELECT 1 FROM referral_bonuses WHERE referrer_id = u.id)
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
    const affiliates: Affiliate[] = affiliatesResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      referrals: parseInt(row.referrals),
      totalEarned: parseFloat(row.total_earned),
      pendingEarned: parseFloat(row.pending_earned),
      joinDate: new Date(row.join_date).toISOString().split('T')[0],
      status: row.status
    }))

    const stats: AffiliateStats = {
      totalAffiliates: parseInt(statsResult.rows[0].total_affiliates),
      totalReferrals: parseInt(statsResult.rows[0].total_referrals),
      totalEarned: parseFloat(statsResult.rows[0].total_earned),
      totalPending: parseFloat(statsResult.rows[0].total_pending)
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

      // Registrar no log de auditoria
      await query(`
        INSERT INTO admin_audit_logs (admin_id, action, resource_type, new_values)
        VALUES ($1, $2, $3, $4)
      `, [
        "1",
        'update',
        'affiliate_settings',
        JSON.stringify({
          minDeposit,
          cpaValue,
          updated_by: "Admin",
          updated_at: new Date().toISOString()
        }),
      ])

      return NextResponse.json({
        success: true,
        message: 'Configurações atualizadas com sucesso'
      })

    } else if (action === 'pay_affiliate') {
      // Pagar um afiliado (marcar bônus pendentes como pagos)
      const { affiliateId } = data as { affiliateId: string }

      // Atualizar os bônus pendentes para pago
      const updateResult = await query(`
        UPDATE referral_bonuses
        SET status = 'paid', paid_at = NOW()
        WHERE referrer_id = $1 AND status = 'pending'
        RETURNING SUM(bonus_amount) as total_paid
      `, [affiliateId])

      const totalPaid = parseFloat(updateResult.rows[0].total_paid || '0')

      if (totalPaid > 0) {
        // Registrar no log de auditoria
        await query(`
          INSERT INTO admin_audit_logs (admin_id, action, resource_type, resource_id, new_values)
          VALUES ($1, $2, $3, $4, $5)
        `, [
           "1",
          'pay',
          'affiliate',
          affiliateId,
          JSON.stringify({
            amount: totalPaid,
            paid_at: new Date().toISOString(),
            processed_by: "Admin"
          }),
        ])

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