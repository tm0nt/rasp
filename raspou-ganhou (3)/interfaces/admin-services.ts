/**
 * Interfaces para serviços administrativos
 * Seguindo o princípio de Dependency Inversion (DIP)
 */

import type {
  IAdmin,
  IUser,
  ITransaction,
  IBonus,
  IAffiliate,
  IGatewayConfig,
  ISiteConfig,
  ISEOConfig,
} from "@/types/admin"

// Interface para autenticação de administradores
export interface IAdminAuthService {
  login(credentials: { email: string; password: string }): Promise<{ success: boolean; error?: string }>
  logout(): void
  getCurrentAdmin(): IAdmin | null
  isAuthenticated(): boolean
}

// Interface para gerenciamento de usuários
export interface IUserService {
  getUsers(): Promise<IUser[]>
  getUserById(id: string): Promise<IUser | null>
  updateUser(id: string, data: Partial<IUser>): Promise<boolean>
  deleteUser(id: string): Promise<boolean>
  searchUsers(term: string): Promise<IUser[]>
  filterUsersByStatus(status: string): Promise<IUser[]>
}

// Interface para gerenciamento de transações
export interface ITransactionService {
  getTransactions(): Promise<ITransaction[]>
  getTransactionById(id: string): Promise<ITransaction | null>
  approveTransaction(id: string): Promise<boolean>
  rejectTransaction(id: string): Promise<boolean>
  filterTransactions(filters: { type?: string; status?: string; searchTerm?: string }): Promise<ITransaction[]>
}

// Interface para gerenciamento de bônus
export interface IBonusService {
  getBonuses(): Promise<IBonus[]>
  createBonus(bonus: Omit<IBonus, "id" | "createdAt" | "usedCount">): Promise<boolean>
  updateBonus(id: string, data: Partial<IBonus>): Promise<boolean>
  deleteBonus(id: string): Promise<boolean>
  toggleBonusStatus(id: string): Promise<boolean>
}

// Interface para gerenciamento de afiliados
export interface IAffiliateService {
  getAffiliates(): Promise<IAffiliate[]>
  payAffiliate(id: string): Promise<boolean>
  updateAffiliateSettings(settings: { minDeposit: number; cpaValue: number }): Promise<boolean>
  getAffiliateStats(): Promise<{
    totalAffiliates: number
    totalReferrals: number
    totalEarned: number
    totalPending: number
  }>
}

// Interface para configurações do gateway
export interface IGatewayService {
  getConfig(): Promise<IGatewayConfig>
  updateConfig(config: IGatewayConfig): Promise<boolean>
  testConnection(): Promise<{ success: boolean; message: string }>
}

// Interface para configurações gerais
export interface ISettingsService {
  getSiteConfig(): Promise<ISiteConfig>
  updateSiteConfig(config: ISiteConfig): Promise<boolean>
  getSEOConfig(): Promise<ISEOConfig>
  updateSEOConfig(config: ISEOConfig): Promise<boolean>
  uploadFile(file: File, type: "logo" | "favicon"): Promise<string>
  toggleMaintenanceMode(enabled: boolean): Promise<boolean>
}

// Interface para estatísticas do dashboard
export interface IDashboardService {
  getOverviewStats(): Promise<{
    totalDeposits: number
    paidDeposits: number
    totalWithdrawals: number
    paidWithdrawals: number
    totalUsers: number
    activeUsers: number
    pendingTransactions: number
    completedTransactions: number
  }>
  getRecentTransactions(): Promise<ITransaction[]>
  getNewUsers(): Promise<IUser[]>
}
