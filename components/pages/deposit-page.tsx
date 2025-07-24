"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { PageLayout } from "@/components/layout/page-layout"
import { Shield, QrCode, Copy, Clock, AlertCircle } from "lucide-react"
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

interface PixPaymentData {
  qrcode: string
  transactionId: string
  amount: number
  expiration: string
  qrCodeImage?: string
}

export function DepositPage({ onBack, user, onLogout, onNavigate }: DepositPageProps) {
  const [selectedAmount, setSelectedAmount] = useState(40)
  const [customAmount, setCustomAmount] = useState("40")
  const [cpf, setCpf] = useState("")
  const [currentStep, setCurrentStep] = useState<"form" | "pix" | "expired">("form")
  const [isCpfFocused, setIsCpfFocused] = useState(false)
  const [isAmountFocused, setIsAmountFocused] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [pixData, setPixData] = useState<PixPaymentData | null>(null)
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes in seconds
  const { showToast } = useToast()
  const qrCodeCanvasRef = useRef<HTMLCanvasElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const predefinedAmounts = [20, 40, 80, 160, 200, 400]

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount)
    setCustomAmount(amount.toString())
  }

  const handleCustomAmountChange = (value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, "")
    setCustomAmount(numericValue)
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



  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const getTimerColor = () => {
    if (timeLeft > 300) return "text-green-400" // > 5 minutes
    if (timeLeft > 120) return "text-yellow-400" // > 2 minutes
    return "text-red-400" // < 2 minutes
  }

  const getTimerBorderColor = () => {
    if (timeLeft > 300) return "border-green-500/30" // > 5 minutes
    if (timeLeft > 120) return "border-yellow-500/30" // > 2 minutes
    return "border-red-500/30" // < 2 minutes
  }

  const getTimerBgColor = () => {
    if (timeLeft > 300) return "bg-green-500/10" // > 5 minutes
    if (timeLeft > 120) return "bg-yellow-500/10" // > 2 minutes
    return "bg-red-500/10" // < 2 minutes
  }

  const handleGeneratePayment = async () => {
    const amount = getCurrentAmount()
    if (amount < 20 || !cpf) {
      showToast({
        type: "error",
        title: "❌ Dados inválidos",
        message: "Verifique o valor (mínimo R$ 20,00) e CPF antes de continuar.",
        duration: 5000,
      })
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch("/api/user/deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          amount: amount,
          cpf: cpf.replace(/\D/g, ""),
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || "Erro ao gerar PIX")
      }

      const paymentData = {
        qrcode: data.qrcode,
        transactionId: data.transactionId,
        amount: amount,
        expiration: data.expiration,
      }

      setPixData(paymentData)
      setTimeLeft(600) // Reset timer to 10 minutes
      setCurrentStep("pix")

      showToast({
        type: "info",
        title: "💳 PIX gerado",
        message: `PIX de R$ ${amount.toFixed(2)} gerado com sucesso.`,
        duration: 5000,
      })
    } catch (error) {
      console.error("Payment generation error:", error)
      showToast({
        type: "error",
        title: "❌ Erro no PIX",
        message: "Não foi possível gerar o PIX. Tente novamente.",
        duration: 6000,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePaymentBack = () => {
    setCurrentStep("form")
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
  }

  const handlePaymentSuccess = async () => {
    const amount = getCurrentAmount()
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    showToast({
      type: "success",
      title: "💰 Depósito confirmado!",
      message: `R$ ${amount.toFixed(2)} foi adicionado à sua conta com sucesso.`,
      duration: 8000,
    })

    const handlePaymentSuccess = async () => {
  const amount = getCurrentAmount()

  if (timerRef.current) {
    clearInterval(timerRef.current)
  }

  showToast({
    type: "success",
    title: "💰 Depósito confirmado!",
    message: `R$ ${amount.toFixed(2)} foi adicionado à sua conta com sucesso.`,
    duration: 8000,
  })

  // 🔵 Facebook Pixel - Evento de compra
  if (window.fbq) {
    window.fbq('track', 'Purchase', {
      value: amount,
      currency: 'BRL',
    })
  }

  // 🟢 Google Ads / Analytics - Conversão
  if (window.gtag) {
    window.gtag('event', 'purchase', {
      value: amount,
      currency: 'BRL',
      transaction_id: `txn-${Date.now()}`, // ou use um ID real se tiver
    })
  }

  setTimeout(() => {
    onNavigate("wallet")
  }, 2000)
}


    setTimeout(() => {
      onNavigate("wallet")
    }, 2000)
  }

  const handleTimerExpired = () => {
    setCurrentStep("expired")
    showToast({
      type: "error",
      title: "⏰ PIX expirado",
      message: "O tempo para pagamento expirou. Gere um novo PIX.",
      duration: 6000,
    })
  }

  // Timer effect
  useEffect(() => {
    if (currentStep === "pix" && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerExpired()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
      }
    }
  }, [currentStep, timeLeft])

  // Payment status check effect
  useEffect(() => {
    if (currentStep !== "pix" || !pixData?.transactionId) return

    const checkPaymentStatus = async () => {
      try {
        const response = await fetch(`/api/user/deposit/${pixData.transactionId}`)
        const data = await response.json()
        if (data.paid) {
          handlePaymentSuccess()
        }
      } catch (error) {
        console.error("Error checking payment status:", error)
      }
    }

    const interval = setInterval(checkPaymentStatus, 5000)
    return () => clearInterval(interval)
  }, [currentStep, pixData])

  const ExpiredScreen = () => (
    <div className="max-w-md mx-auto">
      <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
        <CardContent className="p-6 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-white text-xl font-bold mb-2">PIX Expirado</h3>
            <p className="text-gray-400">O tempo para pagamento expirou.</p>
          </div>

          <Button onClick={() => setCurrentStep("form")} className="w-full bg-green-600 hover:bg-green-700 text-white">
            Gerar novo PIX
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  const PixPaymentScreen = () => {
    const handleCopyCode = () => {
      navigator.clipboard.writeText(pixData?.qrcode || "")
      showToast({
        type: "success",
        title: "Copiado!",
        message: "Código PIX copiado para a área de transferência.",
        duration: 3000,
      })
    }

    return (
      <div className="max-w-md mx-auto">
        <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <h3 className="text-white text-xl font-bold mb-2">Pagamento via PIX</h3>
              <p className="text-gray-400">
                Valor: <span className="text-green-400 font-semibold">R$ {pixData?.amount.toFixed(2)}</span>
              </p>
            </div>

            {/* Timer */}
            <div
              className={`mb-6 p-4 rounded-xl border ${getTimerBorderColor()} ${getTimerBgColor()} backdrop-blur-sm`}
            >
              <div className="flex items-center justify-center gap-3">
                <Clock className={`w-5 h-5 ${getTimerColor()}`} />
                <div className="text-center">
                  <p className="text-gray-300 text-sm">Tempo restante</p>
                  <p className={`text-2xl font-bold font-mono ${getTimerColor()}`}>{formatTime(timeLeft)}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3 w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-1000 ${
                    timeLeft > 300 ? "bg-green-500" : timeLeft > 120 ? "bg-yellow-500" : "bg-red-500"
                  }`}
                  style={{ width: `${(timeLeft / 600) * 100}%` }}
                />
              </div>
            </div>

            {/* QR Code */}
            <div className="p-6 rounded-xl  mb-6 flex justify-center shadow-lg">
  <img 
    src={`https://quickchart.io/qr?text=${(pixData?.qrcode || '')}&size=300`}
    alt="QR Code para pagamento PIX"
    width="300"
    height="300"
    className="rounded-lg"
  />            </div>

            {/* PIX Code */}
            <div className="mb-6">
              <p className="text-gray-300 text-sm mb-2">Código PIX (copie e cole no seu banco):</p>
              <div className="relative">
                <Input value={pixData?.qrcode || ""} readOnly className="bg-gray-800 text-gray-200 pr-10 text-xs" />
                <button
                  onClick={handleCopyCode}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
              <p className="text-blue-400 text-sm text-center">
                Escaneie o QR Code ou copie o código para pagar via seu app bancário
              </p>
            </div>

            <div className="flex gap-3">
              <Button onClick={handlePaymentBack} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white">
                Voltar
              </Button>
              <Button onClick={handlePaymentSuccess} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                Já paguei
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (currentStep === "expired") {
    return (
      <PageLayout
        title="PIX Expirado"
        showBackButton
        onBack={() => setCurrentStep("form")}
        user={user}
        onLogout={onLogout}
        onNavigate={onNavigate}
      >
        <ExpiredScreen />
      </PageLayout>
    )
  }

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
        <PixPaymentScreen />
      </PageLayout>
    )
  }

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
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-8 backdrop-blur-sm">
              <Shield className="w-5 h-5 text-green-400" />
              <span className="text-green-400 text-sm font-medium">Método de pagamento seguro</span>
            </div>

            <div className="mb-8">
              <h3 className="text-white text-lg font-semibold mb-6">Método de pagamento</h3>
              <div className="grid grid-cols-1 gap-4">
                <button className="relative flex items-center justify-center gap-3 p-6 rounded-xl border-2 border-green-500 bg-green-500/10 text-green-400 shadow-lg shadow-green-500/20">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-transparent to-green-500/10 animate-pulse" />
                  <QrCode className="w-6 h-6 relative z-10" />
                  <div className="text-left relative z-10">
                    <p className="font-semibold">PIX</p>
                    <p className="text-xs opacity-80">Pagamento instantâneo</p>
                  </div>
                </button>
              </div>
            </div>

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

            <div className="mb-8">
              <h3 className="text-white text-lg font-semibold mb-6">Digite ou selecione o valor</h3>
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
                  type="text"
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
                />
                {isAmountFocused && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-400/20 via-transparent to-green-400/20 animate-pulse pointer-events-none" />
                )}
              </div>
              <div className="flex justify-start text-sm text-gray-400 mt-3">
                <span>Mínimo: R$ 20,00</span>
              </div>
            </div>

            <Button
              onClick={handleGeneratePayment}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 h-14 text-lg font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={getCurrentAmount() < 20 || !cpf || isProcessing}
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Processando...
                </>
              ) : (
                <>
                  <QrCode className="w-5 h-5 mr-2" />
                  Gerar PIX
                </>
              )}
            </Button>

            {getCurrentAmount() > 0 && (
              <div className="mt-6 text-center p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                <p className="text-gray-400 text-sm">Valor selecionado:</p>
                <p className="text-white text-xl font-bold">R$ {getCurrentAmount().toFixed(2).replace(".", ",")}</p>
              </div>
            )}

            <div className="mt-6 p-4 bg-gray-800/30 border border-gray-700 rounded-xl backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <QrCode className="w-5 h-5 text-green-400 mt-0.5" />
                <div>
                  <p className="text-white font-medium mb-1">Pagamento via PIX</p>
                  <p className="text-gray-400 text-sm">
                    Seu depósito será processado instantaneamente após a confirmação do pagamento.
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
