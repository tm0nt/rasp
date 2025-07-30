// app/api/deposit/pix/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { query } from '@/lib/db'
import crypto from 'crypto'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { amount, cpf } = await request.json()
  const parsedAmount = parseFloat(amount)

  // Validate amount
  if (isNaN(parsedAmount)) {
    return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })
  }

  if (parsedAmount < 5) {
    return NextResponse.json({ error: 'Valor mínimo é R$ 20,00' }, { status: 400 })
  }

  try {
    // 1. Get user details
    const userResult = await query(
      `SELECT name, email FROM users WHERE id = $1`,
      [session.user.id]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const user = userResult.rows[0]
    const externalId = crypto.randomUUID()

    // 2. Get PIX API token
    const clientId = process.env.PIXUP_CLIENT_ID
    const clientSecret = process.env.PIXUP_CLIENT_SECRET
    const authString = `${clientId}:${clientSecret}`
    const authToken = Buffer.from(authString).toString('base64')

    const tokenResponse = await fetch('https://api.pixupbr.com/v2/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authToken}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    })

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // 3. Create PIX charge
    const bodyData = {
      amount: parsedAmount.toFixed(2),
      external_id: externalId,
      postbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhook/pix`,
      payer: {
        name: user.name,
        document: cpf || '',
        email: user.email
      }
    };

    if (process.env.PIXUP_SPLIT === 'true') {
      bodyData.split = [
        {
          username: process.env.PIXUP_SPLIT_USERNAME,
          percentageSplit: parseInt(process.env.PIXUP_PERCENTAGE_SPLIT, 10)
        }
      ];
    }

    const pixResponse = await fetch('https://api.pixupbr.com/v2/pix/qrcode', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'accept': 'application/json',
        'content-type': 'application/json'
      },
      body: JSON.stringify(bodyData)
    })
    
    const pixData = await pixResponse.json()

    // 4. Save transaction to database
    await query(
      `INSERT INTO payment_transactions (
        id, user_id, type, amount, status, 
        payment_method, external_id, description, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        crypto.randomUUID(),
        session.user.id,
        'deposit',
        parsedAmount,
        'pending',
        'pix',
        pixData.external_id,
        'Depósito via PIX',
        JSON.stringify({
          qrcode: pixData.qrcode,
          expiration: pixData.expiration
        })
      ]
    )

    // 5. Return PIX data to client
    return NextResponse.json({
      success: true,
      qrcode: pixData.qrcode,
      transactionId: pixData.external_id,
      amount: parsedAmount,
      expiration: pixData.expiration
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao processar depósito.' },
      { status: 500 }
    )
  }
}