import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { query } from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    // Assumindo promoções em bonus_transactions ativas
    const result = await query(
      'SELECT id, type, amount, description, expires_at FROM bonus_transactions WHERE user_id = $1 AND is_used = false AND expires_at > NOW()',
      [session.user.id]
    );
    return NextResponse.json({ promotions: result.rows });
  } catch (error) {
    console.error('Error fetching promotions:', error);
    return NextResponse.json({ error: 'Erro ao carregar promoções' }, { status: 500 });
  }
}