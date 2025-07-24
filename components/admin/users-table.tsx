"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { UsersTableFilters } from "./users-table-filters"
import { UsersTableContent } from "./users-table-content"
import { UserViewModal } from "./user-view-modal"
import { UserEditModal } from "./user-edit-modal"
import { ConfirmationModal } from "@/components/modals/confirmation-modal"
import { toast } from "@/components/ui/use-toast"
import type { IUser } from "@/types/admin"
import { PowerOff, Trash2 } from "lucide-react"

export function UsersTable() {
  const [users, setUsers] = useState<IUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<IUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null)
  const [modalType, setModalType] = useState<"view" | "edit" | "deactivate" | "delete" | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [users, searchTerm, filterStatus])

  const loadUsers = async (): Promise<void> => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/users')
      if (!response.ok) throw new Error('Failed to fetch users')
      
      const { data } = await response.json()
      setUsers(data)
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

  const applyFilters = (): void => {
    let filtered = [...users]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(term) || 
        user.email.toLowerCase().includes(term) ||
        user.phone?.toLowerCase().includes(term)
      )
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(user => 
        user.status.toLowerCase() === filterStatus.toLowerCase()
      )
    }

    setFilteredUsers(filtered)
  }

  const handleUserAction = (action: string, userId: string): void => {
    const user = users.find(u => u.id === userId)
    if (!user) return

    setSelectedUser(user)
    setModalType(action as "view" | "edit" | "deactivate" | "delete")
  }

  const handleEditSubmit = async (updatedUser: Partial<IUser>) => {
    if (!selectedUser) return

    try {
      setIsProcessing(true)
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedUser)
      })

      if (!response.ok) throw new Error('Failed to update user')

      const { data } = await response.json()
      
      setUsers(users.map(user => 
        user.id === selectedUser.id ? { ...user, ...data } : user
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
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeactivateConfirm = async () => {
    if (!selectedUser) return

    try {
      setIsProcessing(true)
      const response = await fetch(`/api/admin/users/${selectedUser.id}/deactivate`, {
        method: 'PATCH'
      })

      if (!response.ok) throw new Error('Failed to deactivate user')

      setUsers(users.map(user => 
        user.id === selectedUser.id ? { ...user, is_active: false, status: 'inactive' } : user
      ))

      toast({
        title: "Sucesso",
        description: "Usuário desativado com sucesso",
      })

      setModalType(null)
    } catch (error) {
      console.error("Erro ao desativar usuário:", error)
      toast({
        title: "Erro",
        description: "Não foi possível desativar o usuário",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return

    try {
      setIsProcessing(true)
      const response = await fetch(`/api/admin/users/${selectedUser.id}/delete`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete user')

      setUsers(users.filter(user => user.id !== selectedUser.id))

      toast({
        title: "Sucesso",
        description: "Usuário excluído permanentemente com sucesso",
      })
      loadUsers()

      setModalType(null)
    } catch (error) {
      console.error("Erro ao excluir usuário:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o usuário",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
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
          isLoading={isProcessing}
        />
      )}

      {modalType === "deactivate" && selectedUser && (
        <ConfirmationModal
          title="Confirmar Desativação"
          description={`Tem certeza que deseja desativar o usuário ${selectedUser.name}?`}
          confirmText="Desativar"
          variant="warning"
          icon={<PowerOff className="w-5 h-5" />}
          onConfirm={handleDeactivateConfirm}
          onCancel={() => setModalType(null)}
          isLoading={isProcessing}
        />
      )}

      {modalType === "delete" && selectedUser && (
        <ConfirmationModal
          title="Confirmar Exclusão"
          description={`Tem certeza que deseja excluir permanentemente o usuário ${selectedUser.name}? Esta ação não pode ser desfeita.`}
          confirmText="Excluir Permanentemente"
          variant="destructive"
          icon={<Trash2 className="w-5 h-5" />}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setModalType(null)}
          isLoading={isProcessing}
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