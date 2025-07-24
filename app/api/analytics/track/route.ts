import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  const { event, userId, properties } = await request.json();

  try {
    const id = (await query('SELECT MAX(id) + 1 AS new_id FROM user_analytics')).rows[0].new_id || 1;
    await query(
      'INSERT INTO user_analytics (id, user_id, event_type, event_data, ip_address, user_agent, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [id, userId, event, properties, request.headers.get('x-forwarded-for') || '', request.headers.get('user-agent') || '', new Date()]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking event:', error);
    return NextResponse.json({ error: 'Erro ao trackear evento' }, { status: 500 });
  }
}