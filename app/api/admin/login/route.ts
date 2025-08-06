import { NextResponse } from 'next/server'
import { query } from '@/lib/db' // Se você estiver usando um pool de conexões diretamente com 'pg' ou outro client
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 })
  }

  try {
    // Realiza a consulta ao banco de dados para buscar o usuário pelo email
    const { rows } = await query('SELECT * FROM admin_users WHERE email = $1', [email])

    // Se o usuário não for encontrado, retornar erro
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
    }

    const user = rows[0]

    // Verifica se a senha fornecida corresponde ao hash armazenado
    const isPasswordValid = await bcrypt.compare(password, user.password_hash)

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
    }

    // Crie o token ou qualquer outra lógica de autenticação
    const token = 'fake-admin-token' // Para uma implementação real, use JWT ou outro método de segurança

    // Retorna a resposta com sucesso e o token
    return NextResponse.json({ success: true, token })
  } catch (error) {
    console.error('Erro ao realizar login:', error)
    return NextResponse.json({ error: 'Erro ao processar a solicitação' }, { status: 500 })
  }
}
