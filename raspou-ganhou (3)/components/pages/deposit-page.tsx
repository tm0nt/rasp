"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { PageLayout } from "@/components/layout/page-layout"
import { Shield, QrCode, CreditCard, Smartphone } from "lucide-react"
import { PixPayment } from "@/components/payment/pix-payment"
import { CreditCardForm } from "@/components/payment/credit-card-form"
import { useToast } from "@/contexts/toast-context"

interface DepositPageProps {
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
 * Deposit page component for adding funds
 * TODO: API INTEGRATION - Complete payment processing system
 */
export function DepositPage({ onBack, user, onLogout, onNavigate }: DepositPageProps) {
  const [selectedAmount, setSelectedAmount] = useState(40)
  const [customAmount, setCustomAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "credit">("pix")
  const [cpf, setCpf] = useState("")
  const [currentStep, setCurrentStep] = useState<"form" | "pix" | "credit">("form")
  const [isCpfFocused, setIsCpfFocused] = useState(false)
  const [isAmountFocused, setIsAmountFocused] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const { showToast } = useToast()

  const predefinedAmounts = [20, 40, 80, 160, 200, 400]

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount)
    setCustomAmount("")
  }

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value)
    setSelectedAmount(0)
  }

  const getCurrentAmount = () => {
    return customAmount ? Number.parseFloat(customAmount) || 0 : selectedAmount
  }

  const formatCPF = (value: string) => {
    const numericValue = value.replace(/\D/g, "")
    if (numericValue.length <= 11) {
      return numericValue
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    }
    return numericValue.slice(0, 11).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  }

  const handleCPFChange = (value: string) => {
    const formattedCPF = formatCPF(value)
    setCpf(formattedCPF)
  }

  /**
   * Handle payment generation
   * TODO: API INTEGRATION - Initialize payment process
   */
  const handleGeneratePayment = async () => {
    const amount = getCurrentAmount()

    if (amount < 20 || amount > 5000 || !cpf) {
      showToast({
        type: "error",
        title: "❌ Dados inválidos",
        message: "Verifique o valor (R$ 20,00 - R$ 5.000,00) e CPF antes de continuar.",
        duration: 5000,
      })
      return
    }

    setIsProcessing(true)

    try {
      // TODO: API INTEGRATION - Create payment intent
      // const response = await fetch('/api/payments/create-intent', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
      //   },
      //   body: JSON.stringify({
      //     userId: user.id,
      //     amount: amount,
      //     method: paymentMethod,
      //     cpf: cpf.replace(/\D/g, ''),
      //     currency: 'BRL'
      //   })
      // })
      // const paymentIntent = await response.json()
      // if (!response.ok) {
      //   throw new Error(paymentIntent.message || 'Erro ao criar pagamento')
      // }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      if (paymentMethod === "pix") {
        setCurrentStep("pix")
      } else {
        setCurrentStep("credit")
      }

      showToast({
        type: "info",
        title: "💳 Pagamento iniciado",
        message: `Processando pagamento de R$ ${amount.toFixed(2)} via ${paymentMethod === "pix" ? "PIX" : "cartão"}.`,
        duration: 5000,
      })

      // TODO: API INTEGRATION - Track payment initiation
      // await fetch('/api/analytics/track', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     event: 'payment_initiated',
      //     userId: user.id,
      //     properties: {
      //       amount,
      //       method: paymentMethod,
      //       timestamp: new Date().toISOString()
      //     }
      //   })
      // })
    } catch (error) {
      console.error("Payment generation error:", error)

      showToast({
        type: "error",
        title: "❌ Erro no pagamento",
        message: "Não foi possível iniciar o pagamento. Tente novamente.",
        duration: 6000,
      })

      // TODO: API INTEGRATION - Log payment errors
      // await fetch('/api/errors/log', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     error: error.message,
      //     context: 'payment_generation',
      //     userId: user.id,
      //     amount,
      //     method: paymentMethod,
      //     timestamp: new Date().toISOString()
      //   })
      // })
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePaymentBack = () => {
    setCurrentStep("form")
  }

  /**
   * Handle successful payment confirmation
   * TODO: API INTEGRATION - Confirm payment and update balance
   */
  const handlePaymentSuccess = async (paymentData?: any) => {
    const amount = getCurrentAmount()

    try {
      // TODO: API INTEGRATION - Confirm payment
      // const response = await fetch('/api/payments/confirm', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
      //   },
      //   body: JSON.stringify({
      //     userId: user.id,
      //     amount,
      //     method: paymentMethod,
      //     paymentData,
      //     transactionId: paymentData?.transactionId
      //   })
      // })
      // const result = await response.json()
      // if (!response.ok) {
      //   throw new Error(result.message || 'Erro na confirmação do pagamento')
      // }

      showToast({
        type: "success",
        title: "💰 Depósito confirmado!",
        message: `R$ ${amount.toFixed(2)} foi adicionado à sua conta com sucesso. Novo saldo: R$ ${(user.balance + amount).toFixed(2)}.`,
        duration: 8000,
      })

      // TODO: API INTEGRATION - Send deposit confirmation email
      // await fetch('/api/email/deposit-confirmation', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     email: user.email,
      //     name: user.name,
      //     amount,
      //     method: paymentMethod,
      //     transactionId: paymentData?.transactionId || 'DEMO123',
      //     timestamp: new Date().toISOString()
      //   })
      // })

      // TODO: API INTEGRATION - Track successful deposit
      // await fetch('/api/analytics/track', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     event: 'deposit_completed',
      //     userId: user.id,
      //     properties: {
      //       amount,
      //       method: paymentMethod,
      //       transactionId: paymentData?.transactionId,
      //       timestamp: new Date().toISOString()
      //     }
      //   })
      // })

      // Navigate to wallet after success
      setTimeout(() => {
        onNavigate("wallet")
      }, 2000)
    } catch (error) {
      console.error("Payment confirmation error:", error)

      showToast({
        type: "error",
        title: "❌ Erro na confirmação",
        message: "Houve um problema na confirmação do pagamento. Entre em contato com o suporte.",
        duration: 8000,
      })

      // TODO: API INTEGRATION - Log payment confirmation errors
      // await fetch('/api/errors/log', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     error: error.message,
      //     context: 'payment_confirmation',
      //     userId: user.id,
      //     amount,
      //     paymentData,
      //     timestamp: new Date().toISOString()
      //   })
      // })
    }
  }

  // Render payment screens
  if (currentStep === "pix") {
    return (
      <PageLayout
        title="Pagamento PIX"
        showBackButton
        onBack={handlePaymentBack}
        user={user}
        onLogout={onLogout}
        onNavigate={onNavigate}
      >
        <PixPayment amount={getCurrentAmount()} onBack={handlePaymentBack} onPaymentConfirmed={handlePaymentSuccess} />
      </PageLayout>
    )
  }

  if (currentStep === "credit") {
    return (
      <PageLayout
        title="Pagamento com Cartão"
        showBackButton
        onBack={handlePaymentBack}
        user={user}
        onLogout={onLogout}
        onNavigate={onNavigate}
      >
        <CreditCardForm amount={getCurrentAmount()} onBack={handlePaymentBack} onPaymentSubmit={handlePaymentSuccess} />
      </PageLayout>
    )
  }

  // Default form screen
  return (
    <PageLayout
      title="Adicionar fundos"
      showBackButton
      onBack={onBack}
      user={user}
      onLogout={onLogout}
      onNavigate={onNavigate}
    >
      <div className="max-w-2xl mx-auto">
        <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
          <CardContent className="p-8">
            {/* Security Badge */}
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-8 backdrop-blur-sm">
              <Shield className="w-5 h-5 text-green-400" />
              <span className="text-green-400 text-sm font-medium">Método de pagamento seguro</span>
            </div>

            {/* Payment Method Selection */}
            <div className="mb-8">
              <h3 className="text-white text-lg font-semibold mb-6">Selecione o método de pagamento</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setPaymentMethod("pix")}
                  className={`
                    relative flex items-center justify-center gap-3 p-6 rounded-xl border-2 
                    transition-all duration-300 group overflow-hidden
                    ${
                      paymentMethod === "pix"
                        ? "border-green-500 bg-green-500/10 text-green-400 shadow-lg shadow-green-500/20"
                        : "border-gray-600 bg-transparent text-gray-300 hover:border-gray-500 hover:bg-gray-800/30"
                    }
                  `}
                >
                  {paymentMethod === "pix" && (
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-transparent to-green-500/10 animate-pulse" />
                  )}
                  <Smartphone className="w-6 h-6 relative z-10" />
                  <div className="text-left relative z-10">
                    <p className="font-semibold">PIX</p>
                    <p className="text-xs opacity-80">Instantâneo</p>
                  </div>
                </button>
                <button
                  onClick={() => setPaymentMethod("credit")}
                  className={`
                    relative flex items-center justify-center gap-3 p-6 rounded-xl border-2 
                    transition-all duration-300 group overflow-hidden
                    ${
                      paymentMethod === "credit"
                        ? "border-green-500 bg-green-500/10 text-green-400 shadow-lg shadow-green-500/20"
                        : "border-gray-600 bg-transparent text-gray-300 hover:border-gray-500 hover:bg-gray-800/30"
                    }
                  `}
                >
                  {paymentMethod === "credit" && (
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-transparent to-green-500/10 animate-pulse" />
                  )}
                  <CreditCard className="w-6 h-6 relative z-10" />
                  <div className="text-left relative z-10">
                    <p className="font-semibold">Cartão</p>
                    <p className="text-xs opacity-80">Crédito/Débito</p>
                  </div>
                </button>
              </div>
            </div>

            {/* CPF Input */}
            <div className="mb-8">
              <h3 className="text-white text-lg font-semibold mb-6">Dados pessoais</h3>
              <div className="relative group">
                <label className="block text-gray-300 text-sm font-medium mb-3">CPF</label>
                <Input
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => handleCPFChange(e.target.value)}
                  onFocus={() => setIsCpfFocused(true)}
                  onBlur={() => setIsCpfFocused(false)}
                  className={`
                    bg-transparent border-2 text-white placeholder-gray-400 
                    py-4 h-14 text-base px-4
                    transition-all duration-300 ease-out
                    border-gray-600 hover:border-gray-500
                    focus:border-green-400 focus:shadow-lg focus:shadow-green-400/20
                    focus:bg-green-400/5
                    group-hover:bg-gray-800/20
                    rounded-xl
                    ${isCpfFocused ? "ring-2 ring-green-400/30" : ""}
                  `}
                  maxLength={14}
                  required
                />
                {isCpfFocused && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-400/20 via-transparent to-green-400/20 animate-pulse pointer-events-none" />
                )}
              </div>
            </div>

            {/* Amount Selection */}
            <div className="mb-8">
              <h3 className="text-white text-lg font-semibold mb-6">Digite ou selecione o valor</h3>

              {/* Predefined Amounts */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {predefinedAmounts.map((amount) => (
                  <Button
                    key={amount}
                    onClick={() => handleAmountSelect(amount)}
                    className={`
                      py-4 h-14 rounded-xl border-2 transition-all duration-300
                      ${
                        selectedAmount === amount
                          ? "bg-green-500 hover:bg-green-600 text-white border-green-500 shadow-lg shadow-green-500/25"
                          : "bg-transparent border-gray-600 text-gray-300 hover:text-white hover:bg-gray-800/30 hover:border-gray-500"
                      }
                    `}
                  >
                    R$ {amount},00
                  </Button>
                ))}
              </div>

              {/* Custom Amount Input */}
              <div className="relative group">
                <span
                  className={`
                  absolute left-4 top-1/2 -translate-y-1/2 z-10 transition-all duration-300
                  ${isAmountFocused ? "text-green-400" : "text-gray-400"}
                `}
                >
                  R$
                </span>
                <Input
                  type="number"
                  placeholder="40"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  onFocus={() => setIsAmountFocused(true)}
                  onBlur={() => setIsAmountFocused(false)}
                  className={`
                    bg-transparent border-2 text-white placeholder-gray-400 
                    pl-12 py-4 h-14 text-lg
                    transition-all duration-300 ease-out
                    border-gray-600 hover:border-gray-500
                    focus:border-green-400 focus:shadow-lg focus:shadow-green-400/20
                    focus:bg-green-400/5
                    group-hover:bg-gray-800/20
                    rounded-xl
                    ${isAmountFocused ? "ring-2 ring-green-400/30" : ""}
                  `}
                  min="20"
                  max="5000"
                />
                {isAmountFocused && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-400/20 via-transparent to-green-400/20 animate-pulse pointer-events-none" />
                )}
              </div>

              <div className="flex justify-between text-sm text-gray-400 mt-3">
                <span>Mínimo: R$ 20,00</span>
                <span>Máximo: R$ 5.000,00</span>
              </div>
            </div>

            {/* Generate Payment Button */}
            <Button
              onClick={handleGeneratePayment}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 h-14 text-lg font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={getCurrentAmount() < 20 || getCurrentAmount() > 5000 || !cpf || isProcessing}
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Processando...
                </>
              ) : paymentMethod === "pix" ? (
                <>
                  <QrCode className="w-5 h-5 mr-2" />
                  Gerar PIX
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pagar com Cartão
                </>
              )}
            </Button>

            {/* Amount Display */}
            {getCurrentAmount() > 0 && (
              <div className="mt-6 text-center p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                <p className="text-gray-400 text-sm">Valor selecionado:</p>
                <p className="text-white text-xl font-bold">R$ {getCurrentAmount().toFixed(2).replace(".", ",")}</p>
              </div>
            )}

            {/* Payment Method Info */}
            <div className="mt-6 p-4 bg-gray-800/30 border border-gray-700 rounded-xl backdrop-blur-sm">
              <div className="flex items-start gap-3">
                {paymentMethod === "pix" ? (
                  <Smartphone className="w-5 h-5 text-green-400 mt-0.5" />
                ) : (
                  <CreditCard className="w-5 h-5 text-blue-400 mt-0.5" />
                )}
                <div>
                  <p className="text-white font-medium mb-1">
                    {paymentMethod === "pix" ? "Pagamento via PIX" : "Pagamento via Cartão"}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {paymentMethod === "pix"
                      ? "Seu depósito será processado instantaneamente após a confirmação do pagamento."
                      : "Processamento em até 2 minutos. Aceitamos cartões de crédito e débito."}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
