/**
 * Serviço para gerenciamento de usuários
 * Implementa Single Responsibility Principle (SRP)
 */

import type { IUserService } from "@/interfaces/admin-services"
import type { IUser } from "@/types/admin"

export class UserService implements IUserService {
  private users: IUser[] = [
    {
      id: "1",
      name: "João Silva",
      email: "joao@email.com",
      phone: "(11) 99999-9999",
      createdAt: "2025-01-15",
      balance: 150.5,
      deliveries: 2,
      bonuses: 3,
      withdrawals: 1,
      scratchGames: 25,
      status: "Ativo",
    },
    {
      id: "2",
      name: "Maria Santos",
      email: "maria@email.com",
      phone: "(11) 88888-8888",
      createdAt: "2025-01-14",
      balance: 89.0,
      deliveries: 1,
      bonuses: 1,
      withdrawals: 2,
      scratchGames: 18,
      status: "Ativo",
    },
    {
      id: "3",
      name: "Carlos Oliveira",
      email: "carlos@email.com",
      phone: "(11) 77777-7777",
      createdAt: "2025-01-13",
      balance: 0.0,
      deliveries: 0,
      bonuses: 0,
      withdrawals: 0,
      scratchGames: 5,
      status: "Inativo",
    },
    {
      id: "4",
      name: "Ana Costa",
      email: "ana@email.com",
      phone: "(11) 66666-6666",
      createdAt: "2025-01-12",
      balance: 275.25,
      deliveries: 3,
      bonuses: 5,
      withdrawals: 3,
      scratchGames: 42,
      status: "Ativo",
    },
    {
      id: "5",
      name: "Pedro Alves",
      email: "pedro@email.com",
      phone: "(11) 55555-5555",
      createdAt: "2025-01-11",
      balance: 45.75,
      deliveries: 1,
      bonuses: 2,
      withdrawals: 1,
      scratchGames: 12,
      status: "Ativo",
    },
  ]

  /**
   * Retorna todos os usuários
   */
  async getUsers(): Promise<IUser[]> {
    await this.simulateNetworkDelay(500)
    return [...this.users]
  }

  /**
   * Busca usuário por ID
   * @param id - ID do usuário
   */
  async getUserById(id: string): Promise<IUser | null> {
    await this.simulateNetworkDelay(300)
    return this.users.find((user) => user.id === id) || null
  }

  /**
   * Atualiza dados do usuário
   * @param id - ID do usuário
   * @param data - Dados para atualização
   */
  async updateUser(id: string, data: Partial<IUser>): Promise<boolean> {
    await this.simulateNetworkDelay(800)
    const userIndex = this.users.findIndex((user) => user.id === id)

    if (userIndex === -1) return false

    this.users[userIndex] = { ...this.users[userIndex], ...data }
    return true
  }

  /**
   * Remove usuário do sistema
   * @param id - ID do usuário
   */
  async deleteUser(id: string): Promise<boolean> {
    await this.simulateNetworkDelay(600)
    const userIndex = this.users.findIndex((user) => user.id === id)

    if (userIndex === -1) return false

    this.users.splice(userIndex, 1)
    return true
  }

  /**
   * Busca usuários por termo de pesquisa
   * @param term - Termo de busca
   */
  async searchUsers(term: string): Promise<IUser[]> {
    await this.simulateNetworkDelay(400)
    const searchTerm = term.toLowerCase()

    return this.users.filter(
      (user) => user.name.toLowerCase().includes(searchTerm) || user.email.toLowerCase().includes(searchTerm),
    )
  }

  /**
   * Filtra usuários por status
   * @param status - Status para filtrar
   */
  async filterUsersByStatus(status: string): Promise<IUser[]> {
    await this.simulateNetworkDelay(300)

    if (status === "all") return [...this.users]

    return this.users.filter((user) => user.status.toLowerCase() === status.toLowerCase())
  }

  /**
   * Simula delay de rede
   * @private
   */
  private async simulateNetworkDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
