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

// Função para comparar listas de transações (id, created_at, amount e status)
function areTransactionsEqual(arr1: ITransaction[], arr2: ITransaction[]) {
  if (arr1.length !== arr2.length) return false

  for (let i = 0; i < arr1.length; i++) {
    const a = arr1[i]
    const b = arr2[i]
    if (
      a.id !== b.id ||
      a.created_at !== b.created_at ||
      a.amount !== b.amount ||
      a.status !== b.status
    ) {
      return false
    }
  }

  return true
}

export function RecentTransactionsCard() {
  const [transactions, setTransactions] = useState<ITransaction[]>([])
  const [newTransactionIds, setNewTransactionIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRecentTransactions = async () => {
    try {
      const response = await fetch('/api/admin/transactions/recent?limit=5')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch recent transactions')
      }

      setTransactions((currentTransactions) => {
        const combined = [...data.transactions, ...currentTransactions]

        // Remove duplicados pelo id, mantendo o primeiro encontrado
        const uniqueMap = new Map<string, ITransaction>()
        combined.forEach(tx => {
          if (!uniqueMap.has(tx.id)) uniqueMap.set(tx.id, tx)
        })

        const updatedTransactions = Array.from(uniqueMap.values())
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)

        if (areTransactionsEqual(updatedTransactions, currentTransactions)) {
          return currentTransactions
        }

        const newIds = updatedTransactions
          .filter(tx => !currentTransactions.some(ct => ct.id === tx.id))
          .map(tx => tx.id)

        setNewTransactionIds(newIds)
        setTimeout(() => setNewTransactionIds([]), 3000)

        return updatedTransactions
      })

    } catch (err) {
      console.error('Error fetching transactions:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecentTransactions()

    const interval = setInterval(fetchRecentTransactions, 5000)
    return () => clearInterval(interval)
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
            <TransactionItem key={transaction.id} transaction={transaction} isNew={newTransactionIds.includes(transaction.id)} />
          ))}
          {transactions.length === 0 && (
            <p className="text-gray-400 text-center py-4">Nenhuma transação recente</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function TransactionItem({ transaction, isNew }: { transaction: ITransaction; isNew: boolean }) {
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
    <div className={`flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors ${isNew ? 'bg-yellow-900/50 animate-pulse' : ''}`}>
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
