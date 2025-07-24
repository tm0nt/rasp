"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { PageLayout } from "@/components/layout/page-layout"
import { Shield, QrCode, Copy } from "lucide-react"
import { useToast } from "@/contexts/toast-context"
import QRCode from "react-qr-code"

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
  qrcodeText: string
  transactionId: string
  amount: number
  expiration: string
}

export function DepositPage({ onBack, user, onLogout, onNavigate }: DepositPageProps) {
  const [selectedAmount, setSelectedAmount] = useState(40)
  const [customAmount, setCustomAmount] = useState("")
  const [cpf, setCpf] = useState("")
  const [currentStep, setCurrentStep] = useState<"form" | "pix">("form")
  const [isCpfFocused, setIsCpfFocused] = useState(false)
  const [isAmountFocused, setIsAmountFocused] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [pixData, setPixData] = useState<PixPaymentData | null>(null)
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
      const response = await fetch('/api/user/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          amount: amount,
          cpf: cpf.replace(/\D/g, ''),
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao gerar PIX')
      }

      setPixData({
        qrcode: data.qrcode,
        qrcodeText: data.qrcodeText,
        transactionId: data.transactionId,
        amount: amount,
        expiration: data.expiration
      })

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
  }

  const handlePaymentSuccess = async () => {
    const amount = getCurrentAmount()

    showToast({
      type: "success",
      title: "💰 Depósito confirmado!",
      message: `R$ ${amount.toFixed(2)} foi adicionado à sua conta com sucesso.`,
      duration: 8000,
    })

    setTimeout(() => {
      onNavigate("wallet")
    }, 2000)
  }

  const PixPaymentScreen = () => {
    const handleCopyCode = () => {
      navigator.clipboard.writeText(pixData?.qrcodeText || '')
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
              <p className="text-gray-400">Valor: <span className="text-green-400 font-semibold">R$ {pixData?.amount.toFixed(2)}</span></p>
            </div>

            <div className="bg-white p-4 rounded-lg mb-6 flex justify-center">
              <QRCode 
                value={pixData?.qrcode || ''} 
                size={200}
                level="H"
              />
            </div>

            <div className="mb-6">
              <p className="text-gray-300 text-sm mb-2">Código PIX (copie e cole no seu banco):</p>
              <div className="relative">
                <Input
                  value={pixData?.qrcodeText || ''}
                  readOnly
                  className="bg-gray-800 text-gray-200 pr-10"
                />
                <button
                  onClick={handleCopyCode}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="text-center text-sm text-gray-400 mb-6">
              <p>Expira em: {new Date(pixData?.expiration || '').toLocaleString() || '30 minutos'}</p>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
              <p className="text-blue-400 text-sm text-center">
                Escaneie o QR Code ou copie o código para pagar via seu app bancário
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handlePaymentBack}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white"
              >
                Voltar
              </Button>
              <Button
                onClick={handlePaymentSuccess}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Já paguei
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
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
                <button
                  className="relative flex items-center justify-center gap-3 p-6 rounded-xl border-2 border-green-500 bg-green-500/10 text-green-400 shadow-lg shadow-green-500/20"
                >
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