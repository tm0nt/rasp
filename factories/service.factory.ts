/**
 * Factory para criação de serviços
 * Implementa Factory Pattern e Dependency Inversion Principle (DIP)
 */

import { AdminAuthService } from "@/services/admin-auth.service"
import { UserService } from "@/services/user.service"
import { TransactionService } from "@/services/transaction.service"
import { BonusService } from "@/services/bonus.service"
import { DashboardService } from "@/services/dashboard.service"

import type {
  IAdminAuthService,
  IUserService,
  ITransactionService,
  IBonusService,
  IDashboardService,
} from "@/interfaces/admin-services"

/**
 * Factory responsável por criar e fornecer instâncias dos serviços
 * Centraliza a criação de dependências seguindo o padrão Singleton
 */
export class ServiceFactory {
  private static adminAuthService: IAdminAuthService | null = null
  private static userService: IUserService | null = null
  private static transactionService: ITransactionService | null = null
  private static bonusService: IBonusService | null = null
  private static dashboardService: IDashboardService | null = null

  /**
   * Retorna instância do serviço de autenticação
   */
  static getAdminAuthService(): IAdminAuthService {
    if (!this.adminAuthService) {
      this.adminAuthService = AdminAuthService.getInstance()
    }
    return this.adminAuthService
  }

  /**
   * Retorna instância do serviço de usuários
   */
  static getUserService(): IUserService {
    if (!this.userService) {
      this.userService = new UserService()
    }
    return this.userService
  }

  /**
   * Retorna instância do serviço de transações
   */
  static getTransactionService(): ITransactionService {
    if (!this.transactionService) {
      this.transactionService = new TransactionService()
    }
    return this.transactionService
  }

  /**
   * Retorna instância do serviço de bônus
   */
  static getBonusService(): IBonusService {
    if (!this.bonusService) {
      this.bonusService = new BonusService()
    }
    return this.bonusService
  }

  /**
   * Retorna instância do serviço de dashboard
   */
  static getDashboardService(): IDashboardService {
    if (!this.dashboardService) {
      this.dashboardService = new DashboardService()
    }
    return this.dashboardService
  }

  /**
   * Limpa todas as instâncias (útil para testes)
   */
  static clearInstances(): void {
    this.adminAuthService = null
    this.userService = null
    this.transactionService = null
    this.bonusService = null
    this.dashboardService = null
  }
}
