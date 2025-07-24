import { type NextRequest, NextResponse } from "next/server"
import { query, transaction } from "@/lib/database"
import { authenticateRequest } from "@/lib/auth"

export async function POST(request: NextRequest) {
  let userId: string | null = null // Declare userId variable here
  try {
    // Autenticar usuário
    const authResult = await authenticateRequest(request)
    userId = authResult.userId // Assign userId from authenticateRequest result
    const { categoryId, amount } = await request.json()

    // Validações
    if (!categoryId || !amount || amount <= 0) {
      return NextResponse.json({ message: "Dados inválidos" }, { status: 400 })
    }

    const result = await transaction(async (client) => {
      // Verificar categoria
      const categoryResult = await client.query(
        "SELECT id, title, price, is_active FROM game_categories WHERE id = $1",
        [categoryId],
      )

      if (categoryResult.rows.length === 0 || !categoryResult.rows[0].is_active) {
        throw new Error("Categoria não encontrada ou inativa")
      }

      const category = categoryResult.rows[0]
      const expectedPrice = Number.parseFloat(category.price)

      if (Math.abs(amount - expectedPrice) > 0.01) {
        throw new Error("Valor incorreto para esta categoria")
      }

      // Verificar saldo do usuário
      const userResult = await client.query("SELECT id, balance FROM users WHERE id = $1", [userId])

      if (userResult.rows.length === 0) {
        throw new Error("Usuário não encontrado")
      }

      const user = userResult.rows[0]
      const currentBalance = Number.parseFloat(user.balance)

      if (currentBalance < amount) {
        throw new Error("Saldo insuficiente")
      }

      // Deduzir saldo
      await client.query("UPDATE users SET balance = balance - $1 WHERE id = $2", [amount, userId])

      // Criar compra
      const purchaseResult = await client.query(
        `
        INSERT INTO game_purchases (user_id, category_id, amount, status)
        VALUES ($1, $2, $3, 'completed')
        RETURNING id
      `,
        [userId, categoryId, amount],
      )

      const purchaseId = purchaseResult.rows[0].id

      // Registrar transação
      await client.query(
        `
        INSERT INTO transactions (user_id, type, amount, status, description)
        VALUES ($1, 'bet', $2, 'completed', $3)
      `,
        [userId, amount, `Compra de raspadinha: ${category.title}`],
      )

      // Atualizar estatísticas do usuário
      await client.query("UPDATE users SET total_bets = total_bets + 1 WHERE id = $1", [userId])

      return {
        purchaseId,
        categoryTitle: category.title,
        amount: expectedPrice,
        newBalance: currentBalance - amount,
      }
    })

    // Registrar evento de analytics
    await query(
      `
      INSERT INTO analytics_events (user_id, event_name, properties)
      VALUES ($1, 'game_purchased', $2)
    `,
      [
        userId || null,
        JSON.stringify({
          categoryId,
          amount,
          purchaseId: result.purchaseId,
          timestamp: new Date().toISOString(),
        }),
      ],
    )

    return NextResponse.json({
      success: true,
      purchaseId: result.purchaseId,
      message: `Compra realizada com sucesso: ${result.categoryTitle}`,
      newBalance: result.newBalance,
    })
  } catch (error) {
    console.error("Game purchase error:", error)

    // Log do erro
    await query(
      `
      INSERT INTO error_logs (user_id, error_message, stack_trace, context)
      VALUES ($1, $2, $3, $4)
    `,
      [userId || null, error.message, error.stack, "game_purchase"],
    )

    return NextResponse.json(
      { message: error.message || "Erro interno do servidor" },
      { status: error.message === "Saldo insuficiente" ? 400 : 500 },
    )
  }
}
