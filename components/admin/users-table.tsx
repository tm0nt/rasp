"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ServiceFactory } from "@/factories/service.factory"
import { UsersTableFilters } from "./users-table-filters"
import { UsersTableContent } from "./users-table-content"
import { UserViewModal } from "./user-view-modal"
import { UserEditModal } from "./user-edit-modal"
import { ConfirmationModal } from "@/components/modals/confirmation-modal"
import { toast } from "@/components/ui/use-toast"
import type { IUser } from "@/types/admin"
import type { IUserService } from "@/interfaces/admin-services"

export function UsersTable() {
  const [users, setUsers] = useState<IUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<IUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null)
  const [modalType, setModalType] = useState<"view" | "edit" | "delete" | null>(null)

  const userService: IUserService = ServiceFactory.getUserService()

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [users, searchTerm, filterStatus])

  const loadUsers = async (): Promise<void> => {
    try {
      setIsLoading(true)
      const usersData = await userService.getUsers()
      setUsers(usersData)
    } catch (error) {
      console.error("Erro ao carregar usuários:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = async (): Promise<void> => {
    try {
      let filtered = [...users]

      if (searchTerm) {
        filtered = await userService.searchUsers(searchTerm)
      }

      if (filterStatus !== "all") {
        filtered = filtered.filter((user) => 
          user.status.toLowerCase() === filterStatus.toLowerCase()
        )
      }

      setFilteredUsers(filtered)
    } catch (error) {
      console.error("Erro ao filtrar usuários:", error)
      setFilteredUsers(users)
    }
  }

  const handleUserAction = async (action: string, userId: string): Promise<void> => {
    try {
      const user = users.find(u => u.id === userId)
      if (!user) return

      setSelectedUser(user)

      switch (action) {
        case "view":
          setModalType("view")
          break
        case "edit":
          setModalType("edit")
          break
        case "delete":
          setModalType("delete")
          break
      }
    } catch (error) {
      console.error(`Erro ao executar ação ${action}:`, error)
      toast({
        title: "Erro",
        description: `Não foi possível ${action === "view" ? "visualizar" : action === "edit" ? "editar" : "excluir"} o usuário`,
        variant: "destructive"
      })
    }
  }

  const handleEditSubmit = async (updatedUser: Partial<IUser>) => {
    if (!selectedUser) return

    try {
      const result = await userService.updateUser(selectedUser.id, updatedUser)
      
      setUsers(users.map(user => 
        user.id === selectedUser.id ? { ...user, ...result } : user
      ))

      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso",
      })

      setModalType(null)
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o usuário",
        variant: "destructive"
      })
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return

    try {
      const success = await userService.deleteUser(selectedUser.id)
      
      if (success) {
        setUsers(users.filter(user => user.id !== selectedUser.id))
        toast({
          title: "Sucesso",
          description: "Usuário desativado com sucesso",
        })
      }

      setModalType(null)
    } catch (error) {
      console.error("Erro ao desativar usuário:", error)
      toast({
        title: "Erro",
        description: "Não foi possível desativar o usuário",
        variant: "destructive"
      })
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

      <UsersTableContent 
        users={filteredUsers} 
        onUserAction={handleUserAction} 
      />

      {/* Modais */}
      {modalType === "view" && selectedUser && (
        <UserViewModal
          user={selectedUser}
          onClose={() => setModalType(null)}
        />
      )}

      {modalType === "edit" && selectedUser && (
        <UserEditModal
          user={selectedUser}
          onClose={() => setModalType(null)}
          onSubmit={handleEditSubmit}
        />
      )}

      {modalType === "delete" && selectedUser && (
        <ConfirmationModal
          title="Confirmar Desativação"
          description={`Tem certeza que deseja desativar o usuário ${selectedUser.name}?`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setModalType(null)}
        />
      )}
    </div>
  )
}

function UsersTableHeader() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Usuários</h1>
      <p className="text-gray-400">Gerencie todos os usuários do sistema</p>
    </div>
  )
}

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