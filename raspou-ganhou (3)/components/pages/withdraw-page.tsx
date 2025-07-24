"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageLayout } from "@/components/layout/page-layout"
import { DollarSign, AlertTriangle, CheckCircle } from "lucide-react"
import { useToast } from "@/contexts/toast-context"

interface WithdrawPageProps {
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
  onNavigate: (page: string) => void
}

/**
 * Withdrawal page component
 * TODO: API INTEGRATION - Complete withdrawal processing system
 */
export function WithdrawPage({ onBack, user, onLogout, onNavigate }: WithdrawPageProps) {
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [pixKey, setPixKey] = useState("")
  const [pixKeyType, setPixKeyType] = useState<"cpf" | "email" | "phone" | "random">("cpf")
  const [isProcessing, setIsProcessing] = useState(false)
  const { showToast } = useToast()

  const minWithdraw = 10
  const maxWithdraw = Math.min(user.balance, 5000)

  /**
   * Handle withdrawal request
   * TODO: API INTEGRATION - Process withdrawal through payment system
   */
  const handleWithdraw = async () => {
    const amount = Number.parseFloat(withdrawAmount)

    if (!amount || amount < minWithdraw || amount > maxWithdraw || !pixKey) {
      showToast({
        type: "error",
        title: "❌ Dados inválidos",
        message: "Verifique o valor e a chave PIX antes de continuar.",
        duration: 5000,
      })
      return
    }

    setIsProcessing(true)

    try {
      // TODO: API INTEGRATION - Create withdrawal request
      // const response = await fetch('/api/withdrawals/create', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
      //   },
      //   body: JSON.stringify({
      //     userId: user.id,
      //     amount,
      //     pixKey,
      //     pixKeyType,
      //     currency: 'BRL'
      //   })
      // })
      // const result = await response.json()
      // if (!response.ok) {
      //   throw new Error(result.message || 'Erro ao processar saque')
      // }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      showToast({
        type: "success",
        title: "✅ Saque solicitado!",
        message: `Sua solicitação de saque de R$ ${amount.toFixed(2)} foi enviada. O valor será processado em até 24 horas.`,
        duration: 8000,
      })

      // TODO: API INTEGRATION - Send withdrawal confirmation email
      // await fetch('/api/email/withdrawal-confirmation', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     email: user.email,
      //     name: user.name,
      //     amount,
      //     pixKey,
      //     withdrawalId: result.withdrawalId,
      //     timestamp: new Date().toISOString()
      //   })
      // })

      // TODO: API INTEGRATION - Track withdrawal request
      // await fetch('/api/analytics/track', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     event: 'withdrawal_requested',
      //     userId: user.id,
      //     properties: {
      //       amount,
      //       pixKeyType,
      //       timestamp: new Date().toISOString()
      //     }
      //   })
      // })

      // Reset form
      setWithdrawAmount("")
      setPixKey("")

      // Navigate back to wallet
      setTimeout(() => {
        onNavigate("wallet")
      }, 2000)
    } catch (error) {
      console.error("Withdrawal error:", error)

      showToast({
        type: "error",
        title: "❌ Erro no saque",
        message: "Não foi possível processar sua solicitação de saque. Tente novamente.",
        duration: 6000,
      })

      // TODO: API INTEGRATION - Log withdrawal errors
      // await fetch('/api/errors/log', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     error: error.message,
      //     context: 'withdrawal_processing',
      //     userId: user.id,
      //     amount,
      //     pixKey,
      //     timestamp: new Date().toISOString()
      //   })
      // })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <PageLayout
      title="Sacar fundos"
      showBackButton
      onBack={onBack}
      user={user}
      onLogout={onLogout}
      onNavigate={onNavigate}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Balance Card */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              Saldo Disponível
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-400">R$ {user.balance.toFixed(2)}</p>
            <p className="text-gray-400 text-sm mt-1">Valor máximo para saque: R$ {maxWithdraw.toFixed(2)}</p>
          </CardContent>
        </Card>

        {/* Withdrawal Form */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Dados do Saque</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Amount Input */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Valor do Saque (R$)</label>
              <Input
                type="number"
                placeholder="0,00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                min={minWithdraw}
                max={maxWithdraw}
                step="0.01"
              />
              <div className="flex justify-between text-sm text-gray-400 mt-1">
                <span>Mínimo: R$ {minWithdraw.toFixed(2)}</span>
                <span>Máximo: R$ {maxWithdraw.toFixed(2)}</span>
              </div>
            </div>

            {/* PIX Key Type */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Tipo de Chave PIX</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "cpf", label: "CPF" },
                  { value: "email", label: "Email" },
                  { value: "phone", label: "Telefone" },
                  { value: "random", label: "Aleatória" },
                ].map((type) => (
                  <Button
                    key={type.value}
                    variant={pixKeyType === type.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPixKeyType(type.value as any)}
                    className={
                      pixKeyType === type.value
                        ? "bg-green-500 hover:bg-green-600"
                        : "border-gray-600 text-gray-300 hover:bg-gray-800"
                    }
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* PIX Key Input */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Chave PIX</label>
              <Input
                type="text"
                placeholder={
                  pixKeyType === "cpf"
                    ? "000.000.000-00"
                    : pixKeyType === "email"
                      ? "seu@email.com"
                      : pixKeyType === "phone"
                        ? "(11) 99999-9999"
                        : "Chave aleatória"
                }
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            {/* Withdraw Button */}
            <Button
              onClick={handleWithdraw}
              disabled={
                !withdrawAmount ||
                Number.parseFloat(withdrawAmount) < minWithdraw ||
                Number.parseFloat(withdrawAmount) > maxWithdraw ||
                !pixKey ||
                isProcessing
              }
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Solicitar Saque
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Important Information */}
        <Card className="bg-yellow-900/20 border-yellow-500/30">
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
