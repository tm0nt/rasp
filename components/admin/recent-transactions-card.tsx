/**
 * Componente para card de transações recentes
 * Implementa Single Responsibility Principle (SRP)
 */

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ITransaction } from "@/types/admin"

interface RecentTransactionsCardProps {
  transactions: ITransaction[]
}

/**
 * Componente responsável apenas por exibir as transações recentes
 */
export function RecentTransactionsCard({ transactions }: RecentTransactionsCardProps) {
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
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Componente para item individual de transação
 */
interface TransactionItemProps {
  transaction: ITransaction
}

function TransactionItem({ transaction }: TransactionItemProps) {
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
        return "Desconhecido"
    }
  }

  const getTypeText = (type: string): string => {
    return type === "deposit" ? "Depósito" : "Saque"
  }

  return (
    <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
      <div>
        <p className="text-white font-medium">{transaction.userName}</p>
        <p className="text-gray-400 text-sm">{getTypeText(transaction.type)}</p>
      </div>
      <div className="text-right">
        <p className="text-white font-medium">R$ {transaction.amount.toFixed(2).replace(".", ",")}</p>
        <p className={`text-xs ${getStatusColor(transaction.status)}`}>{getStatusText(transaction.status)}</p>
      </div>
    </div>
  )
}
