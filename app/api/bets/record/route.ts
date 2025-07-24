import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { query } from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { categoryId, amount, result, prize, prizeValue, timestamp } = await request.json();

  try {
    const betId = crypto.randomUUID();
    await query(
      'INSERT INTO user_bets (id, user_id, category_id, amount, result, prize_name, prize_value, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [betId, session.user.id, categoryId, amount, result, prize, prizeValue, new Date(timestamp)]
    );

    const win = result === 'win' ? 1 : 0;
    const loss = result === 'lose' ? 1 : 0;
    const earnings = result === 'win' ? prizeValue : 0;
    await query(
      'UPDATE users SET total_bets = total_bets + 1, won_bets = won_bets + $1, lost_bets = lost_bets + $2, total_earnings = total_earnings + $3, updated_at = NOW() WHERE id = $4 RETURNING total_bets, won_bets, lost_bets, total_earnings',
      [win, loss, earnings, session.user.id]
    );

    return NextResponse.json({ success: true, bet: { id: betId } });
  } catch (error) {
    console.error('Error recording bet:', error);
    return NextResponse.json({ error: 'Erro ao registrar aposta' }, { status: 500 });
  }
}