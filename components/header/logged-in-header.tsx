"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ShoppingCart, ChevronDown, Wallet, Gift } from "lucide-react"

interface LoggedInHeaderProps {
  user: {
    id: string
    name: string
    email: string
    phone: string
    avatar?: string
    balance: number
  }
  onLogout: () => void
  onNavigate: (page: string) => void
  onAddBalance?: (amount: number) => void // Nova prop
}

/**
 * Header para usuários autenticados
 *
 * FUNCIONALIDADES:
 * - Exibição do saldo atual
 * - Botão de depósito rápido
 * - Carrinho com badge de quantidade
 * - Dropdown do perfil com menu completo
 * - Logout
 *
 * ELEMENTOS:
 * - Saldo (desktop only)
 * - Botão Depositar
 * - Ícone do carrinho com badge
 * - Avatar + dropdown menu
 *
 * IMPORTANTE:
 * - Badge do carrinho é hardcoded (TODO: integrar com estado real)
 * - Dropdown fecha automaticamente ao navegar
 * - Responsivo (alguns elementos só aparecem no desktop)
 */
export function LoggedInHeader({ user, onLogout, onNavigate, onAddBalance }: LoggedInHeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false)

  /**
   * Formata valor monetário para exibição
   * Usa padrão brasileiro (R$ 1.234,56)
   */
  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(balance)
  }

  /**
   * Gera iniciais do nome do usuário para avatar
   * Pega primeiras letras de até 2 palavras
   */
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  /**
   * Trunca nome longo para exibição
   * Evita quebra de layout em nomes muito grandes
   */
  const truncateName = (name: string, maxLength = 15) => {
    if (name.length <= maxLength) return name
    return name.slice(0, maxLength) + "..."
  }

  /**
   * Navega para página e fecha dropdown
   * Evita dropdown aberto após navegação
   */
  const handleMenuClick = (page: string) => {
    setShowDropdown(false)
    onNavigate(page)
  }

  // Adicionar função para adicionar saldo:
  const handleAddBalance = () => {
    if (onAddBalance) {
      onAddBalance(50)
      // Mostrar feedback visual
      const button = document.getElementById("add-balance-btn")
      if (button) {
        button.textContent = "✓ Adicionado!"
        setTimeout(() => {
          button.textContent = "+ R$ 50"
        }, 2000)
      }
    }
  }

  return (
    <div className="flex items-center gap-4">
      {/* SALDO - Apenas desktop */}
      <div className="hidden md:flex items-center gap-2 text-white">
        <span className="text-lg font-semibold">{formatBalance(user.balance)}</span>
      </div>

      {/* BOTÃO DEPOSITAR */}
      <Button
        onClick={() => onNavigate("deposit")}
        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25 hover:scale-105 active:scale-95 group"
      >
        <Wallet className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:scale-110" />
        Depositar
      </Button>

      {/* BOTÃO ADICIONAR SALDO - APENAS PARA DESENVOLVIMENTO */}
      {process.env.NODE_ENV === "development" && (
        <Button
          id="add-balance-btn"
          onClick={handleAddBalance}
          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 hover:scale-105 active:scale-95 group"
        >
          <Gift className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:scale-110" />+ R$ 50
        </Button>
      )}

      {/* DROPDOWN DO PERFIL */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-3 text-white hover:bg-white/10 rounded-lg px-3 py-2 transition-all duration-300 hover:scale-105 active:scale-95"
        >
          {/* Avatar do usuário */}
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {user.avatar || getInitials(user.name)}
          </div>

          {/* Info do usuário - Apenas desktop */}
          <div className="hidden md:flex flex-col items-start">
            <span className="text-sm font-medium">{truncateName(user.name)}</span>
            <span className="text-xs text-gray-400">Ver perfil</span>
          </div>

          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showDropdown ? "rotate-180" : ""}`} />
        </button>

        {/* MENU DROPDOWN */}
        {showDropdown && (
          <div className="absolute right-0 top-full mt-2 w-72 bg-black rounded-lg shadow-xl border border-gray-800 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Seção de boas-vindas */}
            <div className="px-4 py-3 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {user.avatar || getInitials(user.name)}
                  </div>
                  {/* Indicador online */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-black"></div>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{user.name}</p>
                  <p className="text-green-400 text-xs">Bem-vindo de volta!</p>
                </div>
              </div>
            </div>

            {/* Itens do menu */}
            <div className="py-2">
              {/* Minha Carteira */}
              <button
                onClick={() => handleMenuClick("wallet")}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-900 transition-colors duration-200 group"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">Minha Carteira</p>
                  <p className="text-xs text-gray-400 group-hover:text-gray-300">Visualizar saldos e histórico</p>
                </div>
              </button>

              {/* Meus Bônus */}
              <button
                onClick={() => handleMenuClick("bonuses")}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-900 transition-colors duration-200 group"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">Meus Bônus</p>
                  <p className="text-xs text-gray-400 group-hover:text-gray-300">Gerenciar e resgatar bônus</p>
                </div>
              </button>

              {/* Minhas Entregas */}
              <button
                onClick={() => handleMenuClick("deliveries")}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-900 transition-colors duration-200 group"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 9h6"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">Minhas Entregas</p>
                  <p className="text-xs text-gray-400 group-hover:text-gray-300">Acompanhar status das entregas</p>
                </div>
              </button>

              {/* Indique e Ganhe */}
              <button
                onClick={() => handleMenuClick("refer")}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-900 transition-colors duration-200 group"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">Indique e Ganhe</p>
                  <p className="text-xs text-gray-400 group-hover:text-gray-300">Convide amigos e ganhe bônus</p>
                </div>
              </button>

              {/* Configurações */}
              <button
                onClick={() => handleMenuClick("settings")}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-900 transition-colors duration-200 group"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">Configurações</p>
                  <p className="text-xs text-gray-400 group-hover:text-gray-300">Gerenciar perfil e preferências</p>
                </div>
              </button>
            </div>

            {/* Seção de logout */}
            <div className="border-t border-gray-800 pt-2">
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-gray-900 transition-colors duration-200 group"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">Sair da Conta</p>
                  <p className="text-xs text-red-500 group-hover:text-red-400">Encerrar sessão atual</p>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
