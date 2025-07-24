import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { customAdapter } from '@/lib/authAdapter';

function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export const authOptions: NextAuthOptions = {
  adapter: customAdapter,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        name: { label: 'Name', type: 'text' },
        phone: { label: 'Phone', type: 'tel' },
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        referralCode: { label: 'Referral Code', type: 'text' },
        rememberMe: { label: 'Remember Me', type: 'boolean' },
        action: { label: 'Action', type: 'text' }, // 'register' ou undefined para login
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email e senha são obrigatórios');
        }

        if (credentials.action === 'register') {
          // Registro
          if (!credentials.name || credentials.name.length < 2) throw new Error('Nome deve ter pelo menos 2 caracteres');
          if (!credentials.phone || credentials.phone.length < 10) throw new Error('Telefone deve ter pelo menos 10 dígitos');
          if (credentials.password.length < 6) throw new Error('Senha deve ter pelo menos 6 caracteres');

          const existingUser = await query('SELECT id FROM users WHERE email = $1', [credentials.email]);
          if (existingUser.rows.length > 0) throw new Error('Este email já está cadastrado');

          const passwordHash = await bcrypt.hash(credentials.password, 10);
          const id = crypto.randomUUID();
          const referralCode = credentials.referralCode || generateReferralCode();
          const createdAt = new Date();
          await query(
            `
            INSERT INTO users (id, name, phone, email, password_hash, referral_code, balance, bonus_balance, total_earnings, referral_earnings, total_bets, won_bets, lost_bets, is_active, is_verified, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            `,
            [id, credentials.name, credentials.phone, credentials.email, passwordHash, referralCode, 0, 10.00, 0, 0, 0, 0, 0, true, false, createdAt, createdAt] // Bônus de R$10, is_verified false
          );

          return { id, name: credentials.name, email: credentials.email, balance: 0, bonus_balance: 10.00 };
        } else {
          // Login
          let userQuery = 'SELECT id, name, email, phone, password_hash, balance, bonus_balance, referral_code, total_earnings, referral_earnings, total_bets, won_bets, lost_bets, is_verified, created_at, last_login_at FROM users WHERE is_active = true AND ';
          let queryParams = [];
          if (credentials.email) {
            userQuery += 'email = $1';
            queryParams.push(credentials.email);
          } else if (credentials.phone) {
            userQuery += 'phone = $1';
            queryParams.push(credentials.phone);
          } else {
            throw new Error('Email ou telefone é obrigatório');
          }

          const userResult = await query(userQuery, queryParams);
          const user = userResult.rows[0];

          if (!user || !(await bcrypt.compare(credentials.password, user.password_hash))) {
            throw new Error('Email/telefone ou senha incorretos');
          }

          await query('UPDATE users SET last_login_at = NOW(), last_activity_at = NOW() WHERE id = $1', [user.id]);

          return { 
            id: user.id, 
            name: user.name, 
            email: user.email, 
            phone: user.phone,
            balance: user.balance, 
            bonus_balance: user.bonus_balance,
            referral_code: user.referral_code,
            total_earnings: user.total_earnings,
            referral_earnings: user.referral_earnings,
            total_bets: user.total_bets,
            won_bets: user.won_bets,
            lost_bets: user.lost_bets,
            is_verified: user.is_verified,
            created_at: user.created_at,
            last_login_at: user.last_login_at
          };
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.phone = user.phone;
        token.balance = user.balance;
        token.bonus_balance = user.bonus_balance;
        token.referral_code = user.referral_code;
        token.total_earnings = user.total_earnings;
        token.referral_earnings = user.referral_earnings;
        token.total_bets = user.total_bets;
        token.won_bets = user.won_bets;
        token.lost_bets = user.lost_bets;
        token.is_verified = user.is_verified;
        token.created_at = user.created_at;
        token.last_login_at = user.last_login_at;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.phone = token.phone as string;
        session.user.balance = token.balance as number;
        session.user.bonusBalance = token.bonus_balance as number;
        session.user.referralCode = token.referral_code as string;
        session.user.totalEarnings = token.total_earnings as number;
        session.user.referralEarnings = token.referral_earnings as number;
        session.user.totalBets = token.total_bets as number;
        session.user.wonBets = token.won_bets as number;
        session.user.lostBets = token.lost_bets as number;
        session.user.isVerified = token.is_verified as boolean;
        session.user.createdAt = token.created_at as string;
        session.user.lastLoginAt = token.last_login_at as string;
      }
      return session;
    },
  },
  pages: { signIn: '/auth' }, // Ajuste se necessário
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };