import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { comparePassword, generateToken, generateRefreshToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password, rememberMe } = await request.json()

    // Validação básica
    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email e senha são obrigatórios" }, { status: 400 })
    }

    // Buscar usuário no banco
    const userResult = await query(
      `SELECT id, name, email, phone, password_hash, balance, bonus_balance,
              referral_code, total_earnings, referral_earnings, total_bets,
              won_bets, lost_bets, is_verified, is_active, created_at, last_login_at
       FROM users 
       WHERE email = $1 AND is_active = true`,
      [email.toLowerCase()],
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json({ success: false, message: "Email ou senha incorretos" }, { status: 401 })
    }

    const user = userResult.rows[0]

    // Verificar senha
    const isValidPassword = await comparePassword(password, user.password_hash)
    if (!isValidPassword) {
      return NextResponse.json({ success: false, message: "Email ou senha incorretos" }, { status: 401 })
    }

    // Gerar tokens
    const accessToken = generateToken(user.id, user.email)
    const refreshToken = generateRefreshToken(user.id, user.email)

    // Salvar refresh token no banco
    await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '30 days')
       ON CONFLICT (user_id) DO UPDATE SET
       token = $2, expires_at = NOW() + INTERVAL '30 days', created_at = NOW()`,
      [user.id, refreshToken],
    )

    // Atualizar último login
    await query(`UPDATE users SET last_login_at = NOW(), last_activity_at = NOW() WHERE id = $1`, [user.id])

    // Preparar dados do usuário
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      balance: Number.parseFloat(user.balance),
      bonusBalance: Number.parseFloat(user.bonus_balance),
      referralCode: user.referral_code,
      totalEarnings: Number.parseFloat(user.total_earnings),
      referralEarnings: Number.parseFloat(user.referral_earnings),
      totalBets: user.total_bets,
      wonBets: user.won_bets,
      lostBets: user.lost_bets,
      isVerified: user.is_verified,
      createdAt: user.created_at,
      lastLoginAt: user.last_login_at,
    }

    return NextResponse.json({
      success: true,
      message: "Login realizado com sucesso",
      user: userData,
      token: accessToken,
      refreshToken: refreshToken,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}
