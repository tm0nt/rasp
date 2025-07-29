import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { query } from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { betId, result } = await request.json();

  if (!betId || !['win', 'lost'].includes(result)) {
    return NextResponse.json({ error: 'betId e result (win ou lost) são obrigatórios' }, { status: 400 });
  }

  try {
    // Verifica se a aposta existe e pertence ao usuário
    const betCheck = await query(
      'SELECT id FROM payment_transactions WHERE id = $1 AND user_id = $2',
      [betId, session.user.id]
    );

    if (betCheck.rowCount === 0) {
      return NextResponse.json({ error: 'Aposta não encontrada' }, { status: 404 });
    }

    // Atualiza apenas a chave "result" dentro do JSONB metadata
    const updateMetadata = await query(
      `UPDATE payment_transactions
       SET metadata = jsonb_set(COALESCE(metadata, '{}'), '{result}', to_jsonb($1::text), true)
       WHERE id = $2
       RETURNING id, metadata`,
      [result, betId]
    );

    return NextResponse.json({
      success: true,
      updatedBetId: updateMetadata.rows[0].id,
      metadata: updateMetadata.rows[0].metadata,
    });
  } catch (error) {
    console.error('Erro ao atualizar metadata da aposta:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
