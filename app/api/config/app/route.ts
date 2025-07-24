import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query('SELECT key, value FROM system_settings');
    const config = result.rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching app config:', error);
    return NextResponse.json({ error: 'Erro ao carregar configuração' }, { status: 500 });
  }
}