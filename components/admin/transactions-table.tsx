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
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"

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
  metadata: {
    pixKey: string
    cpfHolder: string
    pixKeyType: string
    requestedAt: string
    additionalInfo: {
      userIp: string
      withdrawSource: string
    }
    pixResponse?: any
    processedAt?: string
    adminApprovedBy?: string
    adminRejectedAt?: string
    rejectionReason?: string
    adminRejectedBy?: string
  }
}

export function TransactionsTable() {
  const [transactions, setTransactions] = useState<ITransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [selectedTransaction, setSelectedTransaction] = useState<ITransaction | null>(null)
  const [modalType, setModalType] = useState<"view" | "approve" | "reject" | null>(null)
  const [adminNote, setAdminNote] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalTransactions, setTotalTransactions] = useState(0)
  const limit = 10

  useEffect(() => {
    loadTransactions()
  }, [currentPage, searchTerm, filterType, filterStatus])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterType, filterStatus])

  const loadTransactions = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        search: searchTerm,
        type: filterType,
        status: filterStatus,
        page: currentPage.toString(),
        limit: limit.toString(),
      })
      const response = await fetch(`/api/admin/transactions?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch transactions')
      }
      
      const { data, pagination } = await response.json()
      setTransactions(data)
      setTotalPages(pagination.totalPages)
      setTotalTransactions(pagination.total)
      
      if (currentPage > pagination.totalPages && pagination.totalPages > 0) {
        setCurrentPage(pagination.totalPages)
      }
    } catch (error) {
      console.error("Erro ao carregar transações:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : 'Não foi possível carregar as transações',
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
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

  const handleStatusUpdate = async (action: 'approve' | 'reject') => {
    if (!selectedTransaction) return

    try {
      if (action === 'reject' && !adminNote) {
        toast({
          title: "Aviso",
          description: "Por favor, informe o motivo da rejeição",
          variant: "destructive"
        })
        return
      }

      const response = await fetch(`/api/admin/withdraw/${selectedTransaction.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          reason: adminNote
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update withdrawal')
      }

      toast({
        title: "Sucesso",
        description: `Saque ${action === 'approve' ? 'aprovado' : 'rejeitado'} com sucesso`,
      })

      setModalType(null)
      setSelectedTransaction(null)
      await loadTransactions()
    } catch (error) {
      console.error("Erro ao atualizar saque:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao processar a requisição',
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
            Lista de Transações ({totalTransactions})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className="h-16 bg-gray-700 rounded"></div>
              ))}
            </div>
          ) : (
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
                  {transactions.map((transaction) => (
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
          )}
        </CardContent>
      </Card>

      {!isLoading && totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
            <span className="mx-2 text-sm text-gray-400">
              Página {currentPage} de {totalPages}
            </span>
            <PaginationItem>
              <PaginationNext 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

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

              {/* Seção específica para saques */}
              {selectedTransaction.type === 'withdrawal' && (
                <div className="col-span-2 space-y-2">
                  <Label className="text-gray-400">Detalhes do PIX</Label>
                  <div className="bg-gray-700/50 p-3 rounded-lg">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-gray-400 text-sm">Chave PIX:</span>
                        <p className="text-white">{selectedTransaction.metadata.pixKey}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 text-sm">Tipo:</span>
                        <p className="text-white capitalize">
                          {selectedTransaction.metadata.pixKeyType}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-400 text-sm">CPF Titular:</span>
                        <p className="text-white">
                          {selectedTransaction.metadata.cpfHolder}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-400 text-sm">Solicitado em:</span>
                        <p className="text-white">
                          {new Date(selectedTransaction.metadata.requestedAt).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Resposta do PIX (se disponível) */}
              {selectedTransaction.metadata.pixResponse && (
                <div className="col-span-2 space-y-2">
                  <Label className="text-gray-400">Resposta do PIX</Label>
                  <pre className="bg-gray-700/50 p-3 rounded-lg text-xs text-white overflow-auto">
                    {JSON.stringify(selectedTransaction.metadata.pixResponse, null, 2)}
                  </pre>
                </div>
              )}

              {/* Motivo de rejeição (se disponível) */}
              {selectedTransaction.metadata.rejectionReason && (
                <div className="col-span-2">
                  <Label className="text-gray-400">Motivo da Rejeição</Label>
                  <p className="text-white">{selectedTransaction.metadata.rejectionReason}</p>
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

              <div className="space-y-2">
                <Label className="text-gray-400">Detalhes do PIX</Label>
                <div className="bg-gray-700/50 p-3 rounded-lg">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-gray-400 text-sm">Chave PIX:</span>
                      <p className="text-white">{selectedTransaction.metadata.pixKey}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Tipo:</span>
                      <p className="text-white capitalize">
                        {selectedTransaction.metadata.pixKeyType}
                      </p>
                    </div>
                  </div>
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
                onClick={() => handleStatusUpdate('approve')}
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
                onClick={() => handleStatusUpdate('reject')}
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