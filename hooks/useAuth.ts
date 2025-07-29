"use client"

import { useState, useEffect } from "react"
import { useSession, signIn, signOut } from 'next-auth/react';
import { useToast } from "@/contexts/toast-context";

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

interface AuthResult {
  success: boolean
  error?: string
  user?: User
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
 * Authentication hook with complete user management and API integration
 * Features:
 * - Login/Register with validation
 * - User session persistence via NextAuth.js
 * - Balance management
 * - Profile updates
 * - Bet history tracking
 */
export function useAuth() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  // Load user from session and fetch full profile
  useEffect(() => {
    if (status === 'loading') {
      setIsLoading(true);
      return;
    }

    if (session?.user) {
      // Fetch full user profile to ensure all fields are populated
      const fetchProfile = async () => {
        try {
          const profileRes = await fetch('/api/user/profile', { credentials: 'include' });
          const profileData = await profileRes.json();
          if (profileRes.ok) {
            setUser(profileData as User);
            setIsAuthenticated(true);
          } else {
            await signOut({ redirect: false });
            setUser(null);
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
          setUser(null);
          setIsAuthenticated(false);
        }
        setIsLoading(false);
      };
      fetchProfile();
    } else {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }, [session, status]);

  /**
   * Login or register user
   */
  const login = async (formData: any, isRegister: boolean): Promise<AuthResult> => {
    try {
      // Client-side validation for UX
      if (isRegister) {
        if (!formData.name || formData.name.length < 2) {
          return { success: false, error: "Nome deve ter pelo menos 2 caracteres" };
        }
        if (!formData.email || !formData.email.includes("@")) {
          return { success: false, error: "Email inválido" };
        }
        if (!formData.phone || formData.phone.length < 10) {
          return { success: false, error: "Telefone deve ter pelo menos 10 dígitos" };
        }
        if (!formData.password || formData.password.length < 6) {
          return { success: false, error: "Senha deve ter pelo menos 6 caracteres" };
        }
      } else {
        if (!formData.email && !formData.phone) {
          return { success: false, error: "Email ou telefone é obrigatório" };
        }
        if (!formData.password) {
          return { success: false, error: "Senha é obrigatória" };
        }
      }

      const res = await signIn('credentials', {
        ...formData,
        action: isRegister ? 'register' : 'login',
        redirect: false,
      });

      if (res?.error) {
        await fetch('/api/errors/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: res.error,
            context: 'authentication',
            action: isRegister ? 'register' : 'login',
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
          })
        });
        return { success: false, error: res.error };
      }

      // Fetch full user profile after successful auth
      const profileRes = await fetch('/api/user/profile', { credentials: 'include' });
      const profileData = await profileRes.json();
      if (!profileRes.ok) {
        throw new Error(profileData.error || 'Erro ao carregar perfil');
      }

      setUser(profileData as User);
      setIsAuthenticated(true);

      // Track successful auth event
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: isRegister ? 'user_registered' : 'user_logged_in',
          userId: profileData.id,
          properties: {
            email: formData.email,
            phone: formData.phone,
            registrationMethod: isRegister ? 'email' : (formData.email ? 'email' : 'phone'),
            timestamp: new Date().toISOString(),
          },
        }),
      });

      // Send welcome email on registration
      if (isRegister) {
        await fetch('/api/email/welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            email: profileData.email,
            name: profileData.name,
            welcomeBonus: 10.0,
          }),
        });
      }

      return { success: true, user: profileData };
    } catch (error) {
      console.error("Authentication error:", error);
      await fetch('/api/errors/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: error.message,
          context: 'authentication',
          action: isRegister ? 'register' : 'login',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        })
      });
      return { success: false, error: "Erro interno do servidor. Tente novamente." };
    }
  }

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      await signOut({ redirect: false });

      setUser(null);
      setIsAuthenticated(false);

      // Track logout event
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'user_logged_out',
          userId: user?.id,
          properties: {
            timestamp: new Date().toISOString(),
          },
        }),
      });
    } catch (error) {
      console.error("Logout error:", error);
      await fetch('/api/errors/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: error.message,
          context: 'logout',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        })
      });
      // Force logout even if API call fails
      await signOut({ redirect: false });
      setUser(null);
      setIsAuthenticated(false);
    }
  }

  /**
   * Add balance to user account
   */
  const addBalance = async (amount: number, source: "deposit" | "bonus" | "win" = "deposit") => {
    if (!user) return { success: false, error: "User not found" };

    try {
      const response = await fetch('/api/user/add-balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          amount,
          source,
          userId: user.id
        })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao adicionar saldo');
      }

      setUser(prev => prev ? { ...prev, [source === 'bonus' ? 'bonusBalance' : 'balance']: result.newBalance } : null);

      // Track balance addition
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: `${source}_added`,
          userId: user.id,
          properties: {
            amount,
            source,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      return { success: true, newBalance: result.newBalance };
    } catch (error) {
      console.error("Add balance error:", error);
      await fetch('/api/errors/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: error.message,
          context: 'add_balance',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        })
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Deduct balance from user account
   */
