import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { query } from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });

  const { userId, timestamp } = await request.json();
  await query('UPDATE users SET last_login_at = $1, last_activity_at = $1 WHERE id = $2', [new Date(timestamp), userId]);

  return NextResponse.json({ success: true });
}