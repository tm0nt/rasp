/**
 * Componente para cards de estatísticas do dashboard
 * Implementa Single Responsibility Principle (SRP)
 */

"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Users, CheckCircle, Clock } from "lucide-react"

interface DashboardStatsCardsProps {
  stats: {
    totalDeposits: number
    paidDeposits: number
    totalWithdrawals: number
    paidWithdrawals: number
    totalUsers: number
    activeUsers: number
    pendingTransactions: number
    completedTransactions: number
  }
}

/**
 * Componente responsável apenas por renderizar os cards de estatísticas
 */
export function DashboardStatsCards({ stats }: DashboardStatsCardsProps) {
  const cards = [
    {
      title: "Depósitos Totais",
      value: `R$ ${stats.totalDeposits.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
    },
    {
      title: "Depósitos Pagos",
      value: `R$ ${stats.paidDeposits.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: CheckCircle,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
    },
    {
      title: "Saques Totais",
      value: `R$ ${stats.totalWithdrawals.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: TrendingDown,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
    },
    {
      title: "Saques Pagos",
      value: `R$ ${stats.paidWithdrawals.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: CheckCircle,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
    },
    {
      title: "Total de Usuários",
      value: stats.totalUsers.toLocaleString("pt-BR"),
      icon: Users,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
    },
    {
      title: "Usuários Ativos",
      value: stats.activeUsers.toLocaleString("pt-BR"),
      icon: Users,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
    },
    {
      title: "Transações Pendentes",
      value: stats.pendingTransactions.toLocaleString("pt-BR"),
      icon: Clock,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/30",
    },
    {
      title: "Transações Concluídas",
      value: stats.completedTransactions.toLocaleString("pt-BR"),
      icon: CheckCircle,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <StatsCard key={index} {...card} />
      ))}
    </div>
  )
}

/**
 * Componente individual para cada card de estatística
 */
interface StatsCardProps {
  title: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  borderColor: string
}

function StatsCard({ title, value, icon: Icon, color, bgColor, borderColor }: StatsCardProps) {
  return (
    <Card className={`bg-gray-800 border-2 ${borderColor} ${bgColor}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
          <Icon className={`w-4 h-4 ${color}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
      </CardContent>
    </Card>
  )
}
