/**
 * Serviço para estatísticas do dashboard
 * Implementa Single Responsibility Principle (SRP)
 */

import type { IDashboardService } from "@/interfaces/admin-services"
import type { ITransaction, IUser } from "@/types/admin"

export class DashboardService implements IDashboardService {
  /**
   * Retorna estatísticas gerais do sistema
   */
  async getOverviewStats(): Promise<{
    totalDeposits: number
    paidDeposits: number
    totalWithdrawals: number
    paidWithdrawals: number
    totalUsers: number
    activeUsers: number
    pendingTransactions: number
    completedTransactions: number
  }> {
    await this.simulateNetworkDelay(800)

    // Em produção, estes dados viriam de consultas ao banco de dados
    return {
      totalDeposits: 125000.5,
      paidDeposits: 120000.0,
      totalWithdrawals: 85000.25,
      paidWithdrawals: 82000.0,
      totalUsers: 1247,
      activeUsers: 892,
      pendingTransactions: 15,
      completedTransactions: 2847,
    }
  }

  /**
   * Retorna as transações mais recentes
   */
  async getRecentTransactions(): Promise<ITransaction[]> {
    await this.simulateNetworkDelay(600)

    // Dados simulados das últimas transações
    return [
      {
        id: "TXN-RECENT-001",
        userId: "1",
        userName: "João Silva",
        type: "deposit",
        amount: 50.0,
        status: "completed",
        method: "PIX",
        date: "2025-01-18 14:30:00",
        reference: "PIX-ABC123",
        createdAt: "2025-01-18T14:30:00Z",
      },
      {
        id: "TXN-RECENT-002",
        userId: "2",
        userName: "Maria Santos",
        type: "withdrawal",
        amount: 100.0,
        status: "pending",
        method: "PIX",
        date: "2025-01-18 13:15:00",
        reference: "SAQ-DEF456",
        createdAt: "2025-01-18T13:15:00Z",
      },
      {
        id: "TXN-RECENT-003",
        userId: "3",
        userName: "Carlos Oliveira",
        type: "deposit",
        amount: 25.0,
        status: "completed",
        method: "Cartão de Crédito",
        date: "2025-01-18 12:45:00",
        reference: "CC-GHI789",
        createdAt: "2025-01-18T12:45:00Z",
      },
      {
        id: "TXN-RECENT-004",
        userId: "4",
        userName: "Ana Costa",
        type: "withdrawal",
        amount: 75.0,
        status: "processing",
        method: "PIX",
        date: "2025-01-18 11:20:00",
        reference: "SAQ-JKL012",
        createdAt: "2025-01-18T11:20:00Z",
      },
    ]
  }

  /**
   * Retorna os usuários mais recentes
   */
  async getNewUsers(): Promise<IUser[]> {
    await this.simulateNetworkDelay(500)

    // Dados simulados dos novos usuários
    return [
      {
        id: "NEW-001",
        name: "Pedro Alves",
        email: "pedro@email.com",
        phone: "(11) 55555-5555",
        createdAt: "2025-01-18",
        balance: 0,
        deliveries: 0,
        bonuses: 0,
        withdrawals: 0,
        scratchGames: 0,
        status: "Ativo",
      },
      {
        id: "NEW-002",
        name: "Lucia Ferreira",
        email: "lucia@email.com",
        phone: "(11) 44444-4444",
        createdAt: "2025-01-17",
        balance: 25.0,
        deliveries: 0,
        bonuses: 1,
        withdrawals: 0,
        scratchGames: 3,
        status: "Ativo",
      },
      {
        id: "NEW-003",
        name: "Roberto Lima",
        email: "roberto@email.com",
        phone: "(11) 33333-3333",
        createdAt: "2025-01-16",
        balance: 50.0,
        deliveries: 0,
        bonuses: 1,
        withdrawals: 0,
        scratchGames: 8,
        status: "Ativo",
      },
      {
        id: "NEW-004",
        name: "Carmen Souza",
        email: "carmen@email.com",
        phone: "(11) 22222-2222",
        createdAt: "2025-01-15",
        balance: 75.0,
        deliveries: 1,
        bonuses: 2,
        withdrawals: 0,
        scratchGames: 12,
        status: "Ativo",
      },
    ]
  }

  /**
   * Simula delay de rede
   * @private
   */
  private async simulateNetworkDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
