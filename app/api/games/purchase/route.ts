import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { query } from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { categoryId, amount } = await request.json();

  try {
    // Verifica saldo
    const balanceResult = await query('SELECT balance FROM users WHERE id = $1', [session.user.id]);
    if (balanceResult.rows[0].balance < amount) return NextResponse.json({ error: 'Saldo insuficiente' }, { status: 400 });

    // Deduz saldo
    await query('UPDATE users SET balance = balance - $1 WHERE id = $2', [amount, session.user.id]);

    // Registra transação
    const transactionId = crypto.randomUUID();
    await query(
      'INSERT INTO payment_transactions (id, user_id, type, amount, status, payment_method, description, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [transactionId, session.user.id, 'bet', -amount, 'completed', 'balance', 'Compra de jogo', new Date()]
    );

    // Registra aposta com resultado padrão
    const betId = crypto.randomUUID();
    await query(
      'INSERT INTO user_bets (id, user_id, game_id, category_id, amount, result, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [betId, session.user.id, null, categoryId, amount, 'pending', new Date()] // Added default 'pending' result
    );

    return NextResponse.json({ success: true, purchaseId: betId, transactionId });
  } catch (error) {
    console.error('Error purchasing game:', error);
    return NextResponse.json({ error: 'Erro na compra' }, { status: 500 });
  }
}