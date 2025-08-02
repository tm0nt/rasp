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

export function NewUsersCard() {
  const [users, setUsers] = useState<IUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRecentUsers = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/users/recent?limit=5')
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch recent users')
        }

        setUsers(data.users)
      } catch (err) {
        console.error('Error fetching users:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchRecentUsers()
  }, [])

  if (loading) {
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
            <UserItem key={user.id} user={user} />
          ))}
          {users.length === 0 && (
            <p className="text-gray-400 text-center py-4">Nenhum usuário recente</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function UserItem({ user }: { user: IUser }) {
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
    <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
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