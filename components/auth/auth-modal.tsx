"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { X } from "lucide-react"
import { useAuthForm } from "@/hooks/useAuthForm"
import { useToast } from "@/contexts/toast-context"
import { AuthTabs } from "./auth-tabs"
import { LoginForm } from "./login-form"
import { RegisterForm } from "./register-form"
import { ForgotPasswordForm } from "./forgot-password-form"
import { signIn } from 'next-auth/react';

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: "login" | "register"
  onAuthSuccess?: (formData: any, isRegister: boolean) => Promise<{ success: boolean; error?: string; user?: any }>
}

/**
 * Main authentication modal component
 * Features:
 * - Tab-based navigation between login/register
 * - Forgot password flow
 * - Responsive design (desktop/mobile)
 * - Form state management
 * - Loading states and error handling
 * - Toast notifications for success/error
 * - API integration points for authentication
 */
export function AuthModal({ isOpen, onClose, initialTab = "login" }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">(initialTab)
  const [isLoading, setIsLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const { formData, updateField, resetForm } = useAuthForm()
  const { showToast } = useToast()

const onAuthSuccess = async (formData: any, isRegister: boolean) => {
  // Para login, envia apenas o método selecionado
  const credentials = isRegister 
    ? formData // Para registro, envia todos os campos
    : {
        ...formData,
        // Remove o campo não utilizado
        email: formData.email || null,
        phone: formData.phone || null
      };

  const res = await signIn('credentials', {
    ...credentials,
    action: isRegister ? 'register' : 'login',
    redirect: false,
  });
  
  return { 
    success: !res?.error, 
    error: res?.error, 
    user: res?.ok ? { /* fetch user data if needed */ } : null 
  };
};

  // Manage body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  // Reset tab when initialTab changes
  useEffect(() => {
    if (activeTab !== initialTab) {
      setActiveTab(initialTab)
    }
  }, [initialTab])

  if (!isOpen) return null

  /**
   * Handle form submission for login/register
   * Includes comprehensive toast notifications for all scenarios
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (onAuthSuccess) {
        const result = await onAuthSuccess(formData, activeTab === "register")

        if (result.success) {
          // Success toast notifications
          if (activeTab === "register") {
            showToast({
              type: "success",
              title: "🎉 Conta criada com sucesso!",
              message: `Bem-vindo(a), ${result.user?.name || "usuário"}! Você ganhou R$ 10,00 de bônus de boas-vindas para começar a jogar.`,
              duration: 8000,
            })

            // Facebook Pixel - Evento de cadastro
if (window.fbq) {
  window.fbq('track', 'CompleteRegistration'); // ou 'Lead', se preferir
}

// Google Ads - Conversão sem valor
if (window.gtag) {
  window.gtag('event', 'conversion', {
    send_to: 'AW-123456789/AbC-D_efGhIjKlMnOpQrSt', // substitua pelo seu código
  });
}

// Google Analytics 4 - Cadastro (GA4)
if (window.gtag) {
  window.gtag('event', 'sign_up', {
    method: 'Email', // ou 'Facebook', etc.
  });
}


            // TODO: API INTEGRATION - Send welcome email
            try {
              await fetch("/api/email/welcome", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${result.user.token}`,
                },
                body: JSON.stringify({
                  email: result.user.email,
                  name: result.user.name,
                  welcomeBonus: 10.0,
                }),
              })
            } catch (emailError) {
              console.error("Failed to send welcome email:", emailError)
            }

            // TODO: API INTEGRATION - Track registration event
            try {
              await fetch("/api/analytics/track", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  event: "user_registered",
                  userId: result.user.id,
                  properties: {
                    email: result.user.email,
                    registrationMethod: "email",
                    referralCode: formData.referralCode || null,
                    timestamp: new Date().toISOString(),
                  },
                }),
              })
            } catch (analyticsError) {
              console.error("Failed to track registration:", analyticsError)
            }
          } else {
            showToast({
              type: "success",
              title: "✅ Login realizado com sucesso!",
              message: `Bem-vindo(a) de volta, ${result.user?.name || "usuário"}! Seu saldo atual é R$ ${result.user?.balance?.toFixed(2) || "0,00"}.`,
              duration: 6000,
            })

            // TODO: API INTEGRATION - Track login event
            try {
              await fetch("/api/analytics/track", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  event: "user_logged_in",
                  userId: result.user.id,
                  properties: {
                    loginMethod: formData.email ? "email" : "phone",
                    timestamp: new Date().toISOString(),
                  },
                }),
              })
            } catch (analyticsError) {
              console.error("Failed to track login:", analyticsError)
            }

            // TODO: API INTEGRATION - Update last login timestamp
            try {
              await fetch("/api/user/update-last-login", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${result.user.token}`,
                },
                body: JSON.stringify({
                  userId: result.user.id,
                  timestamp: new Date().toISOString(),
                }),
              })
            } catch (updateError) {
              console.error("Failed to update last login:", updateError)
            }
          }

          onClose()
          resetForm()
        } else {
          // Error toast notifications with specific messages
          const errorMessages = {
            "Nome deve ter pelo menos 2 caracteres": "Por favor, insira um nome válido com pelo menos 2 caracteres.",
            "Email inválido": "Por favor, insira um endereço de email válido.",
            "Telefone deve ter pelo menos 10 dígitos": "Por favor, insira um número de telefone válido.",
            "Senha deve ter pelo menos 6 caracteres": "A senha deve ter pelo menos 6 caracteres para sua segurança.",
            "Este email já está cadastrado": "Este email já possui uma conta. Tente fazer login ou use outro email.",
            "Email/telefone ou senha incorretos": "Credenciais incorretas. Verifique seus dados e tente novamente.",
          }

          const userFriendlyMessage = errorMessages[result.error as keyof typeof errorMessages] || result.error

          showToast({
            type: "error",
            title: activeTab === "register" ? "❌ Erro no cadastro" : "❌ Erro no login",
            message: userFriendlyMessage || "Ocorreu um erro inesperado. Tente novamente.",
            duration: 8000,
          })

          // TODO: API INTEGRATION - Track authentication errors
          try {
            await fetch("/api/analytics/track", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                event: "auth_error",
                properties: {
                  error: result.error,
                  authType: activeTab,
                  email: formData.email,
                  timestamp: new Date().toISOString(),
                  userAgent: navigator.userAgent,
                },
              }),
            })
          } catch (analyticsError) {
            console.error("Failed to track auth error:", analyticsError)
          }
        }
      } else {
        // Fallback simulation
        await new Promise((resolve) => setTimeout(resolve, 2000))

        showToast({
          type: "success",
          title: activeTab === "register" ? "🎉 Conta criada com sucesso!" : "✅ Login realizado com sucesso!",
          message: "Redirecionando para sua conta...",
          duration: 3000,
        })

        onClose()
        resetForm()
      }
    } catch (error) {
      console.error("Form submission error:", error)

      // Network/server error toast
      showToast({
        type: "error",
        title: "🌐 Erro de conexão",
        message: "Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.",
        duration: 8000,
      })

      // TODO: API INTEGRATION - Log client-side errors
      try {
        await fetch("/api/errors/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            error: error.message,
            stack: error.stack,
            context: "auth_modal_submit",
            formData: { ...formData, password: "[REDACTED]" },
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
          }),
        })
      } catch (logError) {
        console.error("Failed to log error:", logError)
      }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handle forgot password submission
   * TODO: API INTEGRATION - Implement password reset flow
   */
  const handleForgotPasswordSubmit = async (email: string) => {
    try {
      setIsLoading(true)

      // TODO: API INTEGRATION - Send password reset email
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          resetUrl: `${window.location.origin}/reset-password`,
        }),
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.message || "Erro ao enviar email")
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      showToast({
        type: "success",
        title: "📧 Email de recuperação enviado!",
        message: `Instruções para redefinir sua senha foram enviadas para ${email}. Verifique sua caixa de entrada e spam.`,
        duration: 10000,
      })

      setShowForgotPassword(false)

      // TODO: API INTEGRATION - Track password reset request
      try {
        await fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "password_reset_requested",
            properties: {
              email: email,
              timestamp: new Date().toISOString(),
            },
          }),
        })
      } catch (analyticsError) {
        console.error("Failed to track password reset:", analyticsError)
      }
    } catch (error) {
      console.error("Forgot password error:", error)

      showToast({
        type: "error",
        title: "❌ Erro ao enviar email",
        message: "Não foi possível enviar o email de recuperação. Verifique se o email está correto e tente novamente.",
        duration: 8000,
      })

      // TODO: API INTEGRATION - Log password reset errors
      try {
        await fetch("/api/errors/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            error: error.message,
            context: "forgot_password",
            email: email,
            timestamp: new Date().toISOString(),
          }),
        })
      } catch (logError) {
        console.error("Failed to log password reset error:", logError)
      }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Reset modal state and close
   */
  const handleClose = () => {
    setShowForgotPassword(false)
    resetForm()
    onClose()
  }

  return (
    <>
      {/* Desktop Modal */}
      <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center animate-in fade-in duration-300">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-md animate-in fade-in duration-300"
          onClick={handleClose}
        />

        {/* Modal Content */}
        <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
          <div className="flex">
            {/* Promotional Banner */}
            <div className="w-1/2 relative overflow-hidden">
              <Image
                src={activeTab === "login" ? "/images/modal-login-banner.png" : "/images/modal-promo-banner.png"}
                alt={activeTab === "login" ? "Essa Oferta é Limitada" : "Bonificações Exclusivas"}
                width={400}
                height={600}
                className="w-full h-full object-cover transition-all duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-gray-900/10" />
            </div>

            {/* Form Section */}
            <div className="w-1/2 bg-black text-white p-8 relative">
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-all duration-200 hover:rotate-90 hover:scale-110"
                aria-label="Fechar modal"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Logo */}
              <div className="mb-8 animate-in slide-in-from-top-4 duration-500 delay-200">
                <Image src="/images/logo.png" alt="Raspou Ganhou" width={120} height={40} className="h-8 w-auto" />
              </div>

              {/* Form Content */}
              <div className="animate-in slide-in-from-bottom-4 duration-500 delay-400">
                {showForgotPassword ? (
                  <ForgotPasswordForm
                    onBack={() => setShowForgotPassword(false)}
                    onSubmit={handleForgotPasswordSubmit}
                  />
                ) : (
                  <>
                    <AuthTabs activeTab={activeTab} onTabChange={setActiveTab} />

                    {activeTab === "login" ? (
                      <LoginForm
                        formData={formData}
                        onFormDataChange={updateField}
                        onSubmit={handleSubmit}
                        onForgotPassword={() => setShowForgotPassword(true)}
                        onSwitchToRegister={() => setActiveTab("register")}
                        isLoading={isLoading}
                      />
                    ) : (
                      <RegisterForm
                        formData={formData}
                        onFormDataChange={updateField}
                        onSubmit={handleSubmit}
                        onSwitchToLogin={() => setActiveTab("login")}
                        isLoading={isLoading}
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Modal */}
      <div className="md:hidden fixed inset-0 z-50 bg-black text-white animate-in slide-in-from-bottom duration-500">
        {/* Mobile Banner */}
        <div className="relative h-48 w-full overflow-hidden">
          <Image
            src={activeTab === "login" ? "/images/mobile-login-banner.png" : "/images/mobile-register-banner.png"}
            alt={activeTab === "login" ? "Essa Oferta é Limitada" : "Bonificações Exclusivas"}
            width={800}
            height={200}
            className="w-full h-full object-cover transition-all duration-700 ease-out"
            priority
          />
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 transition-all duration-200 hover:bg-black/70 hover:scale-110 active:scale-95"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Content */}
        <div className="flex flex-col h-[calc(100vh-12rem)] px-6 py-6 animate-in slide-in-from-bottom duration-500 delay-200">
          {/* Logo */}
          <div className="mb-8 text-center animate-in fade-in duration-500 delay-300">
            <Image src="/images/logo.png" alt="Raspou Ganhou" width={150} height={40} className="mx-auto" />
          </div>

          {/* Mobile Form Content */}
          <div className="flex-1 flex flex-col animate-in fade-in duration-500 delay-500">
            {showForgotPassword ? (
              <div className="flex-1 flex flex-col">
                <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} onSubmit={handleForgotPasswordSubmit} />
              </div>
            ) : (
              <>
                <AuthTabs activeTab={activeTab} onTabChange={setActiveTab} />

                <div className="flex-1 flex flex-col">
                  {activeTab === "login" ? (
                    <div className="space-y-6 flex-1 flex flex-col">
                      <LoginForm
                        formData={formData}
                        onFormDataChange={updateField}
                        onSubmit={handleSubmit}
                        onForgotPassword={() => setShowForgotPassword(true)}
                        onSwitchToRegister={() => setActiveTab("register")}
                        isLoading={isLoading}
                      />
                    </div>
                  ) : (
                    <div className="space-y-6 flex-1 flex flex-col">
                      <RegisterForm
                        formData={formData}
                        onFormDataChange={updateField}
                        onSubmit={handleSubmit}
                        onSwitchToLogin={() => setActiveTab("login")}
                        isLoading={isLoading}
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
