import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  const body = await request.json();
  const { error, context, timestamp, userAgent, userId } = body;

  try {
    const id = (await query('SELECT MAX(id) + 1 AS new_id FROM user_analytics')).rows[0].new_id || 1;
    await query(
      'INSERT INTO user_analytics (id, user_id, event_type, event_data, ip_address, user_agent, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [id, userId || null, 'error', { error, context, timestamp }, request.headers.get('x-forwarded-for') || '', userAgent, new Date(timestamp)]
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error logging:', err);
    return NextResponse.json({ error: 'Erro ao registrar log' }, { status: 500 });
  }
}