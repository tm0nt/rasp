"use client"

import { Gamepad2, DollarSign, Wallet, User } from "lucide-react"

interface MobileNavProps {
  isAuthenticated: boolean
  onAuthRequired: () => void
  onNavigate: (page: string) => void
}

/**
 * Navegação inferior para dispositivos móveis
 *
 * FUNCIONALIDADES:
 * - 4 ícones principais de navegação
 * - Verificação de autenticação
 * - Animações e feedback visual
 * - Posicionamento fixo na parte inferior
 *
 * ÍCONES E NAVEGAÇÃO:
 * - 🎮 Gamepad: Home/Jogos
 * - 💰 Dinheiro: Página de depósito
 * - 🏦 Carteira: Página da carteira (sem destaque)
 * - 👤 Usuário: Configurações
 *
 * REGRAS:
 * - Apenas Home é acessível sem login
 * - Outras páginas requerem autenticação
 * - Todos os ícones com estilo consistente
 *
 * DESIGN:
 * - Fundo preto com blur
 * - Animações hover/active
 * - Responsivo apenas para mobile
 */
export function MobileNav({ isAuthenticated, onAuthRequired, onNavigate }: MobileNavProps) {
  /**
   * Verifica se usuário está logado antes de executar ação
   * Se não estiver, abre modal de login
   *
   * @param action - Função a ser executada se autenticado
   */
  const handleProtectedAction = (action: () => void) => {
    if (isAuthenticated) {
      action()
    } else {
      onAuthRequired() // Abre modal de login
    }
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-md md:hidden border-t border-gray-800 animate-in slide-in-from-bottom duration-500 delay-1000">
      <div className="flex items-center justify-around py-2 px-1">
        {/* HOME/JOGOS - Sempre acessível */}
        <button
          className="flex flex-col items-center p-2 text-green-400 transition-all duration-300 hover:scale-110 active:scale-95"
          onClick={() => onNavigate("home")}
        >
          <Gamepad2 className="w-6 h-6 transition-transform duration-300 hover:rotate-12" />
        </button>

        {/* DEPÓSITO - Requer autenticação */}
        <button
          className="flex flex-col items-center p-2 text-gray-400 transition-all duration-300 hover:text-gray-200 hover:scale-110 active:scale-95"
          onClick={() => handleProtectedAction(() => onNavigate("deposit"))}
        >
          <DollarSign className="w-6 h-6 transition-transform duration-300 hover:rotate-12" />
        </button>

        {/* CARTEIRA - Requer autenticação */}
        <button
          className="flex flex-col items-center p-2 text-gray-400 transition-all duration-300 hover:text-gray-200 hover:scale-110 active:scale-95"
          onClick={() => handleProtectedAction(() => onNavigate("wallet"))}
        >
          <Wallet className="w-6 h-6 transition-transform duration-300 hover:rotate-12" />
        </button>

        {/* CONFIGURAÇÕES - Requer autenticação */}
        <button
          className="flex flex-col items-center p-2 text-gray-400 transition-all duration-300 hover:text-gray-200 hover:scale-110 active:scale-95"
          onClick={() => handleProtectedAction(() => onNavigate("settings"))}
        >
          <User className="w-6 h-6 transition-transform duration-300 hover:rotate-12" />
        </button>
      </div>
    </nav>
  )
}