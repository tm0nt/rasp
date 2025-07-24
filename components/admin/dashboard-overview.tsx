/**
 * Componente refatorado para visão geral do dashboard
 * Implementa Single Responsibility Principle (SRP)
 */

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ServiceFactory } from "@/factories/service.factory"
import { DashboardStatsCards } from "./dashboard-stats-cards"
import { RecentTransactionsCard } from "./recent-transactions-card"
import { NewUsersCard } from "./new-users-card"
import type { IDashboardService } from "@/interfaces/admin-services"

/**
 * Componente principal da visão geral do dashboard
 * Responsável apenas por orquestrar os sub-componentes
 */
export function DashboardOverview() {
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [newUsers, setNewUsers] = useState<any[]>([])

  // Injeta dependência do serviço de dashboard
  const dashboardService: IDashboardService = ServiceFactory.getDashboardService()

  useEffect(() => {
    loadDashboardData()
  }, [])

  /**
   * Carrega todos os dados do dashboard
   */
  const loadDashboardData = async (): Promise<void> => {
    try {
      setIsLoading(true)

      // Carrega dados em paralelo para melhor performance
      const [statsData, transactionsData, usersData] = await Promise.all([
        dashboardService.getOverviewStats(),
        dashboardService.getRecentTransactions(),
        dashboardService.getNewUsers(),
      ])

      setStats(statsData)
      setRecentTransactions(transactionsData)
      setNewUsers(usersData)
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <DashboardLoadingState />
  }

  return (
    <div className="space-y-6">
      <DashboardHeader />

      {/* Cards de Estatísticas */}
      <DashboardStatsCards stats={stats} />

      {/* Gráficos e Tabelas Resumidas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentTransactionsCard transactions={recentTransactions} />
        <NewUsersCard users={newUsers} />
      </div>
    </div>
  )
}

/**
 * Componente para o cabeçalho do dashboard
 */
function DashboardHeader() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Dashboard</h1>
      <p className="text-gray-400">Visão geral das métricas do sistema</p>
    </div>
  )
}

/**
 * Componente para estado de carregamento
 */
function DashboardLoadingState() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-1/4 mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-1/3"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <Card key={index} className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                <div className="h-8 bg-gray-700 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
