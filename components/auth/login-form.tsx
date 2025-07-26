"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { IconInput } from "@/components/ui/icon-input"
import { PasswordInput } from "@/components/ui/password-input"
import { RememberMeCheckbox } from "@/components/ui/remember-me-checkbox"
import { LoginMethodTabs } from "./login-method-tabs"
import { Mail, Phone } from "lucide-react"

interface LoginFormData {
  email?: string
  phone?: string
  password: string
  rememberMe: boolean
}

interface LoginFormProps {
  formData: LoginFormData
  onFormDataChange: (field: keyof LoginFormData, value: string | boolean) => void
  onSubmit: (e: React.FormEvent) => Promise<void>
  onForgotPassword: () => void
  onSwitchToRegister: () => void
  isLoading: boolean
}

export function LoginForm({
  formData,
  onFormDataChange,
  onSubmit,
  onForgotPassword,
  onSwitchToRegister,
  isLoading,
}: LoginFormProps) {
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email")

  // Limpa o campo não utilizado quando troca o método
  const handleMethodChange = (method: "email" | "phone") => {
    if (method === "email") {
      onFormDataChange("phone", "")
    } else {
      onFormDataChange("email", "")
    }
    setLoginMethod(method)
  }

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-6 pb-24 md:pb-0">
        <p className="text-gray-300 text-sm">Acesse sua conta com suas credenciais</p>

        <LoginMethodTabs activeMethod={loginMethod} onMethodChange={handleMethodChange} />

        <div className="space-y-4">
          <IconInput
            icon={loginMethod === "email" ? Mail : Phone}
            type={loginMethod === "email" ? "email" : "tel"}
            placeholder={loginMethod === "email" ? "E-mail" : "Telefone"}
            value={loginMethod === "email" ? formData.email || "" : formData.phone || ""}
            onChange={(value) => onFormDataChange(loginMethod === "email" ? "email" : "phone", value)}
            required
          />

          <PasswordInput
            placeholder="Digite sua senha"
            value={formData.password}
            onChange={(value) => onFormDataChange("password", value)}
            required
          />
        </div>

        {/* Remember me and forgot password */}
        <div className="flex items-center justify-between">
          <RememberMeCheckbox
            checked={formData.rememberMe}
            onCheckedChange={(checked) => onFormDataChange("rememberMe", checked)}
            id="remember-login"
          />
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm text-green-400 hover:text-green-300 transition-colors duration-200 hover:underline"
          >
            Esqueceu sua senha?
          </button>
        </div>

        {/* Submit button - apenas desktop */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-green-500 hover:bg-green-600 text-white py-3 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed hidden md:block"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Entrando...
            </div>
          ) : (
            "Entrar"
          )}
        </Button>
      </form>

      {/* Botão fixo no mobile */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-background border-t border-gray-700 z-50 md:hidden">
        <Button
          type="submit"
          disabled={isLoading}
          form="login-form"
          className="w-full bg-green-500 hover:bg-green-600 text-white py-3 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Entrando...
            </div>
          ) : (
            "Entrar"
          )}
        </Button>
      </div>
    </>
  )
}