const purchaseGame = async (amount: number, categoryId: string) => {
  if (!user || user.balance < amount) {
    return false;
  }

  try {
    const response = await fetch('/api/games/purchase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        amount,
        categoryId,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Erro na compra do jogo');
    }

    // Atualiza saldo local
    setUser(prev => prev ? { ...prev, balance: prev.balance - amount } : null);

    // Track da compra para analytics
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'game_purchased',
        userId: user.id,
        properties: {
          amount,
          categoryId,
          timestamp: new Date().toISOString(),
        },
      }),
    });

    return true;
  } catch (error) {
    console.error("Erro ao comprar jogo:", error);
    await fetch('/api/errors/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: (error as Error).message,
        context: 'purchase_game',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      }),
    });
    return false;
  }
};


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
    if (!user) return null;

    try {
      const response = await fetch('/api/bets/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: user.id,
          categoryId,
          amount,
          result,
          prize,
          prizeValue,
          timestamp: new Date().toISOString()
        })
      });
      const betResult = await response.json();
      if (!response.ok) {
        throw new Error(betResult.error || 'Erro ao registrar aposta');
      }

      // Update user stats
      setUser(prev => prev ? {
        ...prev,
        totalBets: prev.totalBets + 1,
        wonBets: result === "win" ? prev.wonBets + 1 : prev.wonBets,
        lostBets: result === "lose" ? prev.lostBets + 1 : prev.lostBets,
        totalEarnings: result === "win" && prizeValue ? prev.totalEarnings + prizeValue : prev.totalEarnings
      } : null);

      // Track bet event
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'bet_recorded',
          userId: user.id,
          properties: {
            categoryId,
            amount,
            result,
            prize,
            prizeValue,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      return betResult.bet;
    } catch (error) {
      console.error("Record bet error:", error);
      await fetch('/api/errors/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: error.message,
          context: 'record_bet',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        })
      });
      return null;
    }
  }

  /**
   * Get user's bet history
   */
  const getBetHistory = async (): Promise<BetResult[]> => {
    if (!user) return [];

    try {
      const response = await fetch(`/api/bets/history/${user.id}?limit=50&offset=0`, {
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao carregar histórico de apostas');
      }

      return result.bets;
    } catch (error) {
      console.error("Get bet history error:", error);
      await fetch('/api/errors/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: error.message,
          context: 'get_bet_history',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        })
      });
      return [];
    }
  }

  /**
   * Update user profile
   */
  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return { success: false, error: "User not found" };

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: user.id,
          updates
        })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao atualizar perfil');
      }

      setUser(prev => prev ? { ...prev, ...result.user } : null);

      // Track profile update
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'profile_updated',
          userId: user.id,
          properties: {
            updatedFields: Object.keys(updates),
            timestamp: new Date().toISOString(),
          },
        }),
      });

      return { success: true, user: result.user };
    } catch (error) {
      console.error("Update profile error:", error);
      await fetch('/api/errors/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: error.message,
          context: 'update_profile',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        })
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Request password reset
   */
  const requestPasswordReset = async (email: string) => {
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao solicitar recuperação de senha');
      }

      // Track password reset request
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'password_reset_requested',
          properties: {
            email,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      return { success: true, message: result.message };
    } catch (error) {
      console.error("Password reset error:", error);
      await fetch('/api/errors/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: error.message,
          context: 'password_reset',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        })
      });
      return { success: false, error: error.message };
    }
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    addBalance,
    purchaseGame,
    recordBet,
    getBetHistory,
    updateProfile,
    requestPasswordReset,
  }
}