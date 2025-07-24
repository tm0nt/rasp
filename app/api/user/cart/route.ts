import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { query } from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    // Simula carrinho com user_bets pendentes
    const result = await query(
      'SELECT ub.id, ub.amount, ub.created_at, gc.name AS category_name FROM user_bets ub JOIN game_categories gc ON ub.category_id = gc.id WHERE ub.user_id = $1 AND ub.result IS NULL',
      [session.user.id]
    );
    return NextResponse.json({ items: result.rows, count: result.rows.length });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json({ error: 'Erro ao carregar carrinho' }, { status: 500 });
  }
}