import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { hashPassword, generateToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, password, referralCode } = await request.json()

    // Validações
    if (!name || name.length < 2) {
      return NextResponse.json({ message: "Nome deve ter pelo menos 2 caracteres" }, { status: 400 })
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json({ message: "Email inválido" }, { status: 400 })
    }

    if (!phone || phone.length < 10) {
      return NextResponse.json({ message: "Telefone deve ter pelo menos 10 dígitos" }, { status: 400 })
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ message: "Senha deve ter pelo menos 6 caracteres" }, { status: 400 })
    }

    // Verificar se email já existe
    const existingUser = await query("SELECT id FROM users WHERE email = $1 OR phone = $2", [email, phone])

    if (existingUser.rows.length > 0) {
      return NextResponse.json({ message: "Este email ou telefone já está cadastrado" }, { status: 409 })
    }

    // Hash da senha
    const passwordHash = await hashPassword(password)

    // Gerar código de referência único
    let referralCodeGenerated: string
    let isUnique = false

    while (!isUnique) {
      referralCodeGenerated = `REF${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      const existing = await query("SELECT id FROM users WHERE referral_code = $1", [referralCodeGenerated])
      isUnique = existing.rows.length === 0
    }

    // Verificar código de referência (se fornecido)
    let referredBy = null
    if (referralCode) {
      const referrer = await query("SELECT id FROM users WHERE referral_code = $1", [referralCode])
      if (referrer.rows.length > 0) {
        referredBy = referrer.rows[0].id
      }
    }

    // Criar usuário
    const result = await query(
      `
      INSERT INTO users (
        name, email, phone, password_hash, referral_code, referred_by,
        balance, bonus_balance
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, name, email, phone, balance, bonus_balance, referral_code,
               total_earnings, referral_earnings, total_bets, won_bets, lost_bets,
               is_verified, created_at
    `,
      [
        name,
        email,
        phone,
        passwordHash,
        referralCodeGenerated!,
        referredBy,
        10.0,
        10.0, // Bônus de boas-vindas
      ],
    )

    const user = result.rows[0]

    // Registrar transação de bônus
    await query(
      `
      INSERT INTO transactions (user_id, type, amount, status, description)
      VALUES ($1, 'bonus', $2, 'completed', 'Bônus de boas-vindas')
    `,
      [user.id, 10.0],
    )

    // Se foi referenciado, dar bônus ao referenciador
    if (referredBy) {
      await query(
        `
        UPDATE users 
        SET referral_earnings = referral_earnings + 5.00,
            balance = balance + 5.00
        WHERE id = $1
      `,
        [referredBy],
      )

      await query(
        `
        INSERT INTO transactions (user_id, type, amount, status, description)
        VALUES ($1, 'bonus', $2, 'completed', 'Bônus de indicação')
      `,
        [referredBy, 5.0],
      )
    }

    // Gerar token
    const token = generateToken(user.id, user.email)

    // Registrar evento de analytics
    await query(
      `
      INSERT INTO analytics_events (user_id, event_name, properties)
      VALUES ($1, 'user_registered', $2)
    `,
      [
        user.id,
        JSON.stringify({
          registrationMethod: "email",
          hasReferralCode: !!referralCode,
          timestamp: new Date().toISOString(),
        }),
      ],
    )

    return NextResponse.json({
      success: true,
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
        lastLoginAt: new Date().toISOString(),
      },
      token,
    })
  } catch (error) {
    console.error("Registration error:", error)

    // Log do erro
    await query(
      `
      INSERT INTO error_logs (error_message, stack_trace, context)
      VALUES ($1, $2, $3)
    `,
      [error.message, error.stack, "user_registration"],
    )

    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 })
  }
}
