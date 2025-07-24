"use client"

import { useState } from "react"

/**
 * Tipos de páginas disponíveis no sistema
 * IMPORTANTE: Adicionar novas páginas aqui quando criadas
 */
export type PageType =
  | "home"
  | "wallet"
  | "bonuses"
  | "deliveries"
  | "refer"
  | "settings"
  | "deposit"
  | "cart"
  | "withdraw"
  | "scratch-game"

/**
 * Hook customizado para gerenciamento de navegação SPA
 *
 * FUNCIONALIDADES:
 * - Navegação entre páginas sem reload
 * - Histórico de navegação
 * - Função de voltar
 *
 * VANTAGENS:
 * - Mais rápido que navegação tradicional
 * - Mantém estado da aplicação
 * - Melhor UX em mobile
 *
 * LIMITAÇÕES:
 * - Não atualiza URL do navegador
 * - Histórico não persiste entre reloads
 *
 * TODO: Considerar integração com Next.js Router para URLs reais
 */
export function useNavigation() {
  const [currentPage, setCurrentPage] = useState<PageType>("home")
  const [pageHistory, setPageHistory] = useState<PageType[]>(["home"])

  /**
   * Navega para uma nova página
   * Adiciona a página atual ao histórico
   *
   * @param page - Página de destino
   */
  const navigateTo = (page: PageType) => {
    setCurrentPage(page)
    setPageHistory((prev) => [...prev, page])
  }

  /**
   * Volta para a página anterior no histórico
   * Se não houver histórico, permanece na página atual
   *
   * NOTA: Sempre mantém pelo menos uma página no histórico
   */
  const goBack = () => {
    if (pageHistory.length > 1) {
      const newHistory = pageHistory.slice(0, -1)
      const previousPage = newHistory[newHistory.length - 1]
      setPageHistory(newHistory)
      setCurrentPage(previousPage)
    }
  }

  return {
    currentPage,
    navigateTo,
    goBack,
    canGoBack: pageHistory.length > 1, // Indica se é possível voltar
  }
}
