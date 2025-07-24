import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { authenticateRequest } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    // Autenticar usuário
    const { userId } = await authenticateRequest(request)
    const { amount, method, cpf } = await request.json()

    // Validações
    if (!amount || amount < 20 || amount > 5000) {
      return NextResponse.json({ message: "Valor deve estar entre R$ 20,00 e R$ 5.000,00" }, { status: 400 })
    }

    if (!method || !["pix", "credit"].includes(method)) {
      return NextResponse.json({ message: "Método de pagamento inválido" }, { status: 400 })
    }

    if (!cpf || cpf.replace(/\D/g, "").length !== 11) {
      return NextResponse.json({ message: "CPF inválido" }, { status: 400 })
    }

    // Criar transação pendente
    const transactionResult = await query(
      `
      INSERT INTO transactions (user_id, type, amount, status, payment_method, description)
      VALUES ($1, 'deposit', $2, 'pending', $3, 'Depósito via ' || $4)
      RETURNING id
    `,
      [userId, amount, method, method === "pix" ? "PIX" : "Cartão"],
    )

    const transactionId = transactionResult.rows[0].id

    let paymentData = {}

    if (method === "pix") {
      // Integração com provedor PIX
      // Exemplo com API fictícia - substitua pela sua integração real
      try {
        const pixResponse = await fetch(`${process.env.PIX_PROVIDER_BASE_URL}/create-payment`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.PIX_PROVIDER_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: amount,
            description: `Depósito Raspou Ganhou - ${transactionId}`,
            externalId: transactionId,
            cpf: cpf.replace(/\D/g, ""),
            webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`,
          }),
        })

        if (!pixResponse.ok) {
          throw new Error("Erro ao criar pagamento PIX")
        }

        const pixData = await pixResponse.json()

        paymentData = {
          qrCode: pixData.qrCode,
          qrCodeText: pixData.qrCodeText,
          expiresAt: pixData.expiresAt,
          pixKey: pixData.pixKey,
        }

        // Atualizar transação com dados do PIX
        await query("UPDATE transactions SET external_transaction_id = $1 WHERE id = $2", [
          pixData.paymentId,
          transactionId,
        ])
      } catch (pixError) {
        console.error("PIX creation error:", pixError)

        // Cancelar transação
        await query("UPDATE transactions SET status = $1 WHERE id = $2", ["failed", transactionId])

        return NextResponse.json({ message: "Erro ao criar pagamento PIX" }, { status: 500 })
      }
    } else {
      // Para cartão de crédito, retornar dados para o formulário
      paymentData = {
        transactionId: transactionId,
        amount: amount,
        description: `Depósito Raspou Ganhou`,
      }
    }

    // Registrar evento de analytics
    await query(
      `
      INSERT INTO analytics_events (user_id, event_name, properties)
      VALUES ($1, 'payment_initiated', $2)
    `,
      [
        userId,
        JSON.stringify({
          amount,
          method,
          transactionId,
          timestamp: new Date().toISOString(),
        }),
      ],
    )

    return NextResponse.json({
      success: true,
      transactionId,
      method,
      amount,
      paymentData,
    })
  } catch (error) {
    console.error("Payment creation error:", error)

    // Log do erro
    await query(
      `
      INSERT INTO error_logs (user_id, error_message, stack_trace, context)
      VALUES ($1, $2, $3, $4)
    `,
      [null, error.message, error.stack, "payment_creation"],
    )

    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 })
  }
}
