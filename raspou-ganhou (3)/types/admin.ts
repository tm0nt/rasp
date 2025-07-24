/**
 * Interfaces e tipos para o sistema administrativo
 * Seguindo o princípio de Interface Segregation (ISP)
 */

// Interface base para entidades com ID
export interface BaseEntity {
  id: string
  createdAt: string
}

// Interface para administrador
export interface IAdmin extends BaseEntity {
  name: string
  email: string
  role: string
}

// Interface para usuário do sistema
export interface IUser extends BaseEntity {
  name: string
  email: string
  phone: string
  balance: number
  deliveries: number
  bonuses: number
  withdrawals: number
  scratchGames: number
  status: "Ativo" | "Inativo"
}

// Interface para transações
export interface ITransaction extends BaseEntity {
  userId: string
  userName: string
  type: "deposit" | "withdrawal"
  amount: number
  status: "completed" | "pending" | "processing" | "failed"
  method: string
  date: string
  reference: string
}

// Interface para bônus
export interface IBonus extends BaseEntity {
  name: string
  value: number
  minDeposit: number
  isActive: boolean
  usedCount: number
}

// Interface para afiliados
export interface IAffiliate extends BaseEntity {
  name: string
  email: string
  referrals: number
  totalEarned: number
  pendingEarned: number
  joinDate: string
  status: string
}

// Interface para configurações do gateway
export interface IGatewayConfig {
  publicToken: string
  privateToken: string
  webhookUrl: string
  environment: "sandbox" | "production"
}

// Interface para configurações do site
export interface ISiteConfig {
  siteName: string
  siteUrl: string
  siteDescription: string
  logo: string
  favicon: string
  supportEmail: string
  supportPhone: string
}

// Interface para configurações de SEO
export interface ISEOConfig {
  metaTitle: string
  metaDescription: string
  metaKeywords: string
  googleAnalyticsId: string
  facebookPixelId: string
}
