import type { IAdminAuthService } from "@/interfaces/admin-services"
import type { IAdmin } from "@/types/admin"

export class AdminAuthService implements IAdminAuthService {
  private static instance: AdminAuthService
  private admin: IAdmin | null = null
  private readonly STORAGE_KEY = "admin_token"

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
      // Chama a API Next.js para autenticação
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Caso a autenticação seja bem-sucedida, cria o admin e salva o token
        this.admin = { 
          id: "admin-1", 
          name: "Administrador", 
          email: credentials.email, 
          role: "Super Admin", 
          createdAt: new Date().toISOString(),
        }
        this.saveAuthToken(data.token)  // Salva o token recebido da API
        return { success: true }
      }

      return { success: false, error: data.error || "Credenciais inválidas" }
    } catch (error) {
      console.error("Erro ao tentar fazer login:", error)
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
   * Salva token de autenticação no localStorage
   * @private
   */
  private saveAuthToken(token: string): void {
    localStorage.setItem(this.STORAGE_KEY, token)
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
