import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query } from '@/lib/db';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    // Invalida sessões ativas
    await query('UPDATE refresh_tokens SET is_active = false WHERE user_id = $1', [session.user.id]);

    // Registra logout no audit log ou analytics
    const analyticsId = (await query('SELECT MAX(id) + 1 AS new_id FROM user_analytics')).rows[0].new_id || 1;
    await query(
      'INSERT INTO user_analytics (id, user_id, event_type, event_data, created_at) VALUES ($1, $2, $3, $4, $5)',
      [analyticsId, session.user.id, 'logout', {}, new Date()]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging out:', error);
    return NextResponse.json({ error: 'Erro ao fazer logout' }, { status: 500 });
  }
}