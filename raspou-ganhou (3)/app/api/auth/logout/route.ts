import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getTokenFromRequest, verifyToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    const { refreshToken } = await request.json()

    if (token) {
      const payload = verifyToken(token)
      if (payload) {
        // Invalidar todos os refresh tokens do usuário
        await query(`UPDATE refresh_tokens SET is_active = false WHERE user_id = $1`, [payload.userId])
      }
    }

    // Se um refresh token específico foi fornecido, invalidá-lo
    if (refreshToken) {
      await query(`UPDATE refresh_tokens SET is_active = false WHERE token = $1`, [refreshToken])
    }

    return NextResponse.json({
      success: true,
      message: "Logout realizado com sucesso",
    })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}
