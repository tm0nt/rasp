import { type NextRequest, NextResponse } from "next/server"
import { query, transaction } from "@/lib/database"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("x-webhook-signature")

    // Verificar assinatura do webhook (segurança)
    const expectedSignature = crypto.createHmac("sha256", process.env.WEBHOOK_SECRET!).update(body).digest("hex")

    if (signature !== expectedSignature) {
      return NextResponse.json({ message: "Assinatura inválida" }, { status: 401 })
    }

    const webhookData = JSON.parse(body)
    const { paymentId, status, amount, externalId } = webhookData

    if (status === "completed") {
      await transaction(async (client) => {
        // Buscar transação
        const transactionResult = await client.query(
          "SELECT id, user_id, amount FROM transactions WHERE id = $1 AND status = $2",
          [externalId, "pending"],
        )

        if (transactionResult.rows.length === 0) {
          throw new Error("Transação não encontrada ou já processada")
        }

        const transactionData = transactionResult.rows[0]

        // Verificar se o valor confere
        if (Math.abs(Number.parseFloat(transactionData.amount) - amount) > 0.01) {
          throw new Error("Valor não confere")
        }

        // Atualizar transação
        await client.query(
          `
          UPDATE transactions 
          SET status = 'completed', completed_at = NOW()
          WHERE id = $1
        `,
          [externalId],
        )

        // Adicionar saldo ao usuário
        await client.query("UPDATE users SET balance = balance + $1 WHERE id = $2", [amount, transactionData.user_id])

        // Registrar evento de analytics
        await client.query(
          `
          INSERT INTO analytics_events (user_id, event_name, properties)
          VALUES ($1, 'deposit_completed', $2)
        `,
          [
            transactionData.user_id,
            JSON.stringify({
              amount,
              transactionId: externalId,
              paymentId,
              timestamp: new Date().toISOString(),
            }),
          ],
        )
      })
    } else if (status === "failed" || status === "expired") {
      // Marcar transação como falhada
      await query("UPDATE transactions SET status = $1 WHERE id = $2", ["failed", externalId])
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook error:", error)

    // Log do erro
    await query(
      `
      INSERT INTO error_logs (error_message, stack_trace, context)
      VALUES ($1, $2, $3)
    `,
      [error.message, error.stack, "payment_webhook"],
    )

    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 })
  }
}
