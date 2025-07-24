/**
 * Serviço para gerenciamento de transações
 * Implementa Single Responsibility Principle (SRP)
 */

import type { ITransactionService } from "@/interfaces/admin-services"
import type { ITransaction } from "@/types/admin"

export class TransactionService implements ITransactionService {
  private transactions: ITransaction[] = [
    {
      id: "TXN-001",
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
      id: "TXN-002",
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
      id: "TXN-003",
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
      id: "TXN-004",
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
    {
      id: "TXN-005",
      userId: "5",
      userName: "Pedro Alves",
      type: "deposit",
      amount: 200.0,
      status: "failed",
      method: "PIX",
      date: "2025-01-18 10:05:00",
      reference: "PIX-MNO345",
      createdAt: "2025-01-18T10:05:00Z",
    },
  ]

  /**
   * Retorna todas as transações
   */
  async getTransactions(): Promise<ITransaction[]> {
    await this.simulateNetworkDelay(600)
    return [...this.transactions]
  }

  /**
   * Busca transação por ID
   * @param id - ID da transação
   */
  async getTransactionById(id: string): Promise<ITransaction | null> {
    await this.simulateNetworkDelay(300)
    return this.transactions.find((transaction) => transaction.id === id) || null
  }

  /**
   * Aprova uma transação pendente
   * @param id - ID da transação
   */
  async approveTransaction(id: string): Promise<boolean> {
    await this.simulateNetworkDelay(1000)
    const transaction = this.transactions.find((t) => t.id === id)

    if (!transaction || transaction.status !== "pending") return false

    transaction.status = "completed"
    return true
  }

  /**
   * Rejeita uma transação pendente
   * @param id - ID da transação
   */
  async rejectTransaction(id: string): Promise<boolean> {
    await this.simulateNetworkDelay(800)
    const transaction = this.transactions.find((t) => t.id === id)

    if (!transaction || transaction.status !== "pending") return false

    transaction.status = "failed"
    return true
  }

  /**
   * Filtra transações com base nos critérios fornecidos
   * @param filters - Filtros para aplicar
   */
  async filterTransactions(filters: {
    type?: string
    status?: string
    searchTerm?: string
  }): Promise<ITransaction[]> {
    await this.simulateNetworkDelay(400)

    let filtered = [...this.transactions]

    // Filtro por tipo
    if (filters.type && filters.type !== "all") {
      filtered = filtered.filter((t) => t.type === filters.type)
    }

    // Filtro por status
    if (filters.status && filters.status !== "all") {
      filtered = filtered.filter((t) => t.status === filters.status)
    }

    // Filtro por termo de busca
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(
        (t) => t.userName.toLowerCase().includes(searchTerm) || t.reference.toLowerCase().includes(searchTerm),
      )
    }

    return filtered
  }

  /**
   * Simula delay de rede
   * @private
   */
  private async simulateNetworkDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
