/**
 * Serviço para gerenciamento de bônus
 * Implementa Single Responsibility Principle (SRP)
 */

import type { IBonusService } from "@/interfaces/admin-services"
import type { IBonus } from "@/types/admin"

export class BonusService implements IBonusService {
  private bonuses: IBonus[] = [
    {
      id: "1",
      name: "Bônus de Boas-vindas",
      value: 50.0,
      minDeposit: 20.0,
      isActive: true,
      createdAt: "2025-01-15",
      usedCount: 125,
    },
    {
      id: "2",
      name: "Bônus de Recarga",
      value: 25.0,
      minDeposit: 50.0,
      isActive: true,
      createdAt: "2025-01-10",
      usedCount: 87,
    },
    {
      id: "3",
      name: "Bônus VIP",
      value: 100.0,
      minDeposit: 200.0,
      isActive: false,
      createdAt: "2025-01-08",
      usedCount: 15,
    },
    {
      id: "4",
      name: "Bônus Fim de Semana",
      value: 30.0,
      minDeposit: 0.0,
      isActive: true,
      createdAt: "2025-01-05",
      usedCount: 203,
    },
  ]

  /**
   * Retorna todos os bônus
   */
  async getBonuses(): Promise<IBonus[]> {
    await this.simulateNetworkDelay(500)
    return [...this.bonuses]
  }

  /**
   * Cria um novo bônus
   * @param bonus - Dados do bônus (sem ID, createdAt e usedCount)
   */
  async createBonus(bonus: Omit<IBonus, "id" | "createdAt" | "usedCount">): Promise<boolean> {
    await this.simulateNetworkDelay(800)

    const newBonus: IBonus = {
      ...bonus,
      id: this.generateBonusId(),
      createdAt: new Date().toISOString().split("T")[0],
      usedCount: 0,
    }

    this.bonuses.push(newBonus)
    return true
  }

  /**
   * Atualiza um bônus existente
   * @param id - ID do bônus
   * @param data - Dados para atualização
   */
  async updateBonus(id: string, data: Partial<IBonus>): Promise<boolean> {
    await this.simulateNetworkDelay(700)
    const bonusIndex = this.bonuses.findIndex((bonus) => bonus.id === id)

    if (bonusIndex === -1) return false

    this.bonuses[bonusIndex] = { ...this.bonuses[bonusIndex], ...data }
    return true
  }

  /**
   * Remove um bônus
   * @param id - ID do bônus
   */
  async deleteBonus(id: string): Promise<boolean> {
    await this.simulateNetworkDelay(600)
    const bonusIndex = this.bonuses.findIndex((bonus) => bonus.id === id)

    if (bonusIndex === -1) return false

    this.bonuses.splice(bonusIndex, 1)
    return true
  }

  /**
   * Alterna o status ativo/inativo de um bônus
   * @param id - ID do bônus
   */
  async toggleBonusStatus(id: string): Promise<boolean> {
    await this.simulateNetworkDelay(500)
    const bonus = this.bonuses.find((b) => b.id === id)

    if (!bonus) return false

    bonus.isActive = !bonus.isActive
    return true
  }

  /**
   * Gera um ID único para novo bônus
   * @private
   */
  private generateBonusId(): string {
    const maxId = Math.max(...this.bonuses.map((b) => Number.parseInt(b.id)), 0)
    return (maxId + 1).toString()
  }

  /**
   * Simula delay de rede
   * @private
   */
  private async simulateNetworkDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
