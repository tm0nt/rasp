"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { PageLayout } from "@/components/layout/page-layout"
import { DollarSign, AlertTriangle, CheckCircle, Users, Copy, Clock, X, ChevronDown, ChevronUp } from "lucide-react"
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
  taxWithdrawal: number
  onLogout: () => void
  onNavigate: (page: string, params?: any) => void
}

interface PixData {
  qrcode: string
  transactionId: string
  amount: number
  expiration: string
}

export function WithdrawPage({ onBack, user, onLogout, onNavigate, taxWithdrawal }: WithdrawPageProps) {
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [pixKey, setPixKey] = useState("")
  const [cpf, setCpf] = useState("")
  const [pixKeyType, setPixKeyType] = useState<"cpf" | "email" | "phone" | "random">("cpf")
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<"balance" | "referral">("balance")
  const [showTaxModal, setShowTaxModal] = useState(false)
  const [pixData, setPixData] = useState<PixData | null>(null)
  const [timeLeft, setTimeLeft] = useState(900) // 15 minutos em segundos
  const [isLoadingPix, setIsLoadingPix] = useState(false)
  const [showPixOnly, setShowPixOnly] = useState(false)
  const [isTextExpanded, setIsTextExpanded] = useState(true)
  const { showToast } = useToast()

  const minWithdraw = 10
  const availableAmount = selectedWallet === "balance" ? user.balance : user.referralEarnings
  const maxWithdraw = Math.min(availableAmount, 5000)

  // Timer countdown
  useEffect(() => {
    if (showTaxModal && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [showTaxModal, timeLeft])

  // Formatadores de máscara
  const formatCpf = (value: string) => {
    const cleaned = value.replace(/\D/g, "")
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,2})$/)
    if (!match) return value
    return !match[2]
      ? match[1]
      : `${match[1]}.${match[2]}${match[3] ? `.${match[3]}` : ""}${match[4] ? `-${match[4]}` : ""}`
  }

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, "")
    const match = cleaned.match(/^(\d{0,2})(\d{0,5})(\d{0,4})$/)
    if (!match) return value
    return !match[2] ? `(${match[1]}` : `(${match[1]}) ${match[2]}${match[3] ? `-${match[3]}` : ""}`
  }

  const formatCurrency = (value: string): string => {
    const cleaned = value.replace(/\D/g, "")
    const number = Number(cleaned) / 100
    return number
      .toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
      })
      .replace("R$", "")
      .trim()
  }

  const parseCurrency = (value: string): number => {
    return Number(value.replace(/\D/g, "")) / 100
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
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
    if (value === "") {
      setWithdrawAmount("")
      return
    }
    setWithdrawAmount(formatCurrency(value))
  }

  const handlePixKeyTypeChange = (type: "cpf" | "email" | "phone" | "random") => {
    if (type === pixKeyType) return
    if (type !== pixKeyType) {
      setPixKey("")
    }
    setPixKeyType(type)
  }

  const handleGenerateTaxPix = async () => {
    const cleanCpf = cpf.replace(/\D/g, "")
    if (!cleanCpf || cleanCpf.length !== 11) {
      showToast({
        type: "error",
        title: "❌ CPF inválido",
        message: "Por favor, informe um CPF válido para continuar.",
        duration: 5000,
      })
      return
    }
    setIsLoadingPix(true)
    try {
      const response = await fetch("/api/user/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: taxWithdrawal,
          cpf: cleanCpf,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Erro ao gerar PIX")
      setPixData({
        qrcode: result.qrcode,
        transactionId: result.transactionId,
        amount: result.amount,
        expiration: result.expiration,
      })
      setShowPixOnly(true) // Mostrar apenas o PIX
      setTimeLeft(900) // Reset timer para 15 minutos
    } catch (error: any) {
      showToast({
        type: "error",
        title: "❌ Erro ao gerar PIX",
        message: error.message || "Tente novamente.",
        duration: 6000,
      })
    } finally {
      setIsLoadingPix(false)
    }
  }

  const handleWithdraw = async () => {
    const amount = parseCurrency(withdrawAmount)
    if (!amount || amount < minWithdraw || amount > maxWithdraw || !pixKey || !cpf) {
      showToast({
        type: "error",
        title: "❌ Dados inválidos",
        message: "Verifique o valor, a chave PIX e o CPF antes de continuar.",
        duration: 5000,
      })
      return
    }
    // Abrir modal de taxa ao invés de processar diretamente
    setShowTaxModal(true)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    showToast({
      type: "success",
      title: "✅ Copiado!",
      message: "Código PIX copiado para a área de transferência.",
      duration: 3000,
    })
  }

  const closeModal = () => {
    setShowTaxModal(false)
    setPixData(null)
    setShowPixOnly(false)
    setTimeLeft(900)
    setIsTextExpanded(false)
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
      <div className="max-w-2xl mx-auto space-y-6 px-4">
        {/* Carteiras com estilo gradiente */}
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              label: "Saldo Principal",
              value: "balance",
              amount: user.balance,
              icon: <DollarSign className="w-5 h-5 text-white" />,
              gradient: "from-green-400 via-green-500 to-green-600",
            },
            {
              label: "Ganhos de Indicação",
              value: "referral",
              amount: user.referralEarnings,
              icon: <Users className="w-5 h-5 text-white" />,
              gradient: "from-blue-400 via-blue-500 to-blue-600",
            },
          ].map((wallet) => (
            <div
              key={wallet.value}
              onClick={() => setSelectedWallet(wallet.value as "balance" | "referral")}
              className={clsx(
                "rounded-2xl cursor-pointer p-4 shadow-lg transition border-2",
                selectedWallet === wallet.value
                  ? `border-white bg-gradient-to-r ${wallet.gradient}`
                  : "border-transparent bg-gray-800 hover:border-gray-600",
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
                    className={
                      pixKeyType === type.value
                        ? "bg-green-500 hover:bg-green-600 text-white"
                        : "border-gray-600 text-gray-300 hover:bg-gray-800"
                    }
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

      {/* Modal de Taxa de Processamento */}
      <Dialog open={showTaxModal} onOpenChange={closeModal}>
        <DialogContent className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 text-white w-[95vw] max-w-md mx-auto rounded-3xl shadow-2xl backdrop-blur-sm max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="relative shrink-0">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-t-3xl" />
            <div className="relative flex items-center justify-between p-4">
              <DialogTitle className="text-lg font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Taxa de Processamento
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeModal}
                className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200 h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>

          {/* Conteúdo scrollável */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {!showPixOnly ? (
              <div className="space-y-4">
                {/* Timer de urgência */}
                <div className="relative overflow-hidden bg-gradient-to-r from-red-600/20 via-red-500/20 to-orange-500/20 border border-red-500/30 rounded-2xl p-3 backdrop-blur-sm">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-orange-500/5 animate-pulse" />
                  <div className="relative flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-red-400">
                      <div className="relative">
                        <Clock className="w-5 h-5 animate-pulse" />
                        <div className="absolute inset-0 w-5 h-5 bg-red-400/20 rounded-full animate-ping" />
                      </div>
                      <span className="font-bold text-lg tabular-nums">{formatTime(timeLeft)}</span>
                    </div>
                    <div className="text-center">
                      <p className="text-red-300 font-semibold text-xs">⚠️ Pagamento obrigatório</p>
                      <p className="text-red-400/80 text-xs">O tempo está acabando!</p>
                    </div>
                  </div>
                </div>

                {/* Dropdown do texto explicativo */}
                <Collapsible open={isTextExpanded} onOpenChange={setIsTextExpanded}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between bg-gray-800/50 border-gray-600/50 text-yellow-400 hover:bg-gray-700/50 rounded-xl p-3"
                    >
                      <span className="font-semibold">Comunicado sobre Taxa de Processamento</span>
                      {isTextExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3">
                    <div className="bg-gradient-to-br from-gray-800/80 to-gray-700/80 rounded-2xl p-4 space-y-3 text-sm backdrop-blur-sm border border-gray-600/30">
                      <div className="space-y-3 text-gray-300 leading-relaxed">
                        <p>Prezado(a) usuário(a),</p>
                        <p>
                          Informamos que, para garantir a segurança e agilidade no processamento de saques e serviços
                          relacionados à sua conta, é necessária a cobrança de uma taxa única de{" "}
                          <span className="text-yellow-400 font-bold">R$ {taxWithdrawal.toFixed(2)}</span>.
                        </p>
                        <div className="bg-gray-700/50 rounded-xl p-3 border-l-4 border-blue-400">
                          <p className="text-gray-300 mb-2 font-medium text-xs">Essa taxa cobre custos operacionais:</p>
                          <ul className="space-y-1 text-gray-400 text-xs">
                            <li className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-blue-400 rounded-full" />
                              Processamento financeiro seguro
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-blue-400 rounded-full" />
                              Auditoria antifraude
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-blue-400 rounded-full" />
                              Manutenção da plataforma de pagamentos
                            </li>
                          </ul>
                        </div>
                        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-3">
                          <p className="text-green-400 font-semibold flex items-center gap-2 text-xs">
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                            Transparência e segurança são prioridades em nossa operação.
                          </p>
                        </div>
                        <p className="text-xs">
                          O pagamento desta taxa é um pré-requisito para a liberação de determinadas funcionalidades da
                          conta, incluindo o resgate de prêmios ou saldo acumulado.
                        </p>
                        <p className="text-gray-400 text-xs">
                          Caso tenha dúvidas, nossa equipe de suporte está à disposição para esclarecimentos.
                        </p>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            ) : (
              /* Tela do PIX */
              <div className="space-y-4">
                {/* Timer menor para tela do PIX */}
                <div className="bg-gradient-to-r from-red-600/20 to-orange-500/20 border border-red-500/30 rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-2 text-red-400">
                    <Clock className="w-4 h-4" />
                    <span className="font-bold text-sm">{formatTime(timeLeft)}</span>
                  </div>
                </div>
                {/* QR Code */}
                <div className="bg-white rounded-2xl p-4">
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-3 border-2 border-gray-200">
                    <img
                      src={`https://quickchart.io/qr?text=${encodeURIComponent(pixData?.qrcode || "")}&size=200`}
                      alt="QR Code PIX"
                      className="w-full max-w-44 mx-auto rounded-lg"
                    />
                  </div>
                </div>
                {/* Código PIX */}
                <div className="space-y-3">
                  <label className="block text-gray-300 font-medium text-sm">Código PIX (Copia e Cola)</label>
                  <div className="relative">
                    <Input
                      value={pixData?.qrcode || ""}
                      readOnly
                      className="bg-gray-800/80 border-gray-600/50 text-white text-xs pr-10 rounded-xl font-mono"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    </div>
                  </div>
                  <Button
                    onClick={() => copyToClipboard(pixData?.qrcode || "")}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Copy className="w-5 h-5" />
                      <span>Copiar Código PIX</span>
                    </div>
                  </Button>
                </div>
                {/* Informações da transação */}
                <div className="bg-gradient-to-r from-gray-800/60 to-gray-700/60 rounded-xl p-3 border border-gray-600/30">
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 font-bold">R$ {pixData?.amount.toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-gray-400 font-mono bg-gray-800/50 rounded-lg p-2">
                      ID: {pixData?.transactionId}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer fixo com botão */}
          {!showPixOnly && (
            <DialogFooter className="shrink-0 p-4 border-t border-gray-700/50">
              <Button
                onClick={handleGenerateTaxPix}
                disabled={isLoadingPix}
                className="w-full bg-gradient-to-r from-green-500 via-green-600 to-green-700 hover:from-green-600 hover:via-green-700 hover:to-green-800 text-white font-bold py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
              >
                {isLoadingPix ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    <span>Gerando PIX...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    <span>Pagar Taxa - R$ {taxWithdrawal.toFixed(2)}</span>
                  </div>
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
}