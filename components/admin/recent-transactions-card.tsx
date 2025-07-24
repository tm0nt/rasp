"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader } from "lucide-react"

export interface ITransaction {
  id: string
  userId: string
  userName: string
  type: string
  amount: number
  status: string
  payment_method: string | null
  description: string
  created_at: string
}

export function RecentTransactionsCard() {
  const [transactions, setTransactions] = useState<ITransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRecentTransactions = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/transactions/recent?limit=5')
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch recent transactions')
        }

        setTransactions(data.transactions)
      } catch (err) {
        console.error('Error fetching transactions:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchRecentTransactions()
  }, [])

  if (loading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Últimas Transações</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-40">
          <Loader className="animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Últimas Transações</CardTitle>
        </CardHeader>
        <CardContent className="text-red-400 text-center py-8">
          Error: {error}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Últimas Transações</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <TransactionItem key={transaction.id} transaction={transaction} />
          ))}
          {transactions.length === 0 && (
            <p className="text-gray-400 text-center py-4">Nenhuma transação recente</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function TransactionItem({ transaction }: { transaction: ITransaction }) {
  const getStatusColor = (status: string): string => {
    switch (status) {
      case "completed":
        return "text-green-400"
      case "pending":
        return "text-yellow-400"
      case "processing":
        return "text-blue-400"
      default:
        return "text-gray-400"
    }
  }

  const getStatusText = (status: string): string => {
    switch (status) {
      case "completed":
        return "Concluído"
      case "pending":
        return "Pendente"
      case "processing":
        return "Processando"
      default:
        return status
    }
  }

  const getTypeText = (type: string): string => {
    switch (type) {
      case "deposit":
        return "Depósito"
      case "withdrawal":
        return "Saque"
      case "bonus":
        return "Bônus"
      case "bet":
        return "Aposta"
      case "win":
        return "Prêmio"
      default:
        return type
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
      <div>
        <p className="text-white font-medium">{transaction.userName}</p>
        <p className="text-gray-400 text-sm">
          {getTypeText(transaction.type)} • {formatDate(transaction.created_at)}
        </p>
      </div>
      <div className="text-right">
        <p className={`font-medium ${
          transaction.type === 'deposit' || transaction.type === 'win' || transaction.type === 'bonus' 
            ? 'text-green-400' 
            : 'text-red-400'
        }`}>
          {transaction.type === 'deposit' || transaction.type === 'win' || transaction.type === 'bonus' ? '+' : '-'}
          R$ {transaction.amount.toFixed(2).replace(".", ",")}
        </p>
        <p className={`text-xs ${getStatusColor(transaction.status)}`}>
          {getStatusText(transaction.status)}
        </p>
      </div>
    </div>
  )
}