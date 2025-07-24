import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  const { email } = await request.json();

  try {
    const userResult = await query('SELECT id FROM users WHERE email = $1 AND is_active = true', [email]);
    if (userResult.rows.length === 0) return NextResponse.json({ success: false, message: 'Email não encontrado' }, { status: 404 });

    // Gerar token de reset (simulado; use crypto para real)
    const resetToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 3600000); // 1 hora
    await query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at, is_active, created_at) VALUES ($1, $2, $3, $4, $5)',
      [userResult.rows[0].id, resetToken, expiresAt, true, new Date()]
    );

    // Simular envio de email (integre nodemailer)
    console.log(`Email de reset enviado para ${email} com token ${resetToken}`);

    return NextResponse.json({ success: true, message: 'Email de recuperação enviado' });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    return NextResponse.json({ error: 'Erro ao solicitar recuperação de senha' }, { status: 500 });
  }
}