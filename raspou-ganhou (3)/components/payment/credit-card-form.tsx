"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { CreditCard, Lock } from "lucide-react"

interface CreditCardFormProps {
  amount: number
  onBack: () => void
  onPaymentSubmit: (cardData: any) => void
}

/**
 * Credit card payment form component
 */
export function CreditCardForm({ amount, onBack, onPaymentSubmit }: CreditCardFormProps) {
  const [cardData, setCardData] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const formatCardNumber = (value: string) => {
    const numericValue = value.replace(/\D/g, "")
    return numericValue.replace(/(\d{4})(?=\d)/g, "$1 ").trim()
  }

  const formatExpiry = (value: string) => {
    const numericValue = value.replace(/\D/g, "")
    if (numericValue.length >= 2) {
      return numericValue.slice(0, 2) + "/" + numericValue.slice(2, 4)
    }
    return numericValue
  }

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value

    if (field === "number") {
      formattedValue = formatCardNumber(value)
    } else if (field === "expiry") {
      formattedValue = formatExpiry(value)
    } else if (field === "cvv") {
      formattedValue = value.replace(/\D/g, "").slice(0, 4)
    } else if (field === "name") {
      formattedValue = value.toUpperCase()
    }

    setCardData((prev) => ({ ...prev, [field]: formattedValue }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 3000))
      onPaymentSubmit(cardData)
    } catch (error) {
      console.error("Payment failed:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const isFormValid = () => {
    return (
      cardData.number.replace(/\s/g, "").length >= 16 &&
      cardData.name.length >= 3 &&
      cardData.expiry.length === 5 &&
      cardData.cvv.length >= 3
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
        <CardContent className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6 justify-center backdrop-blur-sm">
              <Lock className="w-5 h-5 text-green-400" />
              <span className="text-green-400 text-sm font-medium">Pagamento seguro SSL</span>
            </div>

            <p className="text-gray-400 text-sm mb-2">Valor do depósito:</p>
            <p className="text-white text-3xl font-bold mb-4">R$ {amount.toFixed(2).replace(".", ",")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Card Number */}
            <div className="relative group">
              <label className="block text-gray-300 text-sm font-medium mb-3">Número do cartão</label>
              <div className="relative">
                <CreditCard
                  className={`
                  absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 z-10 transition-all duration-300
                  ${focusedField === "number" ? "text-green-400 scale-110" : "text-gray-400"}
                `}
                />
                <Input
                  type="text"
                  placeholder="0000 0000 0000 0000"
                  value={cardData.number}
                  onChange={(e) => handleInputChange("number", e.target.value)}
                  onFocus={() => setFocusedField("number")}
                  onBlur={() => setFocusedField(null)}
                  className={`
                    bg-transparent border-2 text-white placeholder-gray-400 
                    pl-14 py-4 h-14 text-base
                    transition-all duration-300 ease-out
                    border-gray-600 hover:border-gray-500
                    focus:border-green-400 focus:shadow-lg focus:shadow-green-400/20
                    focus:bg-green-400/5
                    group-hover:bg-gray-800/20
                    rounded-xl
                    ${focusedField === "number" ? "ring-2 ring-green-400/30" : ""}
                  `}
                  maxLength={19}
                  required
                />
                {focusedField === "number" && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-400/20 via-transparent to-green-400/20 animate-pulse pointer-events-none" />
                )}
              </div>
            </div>

            {/* Cardholder Name */}
            <div className="relative group">
              <label className="block text-gray-300 text-sm font-medium mb-3">Nome do titular</label>
              <Input
                type="text"
                placeholder="NOME COMO ESTÁ NO CARTÃO"
                value={cardData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                onFocus={() => setFocusedField("name")}
                onBlur={() => setFocusedField(null)}
                className={`
                  bg-transparent border-2 text-white placeholder-gray-400 
                  py-4 h-14 text-base px-4
                  transition-all duration-300 ease-out
                  border-gray-600 hover:border-gray-500
                  focus:border-green-400 focus:shadow-lg focus:shadow-green-400/20
                  focus:bg-green-400/5
                  group-hover:bg-gray-800/20
                  rounded-xl
                  ${focusedField === "name" ? "ring-2 ring-green-400/30" : ""}
                `}
                required
              />
              {focusedField === "name" && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-400/20 via-transparent to-green-400/20 animate-pulse pointer-events-none" />
              )}
            </div>

            {/* Expiry and CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div className="relative group">
                <label className="block text-gray-300 text-sm font-medium mb-3">Validade</label>
                <Input
                  type="text"
                  placeholder="MM/AA"
                  value={cardData.expiry}
                  onChange={(e) => handleInputChange("expiry", e.target.value)}
                  onFocus={() => setFocusedField("expiry")}
                  onBlur={() => setFocusedField(null)}
                  className={`
                    bg-transparent border-2 text-white placeholder-gray-400 
                    py-4 h-14 text-base px-4
                    transition-all duration-300 ease-out
                    border-gray-600 hover:border-gray-500
                    focus:border-green-400 focus:shadow-lg focus:shadow-green-400/20
                    focus:bg-green-400/5
                    group-hover:bg-gray-800/20
                    rounded-xl
                    ${focusedField === "expiry" ? "ring-2 ring-green-400/30" : ""}
                  `}
                  maxLength={5}
                  required
                />
                {focusedField === "expiry" && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-400/20 via-transparent to-green-400/20 animate-pulse pointer-events-none" />
                )}
              </div>
              <div className="relative group">
                <label className="block text-gray-300 text-sm font-medium mb-3">CVV</label>
                <Input
                  type="text"
                  placeholder="000"
                  value={cardData.cvv}
                  onChange={(e) => handleInputChange("cvv", e.target.value)}
                  onFocus={() => setFocusedField("cvv")}
                  onBlur={() => setFocusedField(null)}
                  className={`
                    bg-transparent border-2 text-white placeholder-gray-400 
                    py-4 h-14 text-base px-4
                    transition-all duration-300 ease-out
                    border-gray-600 hover:border-gray-500
                    focus:border-green-400 focus:shadow-lg focus:shadow-green-400/20
                    focus:bg-green-400/5
                    group-hover:bg-gray-800/20
                    rounded-xl
                    ${focusedField === "cvv" ? "ring-2 ring-green-400/30" : ""}
                  `}
                  maxLength={4}
                  required
                />
                {focusedField === "cvv" && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-400/20 via-transparent to-green-400/20 animate-pulse pointer-events-none" />
                )}
              </div>
            </div>

            {/* Payment Button */}
            <Button
              type="submit"
              disabled={!isFormValid() || isProcessing}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 h-14 text-lg font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Processando pagamento...
                </div>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Finalizar pagamento
                </>
              )}
            </Button>

            {/* Back Button */}
            <Button
              type="button"
              onClick={onBack}
              variant="outline"
              className="w-full border-2 border-gray-600 bg-transparent text-gray-300 hover:text-white hover:bg-gray-800/30 hover:border-gray-500 py-4 h-14 rounded-xl transition-all duration-300"
            >
              Voltar
            </Button>
          </form>

          {/* Security Info */}
          <div className="mt-6 p-4 bg-gray-800/30 border border-gray-700 rounded-xl backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-green-400 mt-0.5" />
              <div>
                <p className="text-white font-medium mb-1">Seus dados estão seguros</p>
                <p className="text-gray-400 text-sm">
                  Utilizamos criptografia SSL de 256 bits para proteger suas informações. Não armazenamos dados do seu
                  cartão.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
