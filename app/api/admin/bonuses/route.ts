// app/api/admin/bonuses/route.ts
// Note: The provided database schema does not include a 'bonuses' table. Add the following to your database setup script:

// CREATE TABLE bonuses (
//     id SERIAL PRIMARY KEY,
//     name VARCHAR(100) NOT NULL,
//     value DECIMAL(10,2) NOT NULL,
//     min_deposit DECIMAL(10,2) DEFAULT 0.00,
//     is_active BOOLEAN DEFAULT TRUE,
//     created_at TIMESTAMP DEFAULT NOW(),
//     updated_at TIMESTAMP DEFAULT NOW()
// );

// Also, modify bonus_transactions to include:
// ALTER TABLE bonus_transactions ADD COLUMN bonus_id INTEGER REFERENCES bonuses(id);

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { query } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  

  try {
    const bonusesResult = await query(`
      SELECT 
        id,
        name,
        value,
        min_deposit AS "minDeposit",
        is_active AS "isActive",
        TO_CHAR(created_at, 'YYYY-MM-DD') AS "createdAt",
        (SELECT COUNT(*) FROM bonus_transactions WHERE bonus_id = bonuses.id) AS "usedCount"
      FROM bonuses
    `)

    const bonuses = bonusesResult.rows

    return NextResponse.json({
      success: true,
      bonuses
    })

  } catch (error) {
    console.error('Erro ao buscar bônus:', error)
    return NextResponse.json({ error: 'Erro ao buscar bônus' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  

  const { name, value, minDeposit } = await request.json()

  try {
    await query(`
      INSERT INTO bonuses (name, value, min_deposit)
      VALUES ($1, $2, $3)
    `, [name, value, minDeposit])

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erro ao adicionar bônus:', error)
    return NextResponse.json({ error: 'Erro ao adicionar bônus' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)
  

  const { id, name, value, minDeposit, isActive } = await request.json()

  try {
    await query(`
      UPDATE bonuses
      SET name = $1, value = $2, min_deposit = $3, is_active = $4
      WHERE id = $5
    `, [name, value, minDeposit, isActive, id])

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erro ao editar bônus:', error)
    return NextResponse.json({ error: 'Erro ao editar bônus' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions)
  

  const { id } = await request.json()

  try {
    await query(`DELETE FROM bonuses WHERE id = $1`, [id])

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erro ao deletar bônus:', error)
    return NextResponse.json({ error: 'Erro ao deletar bônus' }, { status: 500 })
  }
}