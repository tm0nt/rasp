"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Users, CheckCircle, Clock, Loader } from "lucide-react"

interface StatsData {
  totalDeposits: number
  paidDeposits: number
  totalWithdrawals: number
  paidWithdrawals: number
  totalUsers: number
  activeUsers: number
  pendingTransactions: number
  completedTransactions: number
}

export function DashboardStatsCards() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/overview')
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch stats')
        }

        setStats(data.stats)
      } catch (err) {
        console.error('Error fetching stats:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="bg-gray-800 border-2 border-gray-700 h-32 flex items-center justify-center">
            <Loader className="animate-spin text-gray-400" />
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border-2 border-red-500/30 rounded-lg p-4 text-red-400">
        Error: {error}
      </div>
    )
  }

  if (!stats) {
    return null
  }

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