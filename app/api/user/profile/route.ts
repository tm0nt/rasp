import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { query } from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const result = await query(
      `SELECT id, name, email, phone, balance, referral_code, total_earnings, referral_earnings, 
              bonus_balance, is_verified, created_at, last_login_at, total_bets, won_bets, lost_bets 
       FROM users 
       WHERE id = $1 AND is_active = true`,
      [session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const user = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      email: result.rows[0].email,
      phone: result.rows[0].phone,
      balance: parseFloat(result.rows[0].balance),
      avatar: result.rows[0].avatar || undefined,
      referralCode: result.rows[0].referral_code,
      totalEarnings: parseFloat(result.rows[0].total_earnings),
      referralEarnings: parseFloat(result.rows[0].referral_earnings),
      bonusBalance: parseFloat(result.rows[0].bonus_balance),
      isVerified: result.rows[0].is_verified,
      createdAt: result.rows[0].created_at.toISOString(),
      lastLoginAt: result.rows[0].last_login_at?.toISOString() || null,
      totalBets: parseInt(result.rows[0].total_bets),
      wonBets: parseInt(result.rows[0].won_bets),
      lostBets: parseInt(result.rows[0].lost_bets)
    };

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Erro ao carregar perfil' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { updates } = await request.json();

  try {
    const allowedFields = ['name', 'email', 'phone', 'avatar'];
    const updateFields = Object.keys(updates).filter(key => allowedFields.includes(key)).map((key, index) => `${key} = $${index + 2}`).join(', ');
    if (!updateFields) return NextResponse.json({ error: 'Nenhum campo válido para atualizar' }, { status: 400 });

    const result = await query(
      `UPDATE users SET ${updateFields}, updated_at = NOW() WHERE id = $1 RETURNING id, name, email, phone, avatar`,
      [session.user.id, ...Object.values(updates).filter((_, idx) => allowedFields.includes(Object.keys(updates)[idx]))]
    );

    return NextResponse.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 });
  }
}