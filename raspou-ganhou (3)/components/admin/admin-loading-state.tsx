/**
 * Componente para estado de carregamento da administração
 * Implementa Single Responsibility Principle (SRP)
 */

"use client"

/**
 * Componente responsável apenas por exibir o estado de carregamento
 */
export function AdminLoadingState() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Carregando painel administrativo...</p>
      </div>
    </div>
  )
}
