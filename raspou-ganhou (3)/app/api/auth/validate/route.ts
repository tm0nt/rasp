import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Token não fornecido" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json({ message: "Token inválido" }, { status: 401 })
    }

    // Verificar se o usuário ainda existe e está ativo
    const userResult = await query(
      `
      SELECT id, name, email, phone, balance, bonus_balance,
             referral_code, total_earnings, referral_earnings, total_bets,
             won_bets, lost_bets, is_verified, is_active, created_at, last_login_at
      FROM users 
      WHERE id = $1 AND is_active = true
    `,
      [payload.userId],
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 })
    }

    const user = userResult.rows[0]

    // Atualizar última atividade
    await query("UPDATE users SET last_activity_at = NOW() WHERE id = $1", [user.id])

    return NextResponse.json({
      valid: true,
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
    console.error("Token validation error:", error)
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 })
  }
}
