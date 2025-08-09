"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { UsersTableFilters } from "./users-table-filters"
import { UsersTableContent } from "./users-table-content"
import { UserViewModal } from "./user-view-modal"
import { UserEditModal } from "./user-edit-modal"
import { ConfirmationModal } from "@/components/modals/confirmation-modal"
import { toast } from "@/components/ui/use-toast"
import type { IUser } from "@/types/admin"
import { PowerOff, Trash2, Gem } from "lucide-react"

export function UsersTable() {
  const [users, setUsers] = useState<IUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterInfluencer, setFilterInfluencer] = useState("all")
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null)
  const [modalType, setModalType] = useState<"view" | "edit" | "deactivate" | "delete" | "influencer" | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const limit = 10

  useEffect(() => {
    loadUsers()
  }, [currentPage, searchTerm, filterInfluencer]) // <-- atualizado aqui, remove filterStatus

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterInfluencer]) // <-- atualizado aqui, remove filterStatus

  const loadUsers = async (): Promise<void> => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        search: searchTerm,
        influencer: filterInfluencer,   // <-- usa influencer no fetch
        page: currentPage.toString(),
        limit: limit.toString(),
      })
      const response = await fetch(`/api/admin/users?${params}`)
      if (!response.ok) throw new Error('Failed to fetch users')
      
      const { data, pagination } = await response.json()
      setUsers(data)
      setTotalPages(pagination.totalPages)
      setTotalUsers(pagination.total)
      if (currentPage > pagination.totalPages) {
        setCurrentPage(pagination.totalPages || 1)
      }
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

  const handleUserAction = (action: string, userId: string): void => {
    const user = users.find(u => u.id === userId)
    if (!user) return

    setSelectedUser(user)
    setModalType(action as "view" | "edit" | "deactivate" | "delete" | "influencer")
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

      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso",
      })

      setModalType(null)
      await loadUsers()
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

      toast({
        title: "Sucesso",
        description: "Usuário desativado com sucesso",
      })

      setModalType(null)
      await loadUsers()
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

      toast({
        title: "Sucesso",
        description: "Usuário excluído permanentemente com sucesso",
      })

      setModalType(null)
      await loadUsers()
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

  const handleInfluencerConfirm = async () => {
    if (!selectedUser) return

    try {
      setIsProcessing(true)
      const response = await fetch(`/api/admin/users/${selectedUser.id}/influencer`, {
        method: 'PATCH'
      })

      if (!response.ok) throw new Error('Failed to make user influencer')

      toast({
        title: "Sucesso",
        description: "Usuário transformado em influencer com sucesso",
      })

      setModalType(null)
      await loadUsers()
    } catch (error) {
      console.error("Erro ao transformar em influencer:", error)
      toast({
        title: "Erro",
        description: "Não foi possível transformar o usuário em influencer",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <UsersTableHeader />

<UsersTableFilters
  searchTerm={searchTerm}
  filterInfluencer={filterInfluencer}
  onSearchChange={setSearchTerm}
  onInfluencerChange={setFilterInfluencer}
/>


      {isLoading ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className="h-16 bg-gray-700 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <UsersTableContent 
          users={users} 
          onUserAction={handleUserAction} 
        />
      )}

      {!isLoading && totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
            <span className="mx-2 text-sm text-gray-400">
              Página {currentPage} de {totalPages}
            </span>
            <PaginationItem>
              <PaginationNext 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

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

      {modalType === "influencer" && selectedUser && (
        <ConfirmationModal
          title="Transformar em Influencer"
          description={`Tem certeza que deseja transformar o usuário ${selectedUser.name} em influencer?`}
          confirmText="Transformar"
          variant="default"
          icon={<Gem className="w-5 h-5" />}
          onConfirm={handleInfluencerConfirm}
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
