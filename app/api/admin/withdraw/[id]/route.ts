// app/api/admin/transactions/[id]/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { query } from '@/lib/db'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('Iniciando processamento de solicitação de saque')

  const session = await getServerSession(authOptions)
  console.log('Sessão obtida:', session?.user?.email)

  const { id: transactionId } = await params
  console.log(`Processando transação ID: ${transactionId}`)

  try {
    const requestBody = await request.json()
    console.log('Corpo da requisição:', requestBody)

    const { action, reason } = requestBody

    if (!['approve', 'reject'].includes(action)) {
      console.error('Ação inválida recebida:', action)
      return NextResponse.json(
        { error: 'Ação inválida. Use "approve" ou "reject".' },
        { status: 400 }
      )
    }

    if (action === 'reject' && !reason) {
      console.error('Rejeição sem motivo especificado')
      return NextResponse.json(
        { error: 'Motivo da rejeição não especificado' },
        { status: 400 }
      )
    }

    console.log('Verificando transação no banco de dados...')
    const checkQuery = `
      SELECT id, user_id, amount, status, metadata
      FROM payment_transactions 
      WHERE id = $1 AND type = 'withdrawal'
    `
    const checkResult = await query(checkQuery, [transactionId])

    if (checkResult.rows.length === 0) {
      console.error(`Transação ${transactionId} não encontrada ou não é um saque`)
      return NextResponse.json(
        { error: 'Transação de saque não encontrada' },
        { status: 404 }
      )
    }

    const transaction = checkResult.rows[0]
    console.log('Transação encontrada:', transaction)

    if (transaction.status !== 'pending') {
      console.error(`Transação já processada - Status atual: ${transaction.status}`)
      return NextResponse.json(
        { error: 'Esta transação já foi processada' },
        { status: 400 }
      )
    }

    // Buscar nome do usuário
    const userQuery = `SELECT name FROM users WHERE id = $1`
    const userResult = await query(userQuery, [transaction.user_id])

    if (userResult.rows.length === 0) {
      console.error(`Usuário ${transaction.user_id} não encontrado`)
      return NextResponse.json(
        { error: 'Usuário relacionado à transação não encontrado' },
        { status: 404 }
      )
    }

    const userName = userResult.rows[0].name
    console.log('Nome do usuário:', userName)

    let queryString: string
    let params: any[] = []
    let userBalanceUpdate: string | null = null
    let balanceParams: any[] = []

    if (action === 'approve') {
      console.log('Processando aprovação de saque...')

      const clientId = process.env.PIXUP_CLIENT_ID
      const clientSecret = process.env.PIXUP_CLIENT_SECRET

      if (!clientId || !clientSecret) {
        console.error('Variáveis de ambiente PIXUP_CLIENT_ID ou PIXUP_CLIENT_SECRET não configuradas')
        return NextResponse.json(
          { error: 'Configuração da API PIX incompleta' },
          { status: 500 }
        )
      }

      console.log('Obtendo token de acesso da API PIX...')
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

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json()
        console.error('Erro ao obter token PIX:', {
          status: tokenResponse.status,
          error: errorData
        })
        return NextResponse.json(
          { error: 'Falha ao autenticar com a API PIX', details: errorData },
          { status: 502 }
        )
      }

      const tokenData = await tokenResponse.json()
      const accessToken = tokenData.access_token
      console.log('Token de acesso obtido com sucesso')

      const pixMetadata = transaction.metadata
      console.log('Metadados PIX:', pixMetadata)

      if (!pixMetadata.pixKey || !pixMetadata.cpfHolder || !pixMetadata.pixKeyType) {
        console.error('Dados PIX incompletos:', pixMetadata)
        return NextResponse.json(
          { error: 'Dados PIX incompletos para realizar o saque' },
          { status: 400 }
        )
      }

      const pixKeyTypeMap: Record<string, string> = {
        'cpf': 'cpf',
        'email': 'email',
        'phone': 'phone',
        'random': 'randomKey'
      }

      const pixKeyType = pixKeyTypeMap[pixMetadata.pixKeyType.toLowerCase()]
      if (!pixKeyType) {
        console.error('Tipo de chave PIX inválido:', pixMetadata.pixKeyType)
        return NextResponse.json(
          { error: 'Tipo de chave PIX inválido' },
          { status: 400 }
        )
      }

      const pixPayload = {
        creditParty: {
          name: pixMetadata.name || userName || 'Nome não informado',
          keyType: pixKeyType,
          key: pixMetadata.pixKey,
          taxId: pixMetadata.cpfHolder
        },
        amount: parseFloat(transaction.amount).toFixed(2),
        description: "Saque da plataforma",
        external_id: transaction.id
      }

      console.log('Enviando requisição PIX via proxy local...', pixPayload)

      // Modified to use local proxy instead of direct API call
      const pixResponse = await fetch('http://localhost:4141/payment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'accept': 'application/json',
          'content-type': 'application/json'
        },
        body: JSON.stringify(pixPayload)
      })

      if (!pixResponse.ok) {
        const errorData = await pixResponse.json()
        console.error('Erro na API PIX via proxy:', errorData)
        return NextResponse.json(
          { error: 'Falha ao processar o pagamento PIX via proxy', details: errorData },
          { status: 502 }
        )
      }

      const pixData = await pixResponse.json()
      console.log('Resposta da API PIX via proxy:', pixData)

      queryString = `
        UPDATE payment_transactions
        SET status = 'completed',
            metadata = jsonb_set(
              jsonb_set(
                jsonb_set(
                  COALESCE(metadata, '{}'::jsonb),
                  '{pix_response}', 
                  $2::jsonb
                ),
                '{processed_at}',
                to_jsonb(now()::timestamp)
              ),
              '{admin_approved_by}',
              to_jsonb($3::text)
            )
        WHERE id = $1
        RETURNING *
      `
      params = [
        transactionId,
        pixData,
        session.user.id
      ]
    } else {
      console.log('Processando rejeição de saque...')

      queryString = `
        UPDATE payment_transactions
        SET status = 'cancelled',
            description = COALESCE(description, '') || $2,
            metadata = jsonb_set(
              jsonb_set(
                jsonb_set(
                  COALESCE(metadata, '{}'::jsonb),
                  '{admin_rejected_at}', 
                  to_jsonb(now()::timestamp)
                ),
                '{rejection_reason}',
                to_jsonb($3::text)
              ),
              '{admin_rejected_by}',
              to_jsonb($4::text)
            )
        WHERE id = $1
        RETURNING *
      `
      const rejectionReason = reason || 'Não informado'
      params = [
        transactionId,
        `Saque recusado. `,
        rejectionReason,
        session.user.id
      ]

      userBalanceUpdate = `
        UPDATE users
        SET balance = balance + $1
        WHERE id = $2
      `
      balanceParams = [transaction.amount, transaction.user_id]
    }

    console.log('Executando query de atualização...', queryString)
    const result = await query(queryString, params)
    console.log('Transação atualizada com sucesso:', result.rows[0])

    if (action === 'reject' && userBalanceUpdate) {
      console.log('Devolvendo saldo ao usuário...')
      await query(userBalanceUpdate, balanceParams)

      const adjustmentQuery = `
        INSERT INTO payment_transactions (
          user_id,
          type,
          amount,
          status,
          description,
          metadata
        ) VALUES (
          $1, 'bonus', $2, 'completed',
          $3,
          jsonb_build_object(
            'original_withdrawal_id', $4::text,
            'action', 'reversal',
            'adminProcessedBy', $5::text
          )
        )
      `
      console.log('Criando transação de ajuste...')
      await query(adjustmentQuery, [
        transaction.user_id,
        transaction.amount,
        `Estorno de saque recusado (ID: ${transactionId})`,
        transactionId,
        session.user.id
      ])
    }

    console.log('Processamento concluído com sucesso')
    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: action === 'approve'
        ? 'Saque aprovado e PIX enviado para processamento via proxy local'
        : 'Saque recusado e valor devolvido'
    })

  } catch (error) {
    console.error('Erro ao processar saque:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      {
        error: 'Erro ao processar o saque',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}