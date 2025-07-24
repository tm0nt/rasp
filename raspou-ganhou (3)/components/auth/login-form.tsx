"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { IconInput } from "@/components/ui/icon-input"
import { RememberMeCheckbox } from "@/components/ui/remember-me-checkbox"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/contexts/toast-context"
import { Mail, Phone, Loader2 } from "lucide-react"

interface LoginFormProps {
  onSuccess?: () => void
  onForgotPassword?: () => void
}

export function LoginForm({ onSuccess, onForgotPassword }: LoginFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    password: "",
    rememberMe: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email")

  const { login } = useAuth()
  const { showToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await login(formData, false)

      if (result.success) {
        showToast({
          type: "success",
          title: "Login realizado com sucesso!",
          message: `Bem-vindo(a) de volta, ${result.user?.name}! Seu saldo atual é R$ ${result.user?.balance.toFixed(2)}.`,
          duration: 8000,
        })
        onSuccess?.()
      } else {
        showToast({
          type: "error",
          title: "Erro no login",
          message: result.error || "Credenciais inválidas",
          duration: 6000,
        })
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Erro de conexão",
        message: "Não foi possível conectar ao servidor. Tente novamente.",
        duration: 6000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Entrar na sua conta</h2>
        <p className="text-gray-600 mt-2">Entre para continuar jogando e ganhando!</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Login Method Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setLoginMethod("email")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              loginMethod === "email" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => setLoginMethod("phone")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              loginMethod === "phone" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Telefone
          </button>
        </div>

        {/* Email/Phone Input */}
        {loginMethod === "email" ? (
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <IconInput
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={(value) => handleInputChange("email", value)}
              icon={Mail}
              required
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <IconInput
              id="phone"
              type="tel"
              placeholder="(11) 99999-9999"
              value={formData.phone}
              onChange={(value) => handleInputChange("phone", value)}
              icon={Phone}
              mask="(99) 99999-9999"
              required
            />
          </div>
        )}

        {/* Password Input */}
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <PasswordInput
            id="password"
            placeholder="Sua senha"
            value={formData.password}
            onChange={(value) => handleInputChange("password", value)}
            required
          />
        </div>

        {/* Remember Me and Forgot Password */}
        <div className="flex items-center justify-between">
          <RememberMeCheckbox
            checked={formData.rememberMe}
            onChange={(checked) => handleInputChange("rememberMe", checked)}
            label="Lembrar de mim"
          />
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            Esqueci minha senha
          </button>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-semibold"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Entrando...
            </>
          ) : (
            "Entrar"
          )}
        </Button>
      </form>

      {/* Additional Info */}
      <div className="text-center text-sm text-gray-600">
        <p>
          Ao fazer login, você concorda com nossos{" "}
          <a href="/termos" className="text-green-600 hover:text-green-700">
            Termos de Uso
          </a>{" "}
          e{" "}
          <a href="/privacidade" className="text-green-600 hover:text-green-700">
            Política de Privacidade
          </a>
        </p>
      </div>
    </div>
  )
}
