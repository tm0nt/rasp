import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { query } from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { purchaseId, categoryId } = await request.json();

  try {
    // Pega jogo aleatório baseado na categoria
    const gamesResult = await query('SELECT id, win_probability, max_prize_value FROM games WHERE category_id = $1 AND is_active = true LIMIT 1', [categoryId]);
    if (gamesResult.rows.length === 0) return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 });
    const game = gamesResult.rows[0];

    // Gera resultado baseado em probabilidades
    const resultsResult = await query('SELECT prize_name, prize_value, probability FROM game_results WHERE game_id = $1 AND is_active = true', [game.id]);
    const results = resultsResult.rows;

    let cumulativeProb = 0;
    const rand = Math.random();
    let selectedResult = { prize_name: 'Perdeu', prize_value: 0 };
    for (const res of results) {
      cumulativeProb += res.probability;
      if (rand <= cumulativeProb) {
        selectedResult = res;
        break;
      }
    }

    // Atualiza user_bets com resultado
    await query(
      'UPDATE user_bets SET game_id = $1, result = $2, prize_name = $3, prize_value = $4 WHERE id = $5',
      [game.id, selectedResult.prize_value > 0 ? 'win' : 'loss', selectedResult.prize_name, selectedResult.prize_value, purchaseId]
    );

    // Se ganhou, adiciona ao saldo ou bonus
    if (selectedResult.prize_value > 0) {
      await query('UPDATE users SET balance = balance + $1 WHERE id = $2', [selectedResult.prize_value, session.user.id]);
    }

    // Atualiza stats do usuário
    await query(
      'UPDATE users SET total_bets = total_bets + 1, won_bets = won_bets + $1, lost_bets = lost_bets + $2, total_earnings = total_earnings + $3 WHERE id = $4',
      [selectedResult.prize_value > 0 ? 1 : 0, selectedResult.prize_value > 0 ? 0 : 1, selectedResult.prize_value, session.user.id]
    );

    return NextResponse.json({ gameData: { result: selectedResult, maxPrize: game.max_prize_value } });
  } catch (error) {
    console.error('Error generating game:', error);
    return NextResponse.json({ error: 'Erro ao gerar jogo' }, { status: 500 });
  }
}