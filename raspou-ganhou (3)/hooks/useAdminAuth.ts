/**
 * Hook refatorado para autenticação de administradores
 * Utiliza o ServiceFactory para injeção de dependência
 */

"use client"

import { useState, useEffect } from "react"
import { ServiceFactory } from "@/factories/service.factory"
import type { IAdmin } from "@/types/admin"
import type { IAdminAuthService } from "@/interfaces/admin-services"

interface AdminAuthState {
  isAuthenticated: boolean
  admin: IAdmin | null
  isLoading: boolean
}

/**
 * Hook personalizado para gerenciar autenticação de administradores
 * Implementa Single Responsibility Principle (SRP)
 */
export function useAdminAuth() {
  const [authState, setAuthState] = useState<AdminAuthState>({
    isAuthenticated: false,
    admin: null,
    isLoading: true,
  })

  // Injeta dependência do serviço de autenticação
  const authService: IAdminAuthService = ServiceFactory.getAdminAuthService()

  useEffect(() => {
    // Verifica autenticação inicial
    initializeAuth()
  }, [])

  /**
   * Inicializa o estado de autenticação
   */
  const initializeAuth = async (): Promise<void> => {
    try {
      const isAuthenticated = authService.isAuthenticated()
      const admin = authService.getCurrentAdmin()

      setAuthState({
        isAuthenticated,
        admin,
        isLoading: false,
      })
    } catch (error) {
      console.error("Erro ao inicializar autenticação:", error)
      setAuthState({
        isAuthenticated: false,
        admin: null,
        isLoading: false,
      })
    }
  }

  /**
   * Realiza login do administrador
   */
  const login = async (credentials: { email: string; password: string }) => {
    setAuthState((prev) => ({ ...prev, isLoading: true }))

    try {
      const result = await authService.login(credentials)

      if (result.success) {
        const admin = authService.getCurrentAdmin()
        setAuthState({
          isAuthenticated: true,
          admin,
          isLoading: false,
        })
      } else {
        setAuthState((prev) => ({ ...prev, isLoading: false }))
      }

      return result
    } catch (error) {
      setAuthState((prev) => ({ ...prev, isLoading: false }))
      return { success: false, error: "Erro interno do servidor" }
    }
  }

  /**
   * Realiza logout do administrador
   */
  const logout = (): void => {
    authService.logout()
    setAuthState({
      isAuthenticated: false,
      admin: null,
      isLoading: false,
    })
  }

  return {
    ...authState,
    login,
    logout,
  }
}
