import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { query } from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { amount, reason } = await request.json();
  if (!amount || amount <= 0) return NextResponse.json({ error: 'Valor inválido' }, { status: 400 });

  try {
    const balanceResult = await query('SELECT balance FROM users WHERE id = $1', [session.user.id]);
    if (balanceResult.rows[0].balance < amount) return NextResponse.json({ error: 'Saldo insuficiente' }, { status: 400 });

    await query('UPDATE users SET balance = balance - $1, updated_at = NOW() WHERE id = $2', [amount, session.user.id]);

    const transactionId = crypto.randomUUID();
    await query(
      'INSERT INTO payment_transactions (id, user_id, type, amount, status, description, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [transactionId, session.user.id, reason, -amount, 'completed', `Dedução de saldo por ${reason}`, new Date()]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deducting balance:', error);
    return NextResponse.json({ error: 'Erro ao deduzir saldo' }, { status: 500 });
  }
}