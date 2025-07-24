"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ServiceFactory } from "@/factories/service.factory"
import { UsersTableFilters } from "./users-table-filters"
import { UsersTableContent } from "./users-table-content"
import type { IUser } from "@/types/admin"
import type { IUserService } from "@/interfaces/admin-services"

/**
 * Componente refatorado para tabela de usuários
 * Implementa Single Responsibility Principle (SRP)
 */

/**
 * Componente principal da tabela de usuários
 * Responsável apenas por gerenciar estado e orquestrar sub-componentes
 */
export function UsersTable() {
  const [users, setUsers] = useState<IUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<IUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  // Injeta dependência do serviço de usuários
  const userService: IUserService = ServiceFactory.getUserService()

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [users, searchTerm, filterStatus])

  /**
   * Carrega lista de usuários
   */
  const loadUsers = async (): Promise<void> => {
    try {
      setIsLoading(true)
      const usersData = await userService.getUsers()
      setUsers(usersData)
    } catch (error) {
      console.error("Erro ao carregar usuários:", error)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Aplica filtros aos usuários
   */
  const applyFilters = async (): Promise<void> => {
    try {
      let filtered = [...users]

      // Aplica filtro de busca
      if (searchTerm) {
        filtered = await userService.searchUsers(searchTerm)
      }

      // Aplica filtro de status
      if (filterStatus !== "all") {
        filtered = filtered.filter((user) => user.status.toLowerCase() === filterStatus.toLowerCase())
      }

      setFilteredUsers(filtered)
    } catch (error) {
      console.error("Erro ao filtrar usuários:", error)
      setFilteredUsers(users)
    }
  }

  /**
   * Manipula ações dos usuários
   */
  const handleUserAction = async (action: string, userId: string): Promise<void> => {
    try {
      switch (action) {
        case "view":
          console.log("Visualizar usuário:", userId)
          // TODO: Implementar modal de visualização
          break
        case "edit":
          console.log("Editar usuário:", userId)
          // TODO: Implementar modal de edição
          break
        case "delete":
          const success = await userService.deleteUser(userId)
          if (success) {
            await loadUsers() // Recarrega a lista
          }
          break
      }
    } catch (error) {
      console.error(`Erro ao executar ação ${action}:`, error)
    }
  }

  if (isLoading) {
    return <UsersTableLoadingState />
  }

  return (
    <div className="space-y-6">
      <UsersTableHeader />

      <UsersTableFilters
        searchTerm={searchTerm}
        filterStatus={filterStatus}
        onSearchChange={setSearchTerm}
        onStatusChange={setFilterStatus}
      />

      <UsersTableContent users={filteredUsers} onUserAction={handleUserAction} />
    </div>
  )
}

/**
 * Componente para cabeçalho da tabela
 */
function UsersTableHeader() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Usuários</h1>
      <p className="text-gray-400">Gerencie todos os usuários do sistema</p>
    </div>
  )
}

/**
 * Componente para estado de carregamento
 */
function UsersTableLoadingState() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-1/4 mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-1/3"></div>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-16 bg-gray-700 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
