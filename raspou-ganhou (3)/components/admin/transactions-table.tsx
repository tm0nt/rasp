"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, TrendingUp, TrendingDown, Calendar, User, DollarSign, Eye, CheckCircle, XCircle } from "lucide-react"

/**
 * Tabela de transações da administração
 */
export function TransactionsTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  // Dados simulados - em produção viriam da API
  const transactions = [
    {
      id: "TXN-001",
      userId: "1",
      userName: "João Silva",
      type: "deposit",
      amount: 50.0,
      status: "completed",
      method: "PIX",
      date: "2025-01-18 14:30:00",
      reference: "PIX-ABC123",
    },
    {
      id: "TXN-002",
      userId: "2",
      userName: "Maria Santos",
      type: "withdrawal",
      amount: 100.0,
      status: "pending",
      method: "PIX",
      date: "2025-01-18 13:15:00",
      reference: "SAQ-DEF456",
    },
    {
      id: "TXN-003",
      userId: "3",
      userName: "Carlos Oliveira",
      type: "deposit",
      amount: 25.0,
      status: "completed",
      method: "Cartão de Crédito",
      date: "2025-01-18 12:45:00",
      reference: "CC-GHI789",
    },
    {
      id: "TXN-004",
      userId: "4",
      userName: "Ana Costa",
      type: "withdrawal",
      amount: 75.0,
      status: "processing",
      method: "PIX",
      date: "2025-01-18 11:20:00",
      reference: "SAQ-JKL012",
    },
    {
      id: "TXN-005",
      userId: "5",
      userName: "Pedro Alves",
      type: "deposit",
      amount: 200.0,
      status: "failed",
      method: "PIX",
      date: "2025-01-18 10:05:00",
      reference: "PIX-MNO345",
    },
  ]

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reference.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || transaction.type === filterType
    const matchesStatus = filterStatus === "all" || transaction.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Concluído</Badge>
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pendente</Badge>
      case "processing":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Processando</Badge>
      case "failed":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Falhou</Badge>
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Desconhecido</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    return type === "deposit" ? (
      <TrendingUp className="w-4 h-4 text-green-400" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-400" />
    )
  }

  const handleViewTransaction = (transactionId: string) => {
    console.log("Visualizar transação:", transactionId)
    // TODO: Implementar modal de visualização
  }

  const handleApproveTransaction = (transactionId: string) => {
    console.log("Aprovar transação:", transactionId)
    // TODO: Implementar aprovação
  }

  const handleRejectTransaction = (transactionId: string) => {
    console.log("Rejeitar transação:", transactionId)
    // TODO: Implementar rejeição
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Transações</h1>
        <p className="text-gray-400">Gerencie depósitos e saques detalhados</p>
      </div>

      {/* Filtros */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por usuário ou referência..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value="all">Todos os Tipos</option>
              <option value="deposit">Depósitos</option>
              <option value="withdrawal">Saques</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value="all">Todos os Status</option>
              <option value="completed">Concluído</option>
              <option value="pending">Pendente</option>
              <option value="processing">Processando</option>
              <option value="failed">Falhou</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Transações */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Lista de Transações ({filteredTransactions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">ID</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Usuário</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Tipo</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Valor</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Método</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Data</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-white font-medium">{transaction.id}</p>
                        <p className="text-gray-400 text-xs">{transaction.reference}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-white">{transaction.userName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(transaction.type)}
                        <span className="text-white capitalize">
                          {transaction.type === "deposit" ? "Depósito" : "Saque"}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-400" />
                        <span className="text-white font-medium">
                          R$ {transaction.amount.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-300">{transaction.method}</span>
                    </td>
                    <td className="py-4 px-4">{getStatusBadge(transaction.status)}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300 text-sm">
                          {new Date(transaction.date).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewTransaction(transaction.id)}
                          className="text-blue-400 hover:bg-blue-500/20"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {transaction.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleApproveTransaction(transaction.id)}
                              className="text-green-400 hover:bg-green-500/20"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRejectTransaction(transaction.id)}
                              className="text-red-400 hover:bg-red-500/20"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
