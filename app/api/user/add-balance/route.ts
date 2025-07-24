import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { query } from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { amount, source } = await request.json();
  if (!amount || amount <= 0) return NextResponse.json({ error: 'Valor inválido' }, { status: 400 });

  try {
    const column = source === 'bonus' ? 'bonus_balance' : 'balance';
    await query(`UPDATE users SET ${column} = ${column} + $1, updated_at = NOW() WHERE id = $2 RETURNING ${column}`, [amount, session.user.id]);

    const transactionId = crypto.randomUUID();
    await query(
      'INSERT INTO payment_transactions (id, user_id, type, amount, status, description, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [transactionId, session.user.id, source, amount, 'completed', `Adição de saldo via ${source}`, new Date()]
    );

    if (source === 'bonus') {
      const bonusId = crypto.randomUUID();
      await query(
        'INSERT INTO bonus_transactions (id, user_id, type, amount, description, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [bonusId, session.user.id, 'welcome', amount, 'Bônus adicionado', new Date()]
      );
    }

    const newBalanceResult = await query(`SELECT ${column} FROM users WHERE id = $1`, [session.user.id]);
    const newBalance = newBalanceResult.rows[0][column.replace('_balance', '')];

    return NextResponse.json({ success: true, newBalance });
  } catch (error) {
    console.error('Error adding balance:', error);
    return NextResponse.json({ error: 'Erro ao adicionar saldo' }, { status: 500 });
  }
}