"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, TrendingUp, TrendingDown, Calendar, User, DollarSign, Eye, CheckCircle, XCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { ServiceFactory } from "@/factories/service.factory"
import type { ITransactionService } from "@/interfaces/admin-services"

interface ITransaction {
  id: string
  user_id: string
  user_name: string
  type: 'deposit' | 'withdrawal' | 'bet' | 'win' | 'bonus'
  amount: number
  status: 'pending' | 'completed' | 'processing' | 'failed' | 'cancelled'
  payment_method: string | null
  description: string
  reference: string
  created_at: string
  metadata: any
}

export function TransactionsTable() {
  const [transactions, setTransactions] = useState<ITransaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<ITransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [selectedTransaction, setSelectedTransaction] = useState<ITransaction | null>(null)
  const [modalType, setModalType] = useState<"view" | "approve" | "reject" | null>(null)
  const [adminNote, setAdminNote] = useState("")

  const transactionService: ITransactionService = ServiceFactory.getTransactionService()

  useEffect(() => {
    loadTransactions()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [transactions, searchTerm, filterType, filterStatus])

  const loadTransactions = async () => {
    try {
      setIsLoading(true)
      const data = await transactionService.getTransactions()
      setTransactions(data)
    } catch (error) {
      console.error("Erro ao carregar transações:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as transações",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...transactions]

    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.reference.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterType !== "all") {
      filtered = filtered.filter(t => t.type === filterType)
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(t => t.status === filterStatus)
    }

    setFilteredTransactions(filtered)
  }

  const handleViewTransaction = (transaction: ITransaction) => {
    setSelectedTransaction(transaction)
    setModalType("view")
  }

  const handleApproveTransaction = (transaction: ITransaction) => {
    setSelectedTransaction(transaction)
    setModalType("approve")
    setAdminNote("")
  }

  const handleRejectTransaction = (transaction: ITransaction) => {
    setSelectedTransaction(transaction)
    setModalType("reject")
    setAdminNote("")
  }

  const handleStatusUpdate = async (status: 'completed' | 'cancelled') => {
    if (!selectedTransaction) return

    try {
      await transactionService.updateTransaction(selectedTransaction.id, {
        status,
        admin_note: adminNote
      })

      toast({
        title: "Sucesso",
        description: `Transação ${status === 'completed' ? 'aprovada' : 'rejeitada'} com sucesso`,
      })

      // Atualiza localmente
      setTransactions(transactions.map(t => 
        t.id === selectedTransaction.id ? { ...t, status } : t
      ))

      setModalType(null)
      setSelectedTransaction(null)
    } catch (error) {
      console.error("Erro ao atualizar transação:", error)
      toast({
        title: "Erro",
        description: `Não foi possível ${status === 'completed' ? 'aprovar' : 'rejeitar'} a transação`,
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Concluído</Badge>
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pendente</Badge>
      case "processing":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Processando</Badge>
      case "failed":
      case "cancelled":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
          {status === 'failed' ? 'Falhou' : 'Cancelado'}
        </Badge>
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-1/3"></div>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-16 bg-gray-700 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
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
              <option value="bet">Apostas</option>
              <option value="win">Prêmios</option>
              <option value="bonus">Bônus</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value="all">Todos os Status</option>
              <option value="pending">Pendente</option>
              <option value="processing">Processando</option>
              <option value="completed">Concluído</option>
              <option value="failed">Falhou</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Transações */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">
            Lista de Transações ({filteredTransactions.length})
          </CardTitle>
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
                        <span className="text-white">{transaction.user_name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(transaction.type)}
                        <span className="text-white capitalize">
                          {transaction.type === "deposit" ? "Depósito" : 
                           transaction.type === "withdrawal" ? "Saque" :
                           transaction.type === "bet" ? "Aposta" :
                           transaction.type === "win" ? "Prêmio" : "Bônus"}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-400" />
                        <span className={`font-medium ${
                          transaction.type === 'deposit' || transaction.type === 'win' || transaction.type === 'bonus' 
                            ? 'text-green-400' 
                            : 'text-red-400'
                        }`}>
                          R$ {transaction.amount.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-300">{transaction.payment_method || '-'}</span>
                    </td>
                    <td className="py-4 px-4">{getStatusBadge(transaction.status)}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300 text-sm">
                          {new Date(transaction.created_at).toLocaleDateString("pt-BR", {
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
                          onClick={() => handleViewTransaction(transaction)}
                          className="text-blue-400 hover:bg-blue-500/20"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {transaction.type === 'withdrawal' && transaction.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleApproveTransaction(transaction)}
                              className="text-green-400 hover:bg-green-500/20"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRejectTransaction(transaction)}
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

      {/* Modal de Visualização */}
      {modalType === "view" && selectedTransaction && (
        <Dialog open onOpenChange={() => setModalType(null)}>
          <DialogContent className="sm:max-w-[600px] bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Detalhes da Transação</DialogTitle>
              <DialogDescription className="text-gray-400">
                ID: {selectedTransaction.id}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 py-4">
              <div>
                <Label className="text-gray-400">Usuário</Label>
                <p className="text-white">{selectedTransaction.user_name}</p>
              </div>
              <div>
                <Label className="text-gray-400">Tipo</Label>
                <p className="text-white capitalize">
                  {selectedTransaction.type === "deposit" ? "Depósito" : 
                   selectedTransaction.type === "withdrawal" ? "Saque" :
                   selectedTransaction.type === "bet" ? "Aposta" :
                   selectedTransaction.type === "win" ? "Prêmio" : "Bônus"}
                </p>
              </div>
              <div>
                <Label className="text-gray-400">Valor</Label>
                <p className={`text-lg font-medium ${
                  selectedTransaction.type === 'deposit' || 
                  selectedTransaction.type === 'win' || 
                  selectedTransaction.type === 'bonus' 
                    ? 'text-green-400' 
                    : 'text-red-400'
                }`}>
                  R$ {selectedTransaction.amount.toFixed(2).replace(".", ",")}
                </p>
              </div>
              <div>
                <Label className="text-gray-400">Status</Label>
                <div className="mt-1">
                  {getStatusBadge(selectedTransaction.status)}
                </div>
              </div>
              <div>
                <Label className="text-gray-400">Método</Label>
                <p className="text-white">{selectedTransaction.payment_method || '-'}</p>
              </div>
              <div>
                <Label className="text-gray-400">Referência</Label>
                <p className="text-white">{selectedTransaction.reference || '-'}</p>
              </div>
              <div className="col-span-2">
                <Label className="text-gray-400">Descrição</Label>
                <p className="text-white">{selectedTransaction.description}</p>
              </div>
              <div>
                <Label className="text-gray-400">Data</Label>
                <p className="text-white">
                  {new Date(selectedTransaction.created_at).toLocaleString("pt-BR")}
                </p>
              </div>
              {selectedTransaction.metadata?.admin_note && (
                <div className="col-span-2">
                  <Label className="text-gray-400">Observação do Admin</Label>
                  <p className="text-white">{selectedTransaction.metadata.admin_note}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Aprovação */}
      {modalType === "approve" && selectedTransaction && (
        <Dialog open onOpenChange={() => setModalType(null)}>
          <DialogContent className="sm:max-w-[600px] bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Confirmar Aprovação</DialogTitle>
              <DialogDescription className="text-gray-400">
                Você está prestes a aprovar este saque
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400">Usuário</Label>
                  <p className="text-white">{selectedTransaction.user_name}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Valor</Label>
                  <p className="text-red-400 font-medium">
                    R$ {selectedTransaction.amount.toFixed(2).replace(".", ",")}
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="adminNote" className="text-gray-400">
                  Observação (opcional)
                </Label>
                <Textarea
                  id="adminNote"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                  placeholder="Adicione uma observação sobre esta aprovação..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={() => setModalType(null)}
                className="bg-gray-700 hover:bg-gray-600"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handleStatusUpdate('completed')}
                className="bg-green-600 hover:bg-green-700"
              >
                Confirmar Aprovação
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Rejeição */}
      {modalType === "reject" && selectedTransaction && (
        <Dialog open onOpenChange={() => setModalType(null)}>
          <DialogContent className="sm:max-w-[600px] bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Confirmar Rejeição</DialogTitle>
              <DialogDescription className="text-gray-400">
                Você está prestes a rejeitar este saque
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400">Usuário</Label>
                  <p className="text-white">{selectedTransaction.user_name}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Valor</Label>
                  <p className="text-red-400 font-medium">
                    R$ {selectedTransaction.amount.toFixed(2).replace(".", ",")}
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="adminNote" className="text-gray-400">
                  Motivo da Rejeição (obrigatório)
                </Label>
                <Textarea
                  id="adminNote"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                  placeholder="Descreva o motivo da rejeição..."
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={() => setModalType(null)}
                className="bg-gray-700 hover:bg-gray-600"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handleStatusUpdate('cancelled')}
                className="bg-red-600 hover:bg-red-700"
                disabled={!adminNote}
              >
                Confirmar Rejeição
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}