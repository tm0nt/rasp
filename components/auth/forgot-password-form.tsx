"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { IconInput } from "@/components/ui/icon-input"
import { ArrowLeft, Mail } from "lucide-react"

interface ForgotPasswordFormProps {
  onBack: () => void
  onSubmit: (email: string) => Promise<void>
}

/**
 * Forgot password form component
 * Features:
 * - Email input with validation
 * - Loading state management
 * - Back navigation
 * - Success feedback
 */
export function ForgotPasswordForm({ onBack, onSubmit }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await onSubmit(email)
      alert("Link de redefinição enviado para seu email!")
      onBack()
    } catch (error) {
      console.error("Error sending reset email:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="animate-in slide-in-from-right duration-500">
      {/* Header with back button */}
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white transition-colors duration-200 mr-3"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-semibold">Esqueceu sua senha?</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <p className="text-gray-300 text-sm">Digite seu email e enviaremos um link para redefinir sua senha.</p>

        {/* Email input */}
        <IconInput icon={Mail} type="email" placeholder="Digite seu email" value={email} onChange={setEmail} required />

        {/* Submit button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-green-500 hover:bg-green-600 text-white py-3 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Enviando...
            </div>
          ) : (
            "Enviar link de redefinição"
          )}
        </Button>

        {/* Back to login link */}
        <p className="text-center text-sm text-gray-400">
          Lembrou da senha?{" "}
          <button
            type="button"
            onClick={onBack}
            className="text-green-400 hover:text-green-300 transition-colors duration-200 hover:underline"
          >
            Voltar ao login
          </button>
        </p>
      </form>
    </div>
  )
}
