"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Copy, Clock, CheckCircle } from "lucide-react"

interface PixPaymentProps {
  amount: number
  onBack: () => void
  onPaymentConfirmed: () => void
}

/**
 * PIX payment component with QR code and instructions
 */
export function PixPayment({ amount, onBack, onPaymentConfirmed }: PixPaymentProps) {
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes in seconds
  const [pixCode] = useState("00020126880014br.gov.bcb.pix25660psq")
  const [copied, setCopied] = useState(false)

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(pixCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-6 justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-400 text-sm font-medium">Método de pagamento seguro</span>
            </div>

            <p className="text-gray-400 text-sm mb-2">Valor do depósito:</p>
            <p className="text-white text-3xl font-bold mb-4">R$ {amount.toFixed(2).replace(".", ",")}</p>

            <div className="flex items-center justify-center gap-2 text-orange-400">
              <Clock className="w-4 h-4" />
              <span className="text-sm">O pagamento expira em: {formatTime(timeLeft)}</span>
            </div>
          </div>

          {/* QR Code */}
          <div className="bg-white rounded-lg p-6 mb-6 flex items-center justify-center">
            <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="w-32 h-32 bg-gray-300 rounded-lg mb-4 mx-auto"></div>
                <p className="text-sm">QR Code PIX</p>
              </div>
            </div>
          </div>

          {/* PIX Code */}
          <div className="mb-8">
            <p className="text-white text-center mb-4 font-medium">Ou copie o código PIX:</p>
            <div className="flex gap-3">
              <div className="flex-1 bg-gray-800 border border-gray-700 rounded-lg p-3">
                <code className="text-green-400 text-sm break-all">{pixCode}</code>
              </div>
              <Button onClick={handleCopyCode} className="bg-green-500 hover:bg-green-600 text-white px-4 py-3">
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="mb-8">
            <ol className="space-y-3 text-gray-300">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </span>
                <span>Abra o aplicativo do seu banco</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </span>
                <span>Escolha a opção "Pagar com PIX"</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </span>
                <span>Escaneie o QR code ou cole o código copiado</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  4
                </span>
                <span>Confirme as informações e finalize o pagamento</span>
              </li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={onPaymentConfirmed}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-4 text-lg font-semibold"
            >
              Já fiz o pagamento
            </Button>
            <Button
              onClick={onBack}
              variant="outline"
              className="w-full border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800 py-3 bg-transparent"
            >
              Voltar
            </Button>
          </div>

          {/* Footer Info */}
          <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
            <p className="text-gray-400 text-sm text-center">
              99% dos depósitos por PIX são processados em poucos segundos. O pagamento será confirmado automaticamente
              após processado.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
