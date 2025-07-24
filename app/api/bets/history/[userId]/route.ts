import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { query } from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: Request, { params }: { params: { userId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.id !== params.userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    const result = await query(
      'SELECT id, category_id, amount, result, prize_name, prize_value, created_at FROM user_bets WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [params.userId, limit, offset]
    );
    return NextResponse.json({ bets: result.rows });
  } catch (error) {
    console.error('Error fetching bet history:', error);
    return NextResponse.json({ error: 'Erro ao carregar histórico de apostas' }, { status: 500 });
  }
}