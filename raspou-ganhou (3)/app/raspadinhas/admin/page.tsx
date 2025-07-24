/**
 * Página principal da administração refatorada
 * Implementa Single Responsibility Principle (SRP)
 */

"use client"
import { AdminLoginForm } from "@/components/admin/admin-login-form"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { useAdminAuth } from "@/hooks/useAdminAuth"
import { AdminLoadingState } from "@/components/admin/admin-loading-state"

/**
 * Componente principal da página administrativa
 * Responsável apenas por gerenciar o estado de autenticação e renderizar o componente apropriado
 */
export default function AdminPage() {
  const { isAuthenticated, admin, login, logout, isLoading } = useAdminAuth()

  /**
   * Manipula o processo de login
   */
  const handleLogin = async (credentials: { email: string; password: string }) => {
    return await login(credentials)
  }

  // Estado de carregamento inicial
  if (isLoading) {
    return <AdminLoadingState />
  }

  // Usuário não autenticado - exibe formulário de login
  if (!isAuthenticated) {
    return <AdminLoginForm onLogin={handleLogin} />
  }

  // Usuário autenticado - exibe dashboard
  return <AdminDashboard admin={admin!} onLogout={logout} />
}
