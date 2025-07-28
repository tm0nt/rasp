"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageLayout } from "@/components/layout/page-layout"
import { DollarSign, AlertTriangle, CheckCircle, Users } from "lucide-react"
import { useToast } from "@/contexts/toast-context"
import clsx from "clsx"

interface WithdrawPageProps {
  onBack: () => void
  user: {
    id: string
    name: string
    email: string
    phone: string
    avatar?: string
    balance: number
    referralEarnings: number
  }
  onLogout: () => void
  onNavigate: (page: string, params?: any) => void
}

export function WithdrawPage({ onBack, user, onLogout, onNavigate }: WithdrawPageProps) {
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [pixKey, setPixKey] = useState("")
  const [cpf, setCpf] = useState("")
  const [pixKeyType, setPixKeyType] = useState<"cpf" | "email" | "phone" | "random">("cpf")
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<"balance" | "referral">("balance")
  const { showToast } = useToast()

  const minWithdraw = 10
  const availableAmount = selectedWallet === "balance" ? user.balance : user.referralEarnings
  const maxWithdraw = Math.min(availableAmount, 5000)

  // Formatadores de máscara
  const formatCpf = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,2})$/)
    if (!match) return value
    
    return !match[2] 
      ? match[1] 
      : `${match[1]}.${match[2]}${match[3] ? `.${match[3]}` : ''}${match[4] ? `-${match[4]}` : ''}`
  }

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    const match = cleaned.match(/^(\d{0,2})(\d{0,5})(\d{0,4})$/)
    if (!match) return value
    
    return !match[2] 
      ? `(${match[1]}` 
      : `(${match[1]}) ${match[2]}${match[3] ? `-${match[3]}` : ''}`
  }

  const formatCurrency = (value: string): string => {
    // Remove todos os caracteres não numéricos
    let cleaned = value.replace(/\D/g, '')
    
    // Converte para número e divide por 100 para obter os decimais
    const number = Number(cleaned) / 100
    
    // Formata para moeda BRL
    return number.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).replace('R$', '').trim()
  }

  const parseCurrency = (value: string): number => {
    // Remove todos os caracteres não numéricos e divide por 100
    return Number(value.replace(/\D/g, '')) / 100
  }

  const handleInputChange = (value: string, type: "cpf" | "email" | "phone" | "random") => {
    if (type === "cpf") {
      setPixKey(formatCpf(value).slice(0, 14))
    } else if (type === "phone") {
      setPixKey(formatPhone(value).slice(0, 15))
    } else {
      setPixKey(value)
    }
  }

  const handleCpfChange = (value: string) => {
    setCpf(formatCpf(value).slice(0, 14))
  }

  const handleAmountChange = (value: string) => {
    // Se o campo estiver vazio, limpa o valor
    if (value === '') {
      setWithdrawAmount('')
      return
    }
    
    // Formata o valor como moeda
    setWithdrawAmount(formatCurrency(value))
  }

  const handlePixKeyTypeChange = (type: "cpf" | "email" | "phone" | "random") => {
    // Mantém o valor atual se o tipo for o mesmo
    if (type === pixKeyType) return
    
    // Limpa apenas se o tipo for diferente
    if (type !== pixKeyType) {
      setPixKey('')
    }
    setPixKeyType(type)
  }

  const handleWithdraw = async () => {
    const amount = parseCurrency(withdrawAmount)
    const withdrawType = selectedWallet

    if (!amount || amount < minWithdraw || amount > maxWithdraw || !pixKey || !cpf) {
      showToast({
        type: "error",
        title: "❌ Dados inválidos",
        message: "Verifique o valor, a chave PIX e o CPF antes de continuar.",
        duration: 5000,
      })
      return
    }

    setIsProcessing(true)

    try {
      const response = await fetch('/api/user/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount, // Já está como float devido ao parseCurrency
          pixKey: pixKey.replace(/\D/g, ''), // Remove formatação
          pixKeyType, 
          withdrawType,
          cpf: cpf.replace(/\D/g, '') // Remove formatação do CPF
        })
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Erro ao processar saque')

      const updatedUser = {
        ...user,
        [selectedWallet === "balance" ? "balance" : "referralEarnings"]: availableAmount - amount
      }

      showToast({
        type: "success",
        title: "✅ Saque solicitado!",
        message: `Sua solicitação de R$ ${amount.toFixed(2)} foi enviada.`,
        duration: 8000,
      })

      try {
        await fetch('/api/email/withdrawal-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            name: user.name,
            amount,
            pixKeyType,
            withdrawalId: result.withdrawal.id,
          })
        })
      } catch (emailError) {
        console.error("Erro ao enviar email:", emailError)
      }

      setWithdrawAmount("")
      setPixKey("")
      setCpf("")
      onNavigate("wallet", { updatedUser })

    } catch (error: any) {
      showToast({
        type: "error",
        title: "❌ Erro no saque",
        message: error.message || "Tente novamente.",
        duration: 6000,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <PageLayout title="Sacar fundos" showBackButton onBack={onBack} user={user} onLogout={onLogout} onNavigate={onNavigate}>
      <div className="max-w-2xl mx-auto space-y-6 px-4">

        {/* Carteiras com estilo gradiente */}
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              label: "Saldo Principal",
              value: "balance",
              amount: user.balance,
              icon: <DollarSign className="w-5 h-5 text-white" />,
              gradient: "from-green-400 via-green-500 to-green-600"
            },
            {
              label: "Ganhos de Indicação",
              value: "referral",
              amount: user.referralEarnings,
              icon: <Users className="w-5 h-5 text-white" />,
              gradient: "from-blue-400 via-blue-500 to-blue-600"
            },
          ].map((wallet) => (
            <div
              key={wallet.value}
              onClick={() => setSelectedWallet(wallet.value as "balance" | "referral")}
              className={clsx(
                "rounded-2xl cursor-pointer p-4 shadow-lg transition border-2",
                selectedWallet === wallet.value
                  ? `border-white bg-gradient-to-r ${wallet.gradient}`
                  : "border-transparent bg-gray-800 hover:border-gray-600"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-white font-semibold">
                  {wallet.icon}
                  {wallet.label}
                </div>
              </div>
              <p className="text-2xl font-bold text-white">R$ {wallet.amount.toFixed(2)}</p>
            </div>
          ))}
        </div>

        {/* Formulário de saque */}
        <Card className="bg-gray-900/60 border border-gray-800 shadow-md rounded-2xl">
          <CardHeader>
            <CardTitle className="text-white">Solicitação de Saque</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-gray-300 mb-2">Valor (R$)</label>
              <Input
                type="text"
                placeholder="0,00"
                value={withdrawAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
              <div className="text-sm text-gray-400 mt-1 flex justify-between">
                <span>Mínimo: R$ {minWithdraw.toFixed(2)}</span>
                <span>Máximo: R$ {maxWithdraw.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Tipo de Chave PIX</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "cpf", label: "CPF" },
                  { value: "phone", label: "Telefone" },
                ].map((type) => (
                  <Button
                    key={type.value}
                    variant={pixKeyType === type.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePixKeyTypeChange(type.value as any)}
                    className={pixKeyType === type.value
                      ? "bg-green-500 hover:bg-green-600 text-white"
                      : "border-gray-600 text-gray-300 hover:bg-gray-800"}
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Chave PIX</label>
              <Input
                type="text"
                placeholder={
                  pixKeyType === "cpf"
                    ? "000.000.000-00"
                    : pixKeyType === "email"
                      ? "seu@email.com"
                      : pixKeyType === "phone"
                        ? "(00) 00000-0000"
                        : "Chave aleatória"
                }
                value={pixKey}
                onChange={(e) => handleInputChange(e.target.value, pixKeyType)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2">CPF do Titular</label>
              <Input
                type="text"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => handleCpfChange(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <Button
              onClick={handleWithdraw}
              disabled={
                !withdrawAmount ||
                parseCurrency(withdrawAmount) < minWithdraw ||
                parseCurrency(withdrawAmount) > maxWithdraw ||
                !pixKey ||
                !cpf ||
                isProcessing
              }
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 font-semibold rounded-xl"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processando...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Solicitar Saque
                </div>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Informações Importantes */}
        <Card className="bg-yellow-900/10 border border-yellow-500/20 rounded-2xl shadow">
          <CardHeader>
            <CardTitle className="text-yellow-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Informações Importantes
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300 space-y-2 text-sm">
            <p>• Saque mínimo: R$ {minWithdraw.toFixed(2)}</p>
            <p>• Processamento: até 24 horas em dias úteis</p>
            <p>• A chave PIX deve estar no seu nome (CPF)</p>
            <p>• Não cobramos taxas para saques</p>
            <p>• Você receberá um email de confirmação</p>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}