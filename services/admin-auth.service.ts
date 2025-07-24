/**
 * Serviço de autenticação para administradores
 * Implementa Single Responsibility Principle (SRP)
 */

import type { IAdminAuthService } from "@/interfaces/admin-services"
import type { IAdmin } from "@/types/admin"

export class AdminAuthService implements IAdminAuthService {
  private static instance: AdminAuthService
  private admin: IAdmin | null = null
  private readonly STORAGE_KEY = "admin_token"
  private readonly DEV_CREDENTIALS = {
    email: "admin@raspouganhou.com",
    password: "admin123",
  }

  // Implementa Singleton pattern para garantir uma única instância
  public static getInstance(): AdminAuthService {
    if (!AdminAuthService.instance) {
      AdminAuthService.instance = new AdminAuthService()
    }
    return AdminAuthService.instance
  }

  /**
   * Realiza login do administrador
   * @param credentials - Credenciais de acesso
   * @returns Promise com resultado da autenticação
   */
  async login(credentials: { email: string; password: string }): Promise<{ success: boolean; error?: string }> {
    try {
      // Simula delay de rede
      await this.simulateNetworkDelay(1500)

      // Valida credenciais de desenvolvimento
      if (this.validateCredentials(credentials)) {
        this.admin = this.createAdminFromCredentials(credentials)
        this.saveAuthToken()
        return { success: true }
      }

      return { success: false, error: "Credenciais inválidas" }
    } catch (error) {
      return { success: false, error: "Erro interno do servidor" }
    }
  }

  /**
   * Realiza logout do administrador
   */
  logout(): void {
    this.admin = null
    this.clearAuthToken()
  }

  /**
   * Retorna o administrador atual
   */
  getCurrentAdmin(): IAdmin | null {
    return this.admin
  }

  /**
   * Verifica se há um administrador autenticado
   */
  isAuthenticated(): boolean {
    return this.admin !== null || this.hasValidToken()
  }

  /**
   * Valida as credenciais fornecidas
   * @private
   */
  private validateCredentials(credentials: { email: string; password: string }): boolean {
    return credentials.email === this.DEV_CREDENTIALS.email && credentials.password === this.DEV_CREDENTIALS.password
  }

  /**
   * Cria objeto admin a partir das credenciais
   * @private
   */
  private createAdminFromCredentials(credentials: { email: string; password: string }): IAdmin {
    return {
      id: "admin-1",
      name: "Administrador",
      email: credentials.email,
      role: "Super Admin",
      createdAt: new Date().toISOString(),
    }
  }

  /**
   * Salva token de autenticação no localStorage
   * @private
   */
  private saveAuthToken(): void {
    localStorage.setItem(this.STORAGE_KEY, "fake-admin-token")
  }

  /**
   * Remove token de autenticação do localStorage
   * @private
   */
  private clearAuthToken(): void {
    localStorage.removeItem(this.STORAGE_KEY)
  }

  /**
   * Verifica se existe token válido
   * @private
   */
  private hasValidToken(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) !== null
  }

  /**
   * Simula delay de rede para operações assíncronas
   * @private
   */
  private async simulateNetworkDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
