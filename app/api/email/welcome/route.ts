import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });

  const { email, name, welcomeBonus } = await request.json();
  // Simule envio de email (integre nodemailer para produção)
  console.log(`Enviando email de boas-vindas para ${email}: Bem-vindo ${name}, bônus: R$${welcomeBonus}`);

  return NextResponse.json({ success: true });
}