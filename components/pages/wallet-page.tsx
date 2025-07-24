"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PageLayout } from "@/components/layout/page-layout"
import { Plus, Minus, CheckCircle, Wallet, DollarSign, Gift, TrendingUp, Clock, Copy, Loader } from "lucide-react"

interface WalletPageProps {
  onNavigate: (page: string) => void
  onBack: () => void
  user: {
    id: string
    name: string
    email: string
    phone: string
    avatar?: string
    balance: number
  }
  onLogout: () => void
  onAddBalance?: (amount: number) => void
}

interface Transaction {
  id: string
  type: string
  amount: number
  status: string
  payment_method: string | null
  description: string
  created_at: string
  metadata?: any
  processed_at?: string | null
}

interface ApiResponse {
  success: boolean
  data: {
    deposits: Transaction[]
    withdrawals: Transaction[]
    others: Transaction[]
    counts: {
      deposits: number
      withdrawals: number
      others: number
    }
  }
  pagination: {
    limit: number
    offset: number
    total: number
  }
}

export function WalletPage({ onNavigate, onBack, user, onLogout, onAddBalance }: WalletPageProps) {
  const [activeTab, setActiveTab] = useState("todos")
  const [transactions, setTransactions] = useState<{
    deposits: Transaction[]
    withdrawals: Transaction[]
    others: Transaction[]
  }>({ deposits: [], withdrawals: [], others: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch transaction history
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/user/transactions/history')
        const data: ApiResponse = await response.json()
        
        if (!response.ok) {
          throw new Error(data.success === false ? 'Failed to fetch transactions' : 'Erro ao carregar transações')
        }

        setTransactions({
          deposits: data.data.deposits,
          withdrawals: data.data.withdrawals,
          others: data.data.others
        })
      } catch (err) {
        console.error('Error fetching transactions:', err)
        setError('Falha ao carregar histórico de transações')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransactions()
  }, [])

  // Filter transactions based on active tab
  const filteredTransactions = () => {
    switch (activeTab) {
      case "depositos":
        return transactions.deposits
      case "saques":
        return transactions.withdrawals
      case "todos":
      default:
        return [...transactions.deposits, ...transactions.withdrawals, ...transactions.others]
    }
  }

  const handleAddBalance = () => {
    if (onAddBalance) {
      onAddBalance(50)
    }
  }

  const formatCurrency = (value: number) => {
    return `R$ ${Math.abs(value).toFixed(2).replace(".", ",")}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColors = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'approved':
        return { text: 'text-green-400', bg: 'bg-green-400/10', label: 'Concluído' }
      case 'pending':
        return { text: 'text-yellow-400', bg: 'bg-yellow-400/10', label: 'Pendente' }
      case 'failed':
      case 'rejected':
        return { text: 'text-red-400', bg: 'bg-red-400/10', label: 'Falhou' }
      default:
        return { text: 'text-gray-400', bg: 'bg-gray-400/10', label: status }
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <Plus className="w-5 h-5 text-white" />
      case 'withdrawal':
        return <Minus className="w-5 h-5 text-white" />
      case 'win':
        return <Gift className="w-5 h-5 text-white" />
      case 'bet':
        return <TrendingUp className="w-5 h-5 text-white" />
      default:
        return <CheckCircle className="w-5 h-5 text-white" />
    }
  }

  const balanceCards = [
    {
      title: "Saldo Total",
      amount: formatCurrency(user.balance),
      description: "",
      icon: Wallet,
      gradient: "from-green-500 to-emerald-600",
      bgGradient: "from-green-500/10 to-emerald-600/10",
      borderColor: "border-green-500/30",
    },
    {
      title: "Saldo Padrão",
      amount: formatCurrency(user.balance),
      description: "Disponível para compras de raspadinhas",
      icon: DollarSign,
      gradient: "from-blue-500 to-cyan-600",
      bgGradient: "from-blue-500/10 to-cyan-600/10",
      borderColor: "border-blue-500/30",
    },
    {
      title: "Premiações",
      amount: "R$ 0,00",
      description: "Disponível para saque e compras",
      icon: TrendingUp,
      gradient: "from-purple-500 to-pink-600",
      bgGradient: "from-purple-500/10 to-pink-600/10",
      borderColor: "border-purple-500/30",
    },
    {
      title: "Saldo Bônus",
      amount: "R$ 0,00",
      description: "Promoções ativas",
      icon: Gift,
      gradient: "from-orange-500 to-red-600",
      bgGradient: "from-orange-500/10 to-red-600/10",
      borderColor: "border-orange-500/30",
    }
  ]

  return (
    <PageLayout
      title="Minha Carteira"
      showBackButton
      onBack={onBack}
      user={user}
      onLogout={onLogout}
      onNavigate={onNavigate}
    >
      {/* Elementos flutuantes animados */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-32 left-10 w-2 h-2 bg-green-400/20 rounded-full animate-float"
          style={{ animationDelay: "0s" }}
        />
        <div
          className="absolute top-60 right-20 w-1 h-1 bg-blue-400/30 rounded-full animate-float"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute bottom-80 left-1/4 w-3 h-3 bg-purple-400/15 rounded-full animate-float"
          style={{ animationDelay: "4s" }}
        />
        <div
          className="absolute top-1/2 right-1/3 w-1.5 h-1.5 bg-yellow-400/25 rounded-full animate-float"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute bottom-60 right-10 w-2 h-2 bg-pink-400/20 rounded-full animate-float"
          style={{ animationDelay: "3s" }}
        />
        <div
          className="absolute top-2/3 left-20 w-1 h-1 bg-cyan-400/30 rounded-full animate-float"
          style={{ animationDelay: "5s" }}
        />
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {balanceCards.map((card, index) => (
          <Card
            key={index}
            className={`
              relative overflow-hidden border-2 border-white/20 
              bg-black backdrop-blur-sm
              hover:shadow-xl hover:shadow-green-500/10 hover:border-white/40
              transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1
              group cursor-pointer
            `}
          >
            <CardContent className="p-6 relative">
              {/* Elementos flutuantes internos */}
              <div
                className="absolute top-2 right-2 w-1 h-1 bg-green-400/40 rounded-full animate-pulse"
                style={{ animationDelay: `${index * 0.5}s` }}
              />
              <div
                className="absolute bottom-3 left-3 w-1.5 h-1.5 bg-blue-400/30 rounded-full animate-bounce"
                style={{ animationDelay: `${index * 0.7}s` }}
              />

              {/* Background Pattern */}
              <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
                <div className={`w-full h-full bg-gradient-to-br ${card.gradient} rounded-full blur-xl`} />
              </div>

              {/* Icon */}
              <div
                className={`
                  w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} 
                  flex items-center justify-center mb-4 
                  group-hover:scale-110 transition-transform duration-300
                  shadow-lg
                `}
              >
                <card.icon className="w-6 h-6 text-white" />
              </div>

              <h3 className="text-gray-400 text-sm mb-2 font-medium">{card.title}</h3>
              <p className="text-white text-2xl font-bold mb-1 group-hover:text-green-400 transition-colors duration-300">
                {card.amount}
              </p>
              {card.description && <p className="text-gray-500 text-xs leading-relaxed">{card.description}</p>}

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-8">
        <Button
          onClick={() => onNavigate("deposit")}
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3 h-12 rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25 hover:scale-[1.02] active:scale-[0.98] group"
        >
          <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
          Depositar
        </Button>
        <Button
          onClick={() => onNavigate("withdraw")}
          className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-8 py-3 h-12 rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-red-500/25 hover:scale-[1.02] active:scale-[0.98] group"
        >
          <Minus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
          Sacar
        </Button>

        {/* BOTÃO ADICIONAR SALDO - APENAS PARA DESENVOLVIMENTO */}
        {process.env.NODE_ENV === "development" && onAddBalance && (
          <Button
            onClick={handleAddBalance}
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-8 py-3 h-12 rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02] active:scale-[0.98] group"
          >
            <Gift className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />+ R$ 50 Bônus
          </Button>
        )}
      </div>

      {/* Transaction History */}
      <Card className="bg-black border-2 border-white/20 backdrop-blur-sm hover:border-white/40 transition-all duration-500">
        <CardContent className="p-8 relative">
          {/* Elementos flutuantes internos */}
          <div className="absolute top-4 right-4 w-1 h-1 bg-blue-400/40 rounded-full animate-pulse" />
          <div
            className="absolute bottom-6 left-6 w-2 h-2 bg-green-400/30 rounded-full animate-bounce"
            style={{ animationDelay: "1s" }}
          />

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Histórico de Transações</h2>
                <p className="text-gray-400 text-sm">Visualize seu histórico de depósitos e saques</p>
              </div>
            </div>
          </div>

          {/* Enhanced Tabs */}
          <div className="relative mb-8">
            <div className="flex gap-1 bg-gray-800/50 rounded-xl p-1 border border-gray-700">
              {[
                { id: "todos", label: "Todos" },
                { id: "depositos", label: "Depósitos" },
                { id: "saques", label: "Saques" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-all duration-300 relative
                    ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25"
                        : "text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Enhanced Transaction List */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader className="w-8 h-8 animate-spin text-green-500" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-400">{error}</div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions().map((transaction) => {
                const status = getStatusColors(transaction.status)
                const isNegative = ["withdrawal", "bet"].includes(transaction.type) || transaction.amount < 0
                const amountColor = isNegative ? "text-red-400" : "text-green-400"
                const amountPrefix = isNegative ? "-" : "+"

                return (
                  <div
                    key={transaction.id}
                    className="group relative overflow-hidden bg-gradient-to-r from-gray-800/50 to-gray-700/30 border border-gray-700 rounded-xl p-6 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 hover:scale-[1.01] cursor-pointer"
                  >
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
                      <div className="w-full h-full bg-gradient-to-br from-green-500 to-emerald-600 rounded-full blur-2xl" />
                    </div>

                    <div className="flex items-center justify-between relative">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg bg-gradient-to-br ${isNegative ? "from-red-500 to-pink-600" : "from-green-500 to-emerald-600"}`}>
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div>
                          <p className="text-white font-semibold text-lg group-hover:text-green-400 transition-colors duration-300">
                            {transaction.description}
                          </p>
                          <p className="text-gray-400 text-sm mt-1">{formatDate(transaction.created_at)}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <p className="text-gray-500 text-xs font-mono bg-gray-800/50 px-2 py-1 rounded-md">
                              {transaction.id.slice(0, 8).toUpperCase()}
                            </p>
                            <button 
                              className="text-gray-400 hover:text-white transition-colors duration-200"
                              onClick={(e) => {
                                e.stopPropagation()
                                navigator.clipboard.writeText(transaction.id)
                              }}
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`${amountColor} font-bold text-xl mb-1`}>
                          {amountPrefix}{formatCurrency(transaction.amount)}
                        </p>
                        <div
                          className={`
                            inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
                            ${status.bg} ${status.text} border border-current/20
                          `}
                        >
                          <div className="w-2 h-2 rounded-full bg-current mr-2 animate-pulse" />
                          {status.label}
                        </div>
                      </div>
                    </div>

                    {/* Hover Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  </div>
                )
              })}

              {filteredTransactions().length === 0 && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-700 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Nenhuma transação encontrada</h3>
                  <p className="text-gray-400 max-w-md mx-auto">
                    {activeTab === "depositos" 
                      ? "Você ainda não fez nenhum depósito." 
                      : activeTab === "saques" 
                        ? "Você ainda não fez nenhum saque."
                        : "Você ainda não tem nenhuma transação registrada."}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  )
}