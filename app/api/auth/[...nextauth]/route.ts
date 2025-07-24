import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { customAdapter } from '@/lib/authAdapter';
import { cookies } from "next/headers";

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
        action: { label: 'Action', type: 'text' },
      },
      async authorize(credentials, req) {
        if (!credentials?.password) {
          throw new Error('Senha é obrigatória');
        }

        if (credentials.action === 'register') {
          // Enhanced registration validation
          if (!credentials.name || credentials.name.length < 2) {
            throw new Error('Nome deve ter pelo menos 2 caracteres');
          }
          if (!credentials.phone || credentials.phone.length < 10) {
            throw new Error('Telefone deve ter pelo menos 10 dígitos');
          }
          if (!credentials.email || !/^\S+@\S+\.\S+$/.test(credentials.email)) {
            throw new Error('Email inválido');
          }
          if (credentials.password.length < 6) {
            throw new Error('Senha deve ter pelo menos 6 caracteres');
          }

          // Check for existing email or phone
          const existingUser = await query(
            `SELECT 
              CASE WHEN email = $1 THEN 'email' 
                   WHEN phone = $2 THEN 'phone' 
              END as conflict_type 
              FROM users WHERE email = $1 OR phone = $2 LIMIT 1`,
            [credentials.email, credentials.phone]
          );

          if (existingUser.rows.length > 0) {
            const conflictType = existingUser.rows[0].conflict_type;
            if (conflictType === 'email') {
              throw new Error('Este email já está cadastrado');
            } else {
              throw new Error('Este telefone já está cadastrado');
            }
          }

          // Proceed with registration
          const passwordHash = await bcrypt.hash(credentials.password, 10);
          const id = crypto.randomUUID();
          const referralCode = credentials.referralCode || generateReferralCode();
          const createdAt = new Date();
          const cookiesReffer = await cookies();
          
          let referred_by = null;
          const referralCookie = cookiesReffer.get('referral_code')?.value;
          if (referralCookie) {
            const referrerResult = await query(
              'SELECT id FROM users WHERE referral_code = $1', 
              [referralCookie]
            );
            referred_by = referrerResult.rows[0]?.id || null;
          }

          await query(
            `INSERT INTO users (
              id, name, phone, email, password_hash, referral_code, referred_by, 
              balance, bonus_balance, total_earnings, referral_earnings, 
              total_bets, won_bets, lost_bets, is_active, is_verified, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
            [
              id, credentials.name, credentials.phone, credentials.email, passwordHash, 
              referralCode, referred_by, 0, 10.00, 0, 0, 0, 0, 0, true, false, 
              createdAt, createdAt
            ]
          );

          return { 
            id, 
            name: credentials.name, 
            email: credentials.email, 
            phone: credentials.phone, 
            balance: 0, 
            bonus_balance: 10.00,
            referral_code: referralCode
          };
        } else {
          // Login logic
          if (!credentials.email && !credentials.phone) {
            throw new Error('Email ou telefone é obrigatório');
          }

          const userFields = `
            id, name, email, phone, password_hash, balance, bonus_balance, 
            referral_code, total_earnings, referral_earnings, total_bets, 
            won_bets, lost_bets, is_verified, created_at, last_login_at
          `;

          // Build dynamic query based on provided credentials
          let queryText;
          let queryParams;
          
          if (credentials.phone && credentials.email) {
            queryText = `SELECT ${userFields} FROM users WHERE is_active = true AND (phone = $1 OR email = $2)`;
            queryParams = [credentials.phone, credentials.email];
          } else if (credentials.phone) {
            queryText = `SELECT ${userFields} FROM users WHERE is_active = true AND phone = $1`;
            queryParams = [credentials.phone];
          } else {
            queryText = `SELECT ${userFields} FROM users WHERE is_active = true AND email = $1`;
            queryParams = [credentials.email];
          }

          const userResult = await query(queryText, queryParams);
          const user = userResult.rows[0];

          if (!user) {
            throw new Error('Credenciais incorretas');
          }

          const passwordMatch = await bcrypt.compare(credentials.password, user.password_hash);
          if (!passwordMatch) {
            throw new Error('Credenciais incorretas');
          }

          // Get referral count
          const referralCountResult = await query(
            `SELECT COUNT(*) as total_referrals FROM users WHERE referred_by = $1`,
            [user.id]
          );
          const total_referrals = referralCountResult.rows[0]?.total_referrals || 0;
                    console.log('Total referrals:', total_referrals);

                                        console.log('Total referrals:', referralCountResult);


          // Get affiliate settings
          const settingsResult = await query(
            `SELECT 
              (SELECT value FROM system_settings WHERE key = 'affiliate_min_deposit') as min_deposit,
              (SELECT value FROM system_settings WHERE key = 'affiliate_cpa_value') as cpa_value`
          );

          const affiliateSettings = {
            min_deposit: parseFloat(settingsResult.rows[0]?.min_deposit || '0'),
            cpa_value: parseFloat(settingsResult.rows[0]?.cpa_value || '0')
          };

          // Update last login
          await query(
            'UPDATE users SET last_login_at = NOW(), last_activity_at = NOW() WHERE id = $1',
            [user.id]
          );

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
            last_login_at: user.last_login_at,
            total_referrals: Number(total_referrals),
            affiliate_settings: affiliateSettings
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
        token.total_referrals = user.total_referrals;
        token.affiliate_settings = user.affiliate_settings;
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
        session.user.totalReferrals = token.total_referrals as number;
        session.user.affiliateSettings = token.affiliate_settings as {
          min_deposit: number;
          cpa_value: number;
        };
      }
      return session;
    },
  },
  pages: { signIn: '/auth' },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };