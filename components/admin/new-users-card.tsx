"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader } from "lucide-react"

export interface IUser {
  id: string
  name: string
  email: string
  phone: string | null
  balance: number
  isVerified: boolean
  createdAt: string
  lastActivityAt: string | null
}

// Função para comparar se duas listas de usuários são iguais (id, createdAt, balance e lastActivityAt)
function areUsersEqual(arr1: IUser[], arr2: IUser[]) {
  if (arr1.length !== arr2.length) return false

  for (let i = 0; i < arr1.length; i++) {
    const a = arr1[i]
    const b = arr2[i]

    if (
      a.id !== b.id ||
      a.createdAt !== b.createdAt ||
      a.balance !== b.balance ||
      a.lastActivityAt !== b.lastActivityAt
    ) {
      return false
    }
  }

  return true
}

export function NewUsersCard() {
  const [users, setUsers] = useState<IUser[]>([])
  const [newUserIds, setNewUserIds] = useState<string[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRecentUsers = async () => {
    try {
      const response = await fetch('/api/admin/users/recent?limit=5')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch recent users')
      }

      setUsers((currentUsers) => {
        // Pega novos usuários que não estão na lista atual
        const currentUserIds = new Set(currentUsers.map(u => u.id))
        const newUsers = data.users.filter((u: IUser) => !currentUserIds.has(u.id))

        if (newUsers.length === 0) {
          // Sem novos usuários, retorna o estado atual
          return currentUsers
        }

        // Junta os novos usuários na frente e limita a 5, ordenando por createdAt
        const updatedUsers = [...newUsers, ...currentUsers]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)

        // Se a lista for igual, não atualiza o estado (evita reset)
        if (areUsersEqual(updatedUsers, currentUsers)) {
          return currentUsers
        }

        // Atualiza os IDs para efeito visual
        setNewUserIds(newUsers.map(u => u.id))
        setTimeout(() => setNewUserIds([]), 3000)

        return updatedUsers
      })
    } catch (err) {
      console.error('Error fetching users:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  useEffect(() => {
    const initialFetch = async () => {
      await fetchRecentUsers()
      setInitialLoading(false)
    }
    initialFetch()

    const interval = setInterval(fetchRecentUsers, 5000)
    return () => clearInterval(interval)
  }, [])

  if (initialLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Novos Usuários</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-40">
          <Loader className="animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Novos Usuários</CardTitle>
        </CardHeader>
        <CardContent className="text-red-400 text-center py-8">
          Error: {error}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Novos Usuários</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {users.map((user) => (
            <UserItem key={user.id} user={user} isNew={newUserIds.includes(user.id)} />
          ))}
          {users.length === 0 && (
            <p className="text-gray-400 text-center py-4">Nenhum usuário recente</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function UserItem({ user, isNew }: { user: IUser; isNew: boolean }) {
  const getRelativeDate = (dateString: string): string => {
    const date = new Date(dateString)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return "Hoje"
    if (diffDays === 2) return "Ontem"
    if (diffDays <= 7) return `${diffDays - 1} dias atrás`

    return date.toLocaleDateString("pt-BR", {
      day: '2-digit',
      month: '2-digit'
    })
  }

  const getStatusIndicator = (lastActivityAt: string | null) => {
    if (!lastActivityAt) return "text-gray-500"
    
    const lastActive = new Date(lastActivityAt)
    const now = new Date()
    const diffHours = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60)
    
    if (diffHours < 1) return "text-green-500"
    if (diffHours < 24) return "text-yellow-500"
    return "text-red-500"
  }

  return (
    <div className={`flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors ${isNew ? 'bg-yellow-900/50 animate-pulse' : ''}`}>
      <div>
        <div className="flex items-center gap-2">
          <p className="text-white font-medium">{user.name}</p>
          <span className={`w-2 h-2 rounded-full ${getStatusIndicator(user.lastActivityAt)}`} />
        </div>
        <p className="text-gray-400 text-sm truncate max-w-[180px]">{user.email}</p>
      </div>
      <div className="text-right">
        <p className="text-gray-400 text-sm whitespace-nowrap">
          {getRelativeDate(user.createdAt)}
        </p>
        <p className="text-xs text-green-400">
          R$ {(user.balance ?? 0).toFixed(2).replace(".", ",")}
        </p>
      </div>
    </div>
  )
}
