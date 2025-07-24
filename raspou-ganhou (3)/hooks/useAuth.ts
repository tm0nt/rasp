"use client"

import { useAuth as useAuthContext } from "@/contexts/auth-context"

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

interface BetResult {
  id: string
  userId: string
  categoryId: number
  amount: number
  result: "win" | "lose"
  prize?: string
  prizeValue?: number
  createdAt: string
}

/**
 * Authentication hook with complete persistence and session management
 */
export function useAuth() {
  const authContext = useAuthContext()

  /**
   * Make authenticated API request with automatic token refresh
   */
  const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
    let token = localStorage.getItem("auth-token")

    if (!token) {
      throw new Error("No authentication token available")
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

    // If token expired, try to refresh and retry
    if (response.status === 401) {
      // Try to refresh token
      const refreshToken = localStorage.getItem("refresh-token")
      if (refreshToken) {
        try {
          const refreshResponse = await fetch("/api/auth/refresh", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ refreshToken }),
          })

          if (refreshResponse.ok) {
            const result = await refreshResponse.json()
            localStorage.setItem("auth-token", result.token)
            if (result.refreshToken) {
              localStorage.setItem("refresh-token", result.refreshToken)
            }

            // Retry the original request
            token = result.token
            response = await makeRequest(token)
          } else {
            // Refresh failed, logout user
            await authContext.logout()
            throw new Error("Session expired")
          }
        } catch (error) {
          await authContext.logout()
          throw error
        }
      }
    }

    return response
  }

  /**
   * Add balance to user account
   */
  const addBalance = async (amount: number, source: "deposit" | "bonus" | "win" = "deposit") => {
    return await authContext.updateBalance(amount, "add")
  }

  /**
   * Deduct balance from user account
   */
  const deductBalance = async (amount: number, reason: "bet" | "withdrawal" = "bet") => {
    if (authContext.user && authContext.user.balance >= amount) {
      const result = await authContext.updateBalance(amount, "subtract")
      return result.success
    }
    return false
  }

  /**
   * Record a bet result
   */
  const recordBet = async (
    categoryId: number,
    amount: number,
    result: "win" | "lose",
    prize?: string,
    prizeValue?: number,
  ) => {
    if (authContext.user) {
      try {
        const response = await makeAuthenticatedRequest("/api/bets/record", {
          method: "POST",
          body: JSON.stringify({
            categoryId,
            amount,
            result,
            prize,
            prizeValue,
          }),
        })

        const betResult = await response.json()
        if (response.ok) {
          return betResult.bet
        }
      } catch (error) {
        console.error("Record bet error:", error)
        return null
      }
    }
    return null
  }

  /**
   * Get user's bet history
   */
  const getBetHistory = async (): Promise<BetResult[]> => {
    if (authContext.user) {
      try {
        const response = await makeAuthenticatedRequest("/api/bets/history?limit=50&offset=0")

        const result = await response.json()
        if (response.ok) {
          return result.bets
        }
      } catch (error) {
        console.error("Get bet history error:", error)
        return []
      }
    }
    return []
  }

  return {
    user: authContext.user,
    isAuthenticated: authContext.isAuthenticated,
    isLoading: authContext.isLoading,
    login: authContext.login,
    logout: authContext.logout,
    addBalance,
    deductBalance,
    recordBet,
    getBetHistory,
    updateProfile: authContext.updateProfile,
    requestPasswordReset: authContext.requestPasswordReset,
    makeAuthenticatedRequest,
  }
}
