import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { email, name, welcomeBonus } = await request.json()

    // Aqui você integraria com seu provedor de email (SendGrid, AWS SES, etc.)
    // Exemplo com SendGrid:
    /*
    const sgMail = require('@sendgrid/mail')
    sgMail.setApiKey(process.env.EMAIL_PROVIDER_API_KEY)

    const msg = {
      to: email,
      from: process.env.EMAIL_FROM,
      subject: '🎉 Bem-vindo(a) ao Raspou Ganhou!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #22c55e;">Bem-vindo(a), ${name}!</h1>
          <p>Sua conta foi criada com sucesso no Raspou Ganhou!</p>
          <p>Você ganhou <strong>R$ ${welcomeBonus.toFixed(2)}</strong> de bônus de boas-vindas para começar a jogar.</p>
          <p>Comece agora mesmo a raspar e ganhar prêmios incríveis!</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Começar a Jogar</a>
        </div>
      `
    }

    await sgMail.send(msg)
    */

    // Por enquanto, apenas simular o envio
    console.log(`Email de boas-vindas enviado para ${email}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Welcome email error:", error)

    // Log do erro
    await query(
      `
      INSERT INTO error_logs (error_message, stack_trace, context)
      VALUES ($1, $2, $3)
    `,
      [error.message, error.stack, "welcome_email"],
    )

    return NextResponse.json({ message: "Erro ao enviar email" }, { status: 500 })
  }
}
