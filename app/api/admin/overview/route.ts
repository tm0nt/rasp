// app/api/admin/overview/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { query } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  
  try {
    // Obter estatísticas de depósitos
    const depositsResult = await query(`
      SELECT 
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as paid_deposits,
        SUM(amount) as total_deposits
      FROM payment_transactions
      WHERE type = 'deposit'
    `)

    // Obter estatísticas de saques
    const withdrawalsResult = await query(`
      SELECT 
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as paid_withdrawals,
        SUM(amount) as total_withdrawals
      FROM payment_transactions
      WHERE type = 'withdrawal'
    `)

    // Obter estatísticas de usuários (usando last_activity_at em vez de last_active_at)
    const usersResult = await query(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN last_activity_at > NOW() - INTERVAL '30 days' THEN 1 ELSE 0 END) as active_users
      FROM users
    `)

    // Obter estatísticas de transações
    const transactionsResult = await query(`
      SELECT 
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_transactions,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_transactions
      FROM payment_transactions
    `)

    // Formatar os resultados
    const stats = {
      totalDeposits: parseFloat(depositsResult.rows[0].total_deposits || '0'),
      paidDeposits: parseFloat(depositsResult.rows[0].paid_deposits || '0'),
      totalWithdrawals: parseFloat(withdrawalsResult.rows[0].total_withdrawals || '0'),
      paidWithdrawals: parseFloat(withdrawalsResult.rows[0].paid_withdrawals || '0'),
      totalUsers: parseInt(usersResult.rows[0].total_users || '0'),
      activeUsers: parseInt(usersResult.rows[0].active_users || '0'),
      pendingTransactions: parseInt(transactionsResult.rows[0].pending_transactions || '0'),
      completedTransactions: parseInt(transactionsResult.rows[0].completed_transactions || '0'),
    }

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('Error fetching admin overview:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    )
  }
}