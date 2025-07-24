"use client"

import type React from "react"

import Image from "next/image"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LoggedInHeader } from "@/components/header/logged-in-header"

interface PageLayoutProps {
  title: string
  subtitle?: string
  showBackButton?: boolean
  onBack?: () => void
  children: React.ReactNode
  user?: {
    id: string
    name: string
    email: string
    phone: string
    avatar?: string
    balance: number
  }
  onLogout?: () => void
  onNavigate?: (page: string) => void
}

/**
 * Layout comum para todas as páginas internas do dashboard
 *
 * FUNCIONALIDADES:
 * - Header fixo com logo e navegação
 * - Breadcrumb com botão de voltar
 * - Espaçamento consistente
 * - Footer padronizado
 *
 * ESTRUTURA:
 * - Header principal (se usuário logado)
 * - Header da página com título/subtítulo
 * - Conteúdo principal
 * - Footer
 *
 * IMPORTANTE:
 * - Headers são sticky/fixed para melhor UX
 * - Espaçamento calculado para evitar sobreposição
 * - Responsivo para mobile e desktop
 */
export function PageLayout({
  title,
  subtitle,
  showBackButton,
  onBack,
  children,
  user,
  onLogout,
  onNavigate,
}: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* HEADER PRINCIPAL - Aparece apenas se usuário estiver logado */}
      {user && onLogout && onNavigate && (
        <header className="bg-black border-b border-gray-800 fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/95">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center group">
                <Image
                  src="/images/logo.png"
                  alt="Raspou Ganhou"
                  width={120}
                  height={40}
                  className="h-8 w-auto transition-transform duration-300 group-hover:scale-105"
                  priority
                />
              </div>
            </div>
            <LoggedInHeader user={user} onLogout={onLogout} onNavigate={onNavigate} />
          </div>
        </header>
      )}

      {/* HEADER DA PÁGINA - Título, subtítulo e navegação */}
      <header
        className={`bg-black border-b border-gray-800 sticky z-40 backdrop-blur-md bg-black/95 ${
          user ? "top-[73px]" : "top-0" // Ajusta posição baseado se há header principal
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            {/* Botão de voltar */}
            {showBackButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="text-white hover:text-gray-300 hover:bg-white/10"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}

            {/* Título e subtítulo */}
            <div>
              <h1 className="text-2xl font-bold text-white">{title}</h1>
              {subtitle && <p className="text-gray-400 text-sm mt-1">{subtitle}</p>}
            </div>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main
        className={`max-w-6xl mx-auto px-4 pb-6 ${
          user ? "pt-[140px]" : "pt-20" // Espaçamento para compensar headers fixos
        }`}
      >
        {children}
      </main>

      {/* FOOTER PADRÃO */}
      <footer className="bg-black border-t border-gray-800 mt-20">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo e descrição */}
            <div className="flex items-center gap-2">
              <Image src="/images/logo.png" alt="Raspou Ganhou" width={120} height={40} className="h-8 w-auto" />
              <div className="text-sm text-gray-400">
                <p>Raspadinha da Sorte é a maior e melhor plataforma de raspadinhas do Brasil</p>
                <p className="mt-1">© 2025 Raspadinha da Sorte. Todos os direitos reservados.</p>
              </div>
            </div>

            {/* Links do footer */}
            <div className="grid grid-cols-3 gap-8 text-sm">
              <div>
                <p className="text-gray-300 mb-2">Raspadinhas</p>
                <p className="text-gray-400">Carrinho</p>
              </div>
              <div>
                <p className="text-gray-300 mb-2">Carteira</p>
                <p className="text-gray-400">Depósito</p>
                <p className="text-gray-400">Saques</p>
              </div>
              <div>
                <p className="text-gray-300 mb-2">Termos de Uso</p>
                <p className="text-gray-400">Política de Privacidade</p>
                <p className="text-gray-400">Termos de Bônus</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
