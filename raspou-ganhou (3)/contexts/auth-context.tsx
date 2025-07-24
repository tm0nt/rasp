"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useToast } from "./toast-context"

export interface User {
  id: string
  name: string
  email: string
  phone: string
  balance: number
  avatar?: string
  referralCode: string
  totalEarnings: number
  referralEarnings: number
  bonusBalance: number
  isVerified: boolean
  createdAt: string
  totalBets: number
  wonBets: number
  lostBets: number
  lastLoginAt: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (formData: any, isRegister?: boolean) => Promise<{ success: boolean; error?: string; user?: User }>
  logout: () => Promise<void>
  updateBalance: (
    amount: number,
    type: "add" | "subtract",
  ) => Promise<{ success: boolean; newBalance?: number; error?: string }>
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; user?: User; error?: string }>
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { showToast } = useToast()

  // Função para fazer requisições autenticadas
  const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
    let token = localStorage.getItem("auth-token")

    if (!token) {
      throw new Error("Token não encontrado")
    }

    const makeRequest = async (authToken: string) => {
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      })
    }

    let response = await makeRequest(token)

    // Se o token expirou, tenta renovar
    if (response.status === 401 && !isRefreshing) {
      const refreshed = await refreshAccessToken()
      if (refreshed) {
        token = localStorage.getItem("auth-token")
        if (token) {
          response = await makeRequest(token)
        }
      }
    }

    return response
  }

  // Função para renovar o token de acesso
  const refreshAccessToken = async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem("refresh-token")
    if (!refreshToken || isRefreshing) {
      return false
    }

    try {
      setIsRefreshing(true)
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      })

      if (response.ok) {
        const result = await response.json()

        // Atualiza os tokens
        localStorage.setItem("auth-token", result.token)
        if (result.refreshToken) {
          localStorage.setItem("refresh-token", result.refreshToken)
        }

        // Atualiza os dados do usuário
        setUser(result.user)
        setIsAuthenticated(true)
        localStorage.setItem("raspou-user", JSON.stringify(result.user))

        return true
      } else {
        // Refresh token inválido, desloga o usuário
        await logout()
        return false
      }
    } catch (error) {
      console.error("Erro ao renovar token:", error)
      await logout()
      return false
    } finally {
      setIsRefreshing(false)
    }
  }

  // Função para validar a sessão atual
  const validateSession = async (): Promise<boolean> => {
    const token = localStorage.getItem("auth-token")
    if (!token) {
      return false
    }

    try {
      const response = await fetch("/api/auth/validate", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const result = await response.json()
        setUser(result.user)
        setIsAuthenticated(true)
        localStorage.setItem("raspou-user", JSON.stringify(result.user))
        return true
      } else if (response.status === 401) {
        // Token expirado, tenta renovar
        return await refreshAccessToken()
      } else {
        await logout()
        return false
      }
    } catch (error) {
      console.error("Erro ao validar sessão:", error)
      // Tenta renovar o token em caso de erro de rede
      return await refreshAccessToken()
    }
  }

  // Inicializa o estado de autenticação
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem("auth-token")
        const refreshToken = localStorage.getItem("refresh-token")
        const storedUser = localStorage.getItem("raspou-user")

        if (token || refreshToken) {
          // Se há um usuário armazenado, carrega imediatamente para evitar flash
          if (storedUser) {
            try {
              const userData = JSON.parse(storedUser)
              setUser(userData)
              setIsAuthenticated(true)
            } catch (error) {
              console.error("Erro ao parsear dados do usuário:", error)
            }
          }

          // Valida a sessão no servidor
          await validateSession()
        }
      } catch (error) {
        console.error("Erro ao inicializar autenticação:", error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  // Configura renovação automática do token
  useEffect(() => {
    if (!isAuthenticated || isRefreshing) return

    // Renova o token a cada 10 minutos (tokens expiram em 15 minutos)
    const refreshInterval = setInterval(
      () => {
        refreshAccessToken()
      },
      10 * 60 * 1000,
    )

    return () => clearInterval(refreshInterval)
  }, [isAuthenticated, isRefreshing])

  // Função de login
  const login = async (formData: any, isRegister = false) => {
    try {
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login"

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        const userData = result.user
        setUser(userData)
        setIsAuthenticated(true)

        // Armazena os tokens
        localStorage.setItem("auth-token", result.token)
        if (result.refreshToken) {
          localStorage.setItem("refresh-token", result.refreshToken)
        }

        // Armazena preferência de lembrar
        localStorage.setItem("remember-me", formData.rememberMe ? "true" : "false")

        // Armazena dados do usuário
        localStorage.setItem("raspou-user", JSON.stringify(userData))

        showToast({
          type: "success",
          title: isRegister ? "✅ Conta criada com sucesso!" : "✅ Login realizado!",
          message: isRegister
            ? `Bem-vindo(a), ${userData.name}! Você ganhou R$ 10,00 de bônus de boas-vindas.`
            : `Bem-vindo(a) de volta, ${userData.name}! Seu saldo atual é R$ ${userData.balance.toFixed(2)}.`,
          duration: 8000,
        })

        return { success: true, user: userData }
      } else {
        showToast({
          type: "error",
          title: isRegister ? "❌ Erro no cadastro" : "❌ Erro no login",
          message: result.message || "Erro ao processar solicitação",
          duration: 6000,
        })

        return { success: false, error: result.message }
      }
    } catch (error) {
      console.error("Erro de autenticação:", error)

      showToast({
        type: "error",
        title: "🌐 Erro de conexão",
        message: "Não foi possível conectar ao servidor. Tente novamente.",
        duration: 6000,
      })

      return { success: false, error: "Erro de conexão. Tente novamente." }
    }
  }

  // Função de logout
  const logout = async () => {
    try {
      const token = localStorage.getItem("auth-token")
      const refreshToken = localStorage.getItem("refresh-token")

      // Chama a API de logout para invalidar tokens no servidor
      if (token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
        })
      }
    } catch (error) {
      console.error("Erro no logout:", error)
    } finally {
      // Limpa todos os dados armazenados
      setUser(null)
      setIsAuthenticated(false)
      localStorage.removeItem("raspou-user")
      localStorage.removeItem("auth-token")
      localStorage.removeItem("refresh-token")
      localStorage.removeItem("remember-me")

      showToast({
        type: "info",
        title: "👋 Logout realizado",
        message: "Você foi desconectado com sucesso. Até logo!",
        duration: 5000,
      })
    }
  }

  // Função para atualizar saldo
  const updateBalance = async (amount: number, type: "add" | "subtract" = "add") => {
    if (user) {
      try {
        const response = await makeAuthenticatedRequest("/api/user/balance", {
          method: "PUT",
          body: JSON.stringify({ amount, type }),
        })

        const result = await response.json()
        if (response.ok) {
          const updatedUser = { ...user, balance: result.newBalance }
          setUser(updatedUser)
          localStorage.setItem("raspou-user", JSON.stringify(updatedUser))
          return { success: true, newBalance: result.newBalance }
        } else {
          throw new Error(result.message)
        }
      } catch (error) {
        console.error("Erro ao atualizar saldo:", error)
        return { success: false, error: error.message }
      }
    }
    return { success: false, error: "Usuário não encontrado" }
  }

  // Função para atualizar perfil
  const updateProfile = async (updates: Partial<User>) => {
    if (user) {
      try {
        const response = await makeAuthenticatedRequest("/api/user/profile", {
          method: "PUT",
          body: JSON.stringify(updates),
        })

        const result = await response.json()
        if (response.ok) {
          const updatedUser = { ...user, ...result.user }
          setUser(updatedUser)
          localStorage.setItem("raspou-user", JSON.stringify(updatedUser))

          showToast({
            type: "success",
            title: "✅ Perfil atualizado",
            message: "Suas informações foram atualizadas com sucesso!",
            duration: 5000,
          })

          return { success: true, user: result.user }
        } else {
          throw new Error(result.message)
        }
      } catch (error) {
        console.error("Erro ao atualizar perfil:", error)

        showToast({
          type: "error",
          title: "❌ Erro na atualização",
          message: "Não foi possível atualizar seu perfil. Tente novamente.",
          duration: 5000,
        })

        return { success: false, error: error.message }
      }
    }
    return { success: false, error: "Usuário não encontrado" }
  }

  // Função para solicitar redefinição de senha
  const requestPasswordReset = async (email: string) => {
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()
      if (response.ok) {
        showToast({
          type: "success",
          title: "✅ Solicitação enviada",
          message: "Um email foi enviado para você com as instruções para redefinir sua senha.",
          duration: 8000,
        })
        return { success: true }
      } else {
        showToast({
          type: "error",
          title: "❌ Erro na solicitação",
          message: result.message || "Erro ao solicitar redefinição de senha",
          duration: 6000,
        })
        return { success: false, error: result.message }
      }
    } catch (error) {
      console.error("Erro ao solicitar redefinição de senha:", error)

      showToast({
        type: "error",
        title: "🌐 Erro de conexão",
        message: "Não foi possível conectar ao servidor. Tente novamente.",
        duration: 6000,
      })

      return { success: false, error: "Erro de conexão. Tente novamente." }
    }
  }

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateBalance,
    updateProfile,
    requestPasswordReset,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider")
  }
  return context
}
