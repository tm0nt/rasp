"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { IconInput } from "@/components/ui/icon-input"
import { PasswordInput } from "@/components/ui/password-input"
import { ArrowRight, User, Phone, Mail } from "lucide-react"

interface RegisterFormData {
  name: string
  phone: string
  email: string
  password: string
}

interface RegisterFormProps {
  formData: RegisterFormData
  onFormDataChange: (field: keyof RegisterFormData, value: string) => void
  onSubmit: (e: React.FormEvent) => Promise<void>
  onSwitchToLogin: () => void
  isLoading: boolean
}

export function RegisterForm({ formData, onFormDataChange, onSubmit, onSwitchToLogin, isLoading }: RegisterFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <p className="text-gray-300 text-sm">Crie sua conta gratuita. Vamos começar?</p>

      <div className="space-y-4">
        {/* Name input */}
        <IconInput
          icon={User}
          type="text"
          placeholder="Nome completo"
          value={formData.name}
          onChange={(value) => onFormDataChange("name", value)}
          required
        />

        {/* Grid for Email and Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <IconInput
            icon={Mail}
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(value) => onFormDataChange("email", value)}
            required
          />
          <IconInput
            icon={Phone}
            type="tel"
            placeholder="Telefone"
            value={formData.phone}
            onChange={(value) => onFormDataChange("phone", value)}
            required
          />
        </div>

        {/* Password input */}
        <PasswordInput
          placeholder="Senha"
          value={formData.password}
          onChange={(value) => onFormDataChange("password", value)}
          required
        />
      </div>

      {/* Submit button */}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-green-500 hover:bg-green-600 text-white py-3 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            Processando...
          </div>
        ) : (
          <>
            Continuar
            <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
          </>
        )}
      </Button>
    </form>
  )
}