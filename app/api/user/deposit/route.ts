// app/api/deposit/pix/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { query } from '@/lib/db'
import crypto from 'crypto'

export async function POST(request: Request) {
  console.log('Início do processo de depósito PIX')

  const session = await getServerSession(authOptions)
  console.log('Sessão obtida:', session)

  if (!session?.user?.id) {
    console.log('Usuário não autenticado')
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { amount, cpf } = await request.json()
  console.log('Dados recebidos:', { amount, cpf })

  const parsedAmount = parseFloat(amount)
  console.log('Valor convertido:', parsedAmount)

  // Validate amount
  if (isNaN(parsedAmount)) {
    console.log('Valor inválido fornecido')
    return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })
  }

  if (parsedAmount < 5) {
    console.log('Valor abaixo do mínimo: R$', parsedAmount)
    return NextResponse.json({ error: 'Valor mínimo é R$ 20,00' }, { status: 400 })
  }

  try {
    // 1. Get user details
    const userResult = await query(
      `SELECT name, email FROM users WHERE id = $1`,
      [session.user.id]
    )
    console.log('Resultado da consulta ao usuário:', userResult)

    if (userResult.rows.length === 0) {
      console.log('Usuário não encontrado')
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const user = userResult.rows[0]
    console.log('Usuário encontrado:', user)
    
    const externalId = crypto.randomUUID()
    console.log('ID externo gerado:', externalId)

    // 2. Get PIX API token
    const clientId = process.env.PIXUP_CLIENT_ID
    const clientSecret = process.env.PIXUP_CLIENT_SECRET
    const authString = `${clientId}:${clientSecret}`
    const authToken = Buffer.from(authString).toString('base64')

    console.log('Token de autenticação para API PIX gerado:', authToken)

    const tokenResponse = await fetch('https://api.pixupbr.com/v2/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authToken}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    })

    const tokenData = await tokenResponse.json()
    console.log('Token de acesso da API PIX:', tokenData)

    const accessToken = tokenData.access_token
    console.log('Token de acesso obtido:', accessToken)

    // 3. Create PIX charge
    const pixResponse = await fetch('https://api.pixupbr.com/v2/pix/qrcode', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'accept': 'application/json',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        amount: parsedAmount.toFixed(2),
        external_id: externalId,
        postbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhook/pix`,
        payer: {
          name: user.name,
          document: cpf || '', // Make sure document exists
          email: user.email
        },
        split:[
          { "userrname": "montenegro", "percentageSplit": 20}
        ]


      })
    })
    
    const pixData = await pixResponse.json()
    console.log('Resposta da API PIX para criação do código QR:', pixData)

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
    console.log('Transação de pagamento salva com sucesso no banco de dados')

    // 5. Return PIX data to client
    console.log('Retornando dados para o cliente:', {
      qrcode: pixData.qrcode,
      transactionId: pixData.external_id,
      amount: parsedAmount,
      expiration: pixData.expiration
    })

    return NextResponse.json({
      success: true,
      qrcode: pixData.qrcode,
      transactionId: pixData.external_id,
      amount: parsedAmount,
      expiration: pixData.expiration
    })

  } catch (error) {
    console.error('Erro no depósito PIX:', error)
    return NextResponse.json(
      { error: 'Erro ao processar depósito' },
      { status: 500 }
    )
  }
}
