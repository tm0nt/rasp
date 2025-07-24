"use client"

import { useState } from "react"

/**
 * Interface que define todos os campos dos formulários de autenticação
 * Centraliza os dados de login, cadastro e recuperação de senha
 */
interface AuthFormData {
  name: string // Nome completo (usado no cadastro)
  phone: string // Telefone (usado no cadastro e login alternativo)
  email: string // Email principal
  password: string // Senha
  rememberMe: boolean // Checkbox "Lembrar de mim"
  forgotEmail: string // Email para recuperação de senha
}

/**
 * Hook customizado para gerenciamento de estado dos formulários de autenticação
 *
 * FUNCIONALIDADES:
 * - Centraliza dados de todos os formulários de auth
 * - Validação de tipos TypeScript
 * - Reset de formulários
 *
 * VANTAGENS:
 * - Evita duplicação de estado
 * - Facilita compartilhamento entre componentes
 * - Type-safe para todos os campos
 *
 * USO:
 * - LoginForm, RegisterForm, ForgotPasswordForm
 */
export function useAuthForm() {
  const [formData, setFormData] = useState<AuthFormData>({
    name: "",
    phone: "",
    email: "",
    password: "",
    rememberMe: false,
    forgotEmail: "",
  })

  /**
   * Atualiza um campo específico do formulário
   *
   * @param field - Nome do campo a ser atualizado
   * @param value - Novo valor (string ou boolean)
   *
   * IMPORTANTE: Usa type-safe keys para evitar erros de digitação
   */
  const updateField = (field: keyof AuthFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  /**
   * Reseta todos os campos para valores vazios
   * Usado após login bem-sucedido ou cancelamento
   */
  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      password: "",
      rememberMe: false,
      forgotEmail: "",
    })
  }

  return {
    formData,
    updateField,
    resetForm,
  }
}
