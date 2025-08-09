"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Users, CheckCircle, Clock, Loader, DollarSign } from "lucide-react"

interface StatsData {
  totalDeposits: number
  paidDeposits: number
  totalWithdrawals: number
  paidWithdrawals: number
  totalUsers: number
  activeUsers: number
  pendingTransactions: number
  completedTransactions: number
  affiliateEarnings: number
  affiliateWithdrawals: number
  pendingWithdrawalsToday: number
}

export function DashboardStatsCards() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
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

  useEffect(() => {
    fetchStats()
    const intervalId = setInterval(fetchStats, 5000) // Poll every 5 seconds
    return () => clearInterval(intervalId)
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(11)].map((_, i) => (
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
      value: stats.totalDeposits,
      icon: TrendingUp,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
      isMoney: true,
    },
    {
      title: "Depósitos Pagos",
      value: stats.paidDeposits,
      icon: CheckCircle,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
      isMoney: true,
    },
    {
      title: "Saques Totais",
      value: stats.totalWithdrawals,
      icon: TrendingDown,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
      isMoney: true,
    },
    {
      title: "Saques Pagos",
      value: stats.paidWithdrawals,
      icon: CheckCircle,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
      isMoney: true,
    },
    {
      title: "Total de Usuários",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
      isMoney: false,
    },
    {
      title: "Usuários Ativos",
      value: stats.activeUsers,
      icon: Users,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
      isMoney: false,
    },
    {
      title: "Transações Pendentes",
      value: stats.pendingTransactions,
      icon: Clock,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/30",
      isMoney: false,
    },
    {
      title: "Transações Concluídas",
      value: stats.completedTransactions,
      icon: CheckCircle,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
      isMoney: false,
    },
    {
      title: "Ganhos Afiliados",
      value: stats.affiliateEarnings,
      icon: DollarSign,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
      isMoney: true,
    },
    {
      title: "Saques Afiliados",
      value: stats.affiliateWithdrawals,
      icon: TrendingDown,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
      isMoney: true,
    },
    {
      title: "Saques Pendentes Hoje",
      value: stats.pendingWithdrawalsToday,
      icon: Clock,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/30",
      isMoney: true,
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
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  borderColor: string
  isMoney: boolean
}

function StatsCard({ title, value, icon: Icon, color, bgColor, borderColor, isMoney }: StatsCardProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let current = 0
    const target = value
    const duration = 1000 // 1 second
    const steps = 50
    const increment = target / steps
    const stepTime = duration / steps

    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setDisplayValue(target)
        clearInterval(timer)
      } else {
        setDisplayValue(current)
      }
    }, stepTime)

    return () => clearInterval(timer)
  }, [value])

  const formattedValue = isMoney 
    ? `R$ ${displayValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : displayValue.toLocaleString("pt-BR")

  return (
    <Card className={`bg-gray-800 border-2 ${borderColor} ${bgColor}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
          <Icon className={`w-4 h-4 ${color}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color}`}>{formattedValue}</div>
      </CardContent>
    </Card>
  )
}