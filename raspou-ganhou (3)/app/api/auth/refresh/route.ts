import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { generateToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json()

    if (!refreshToken) {
      return NextResponse.json({ message: "Refresh token não fornecido" }, { status: 400 })
    }

    // Verificar refresh token no banco
    const tokenResult = await query(
      `
      SELECT rt.user_id, u.email, rt.expires_at
      FROM refresh_tokens rt
      JOIN users u ON rt.user_id = u.id
      WHERE rt.token = $1 AND rt.expires_at > NOW() AND rt.is_active = true
    `,
      [refreshToken],
    )

    if (tokenResult.rows.length === 0) {
      return NextResponse.json({ message: "Refresh token inválido ou expirado" }, { status: 401 })
    }

    const { user_id: userId, email } = tokenResult.rows[0]

    // Gerar novo access token
    const newAccessToken = generateToken(userId, email)

    // Gerar novo refresh token
    const newRefreshToken = generateRefreshToken()

    // Invalidar refresh token antigo
    await query("UPDATE refresh_tokens SET is_active = false WHERE token = $1", [refreshToken])

    // Criar novo refresh token
    await query(
      `
      INSERT INTO refresh_tokens (user_id, token, expires_at)
      VALUES ($1, $2, NOW() + INTERVAL '30 days')
    `,
      [userId, newRefreshToken],
    )

    // Buscar dados atualizados do usuário
    const userResult = await query(
      `
      SELECT id, name, email, phone, balance, bonus_balance,
             referral_code, total_earnings, referral_earnings, total_bets,
             won_bets, lost_bets, is_verified, created_at, last_login_at
      FROM users 
      WHERE id = $1 AND is_active = true
    `,
      [userId],
    )

    const user = userResult.rows[0]

    return NextResponse.json({
      success: true,
      token: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
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
      },
    })
  } catch (error) {
    console.error("Refresh token error:", error)
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 })
  }
}

function generateRefreshToken(): string {
  return require("crypto").randomBytes(64).toString("hex")
}
