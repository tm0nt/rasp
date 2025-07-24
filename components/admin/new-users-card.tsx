/**
 * Componente para card de novos usuários
 * Implementa Single Responsibility Principle (SRP)
 */

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { IUser } from "@/types/admin"

interface NewUsersCardProps {
  users: IUser[]
}

/**
 * Componente responsável apenas por exibir os novos usuários
 */
export function NewUsersCard({ users }: NewUsersCardProps) {
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
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Componente para item individual de usuário
 */
interface UserItemProps {
  user: IUser
}

function UserItem({ user }: UserItemProps) {
  const getRelativeDate = (dateString: string): string => {
    const date = new Date(dateString)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return "Hoje"
    if (diffDays === 2) return "Ontem"
    if (diffDays <= 7) return `${diffDays - 1} dias atrás`

    return date.toLocaleDateString("pt-BR")
  }

  return (
    <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
      <div>
        <p className="text-white font-medium">{user.name}</p>
        <p className="text-gray-400 text-sm">{user.email}</p>
      </div>
      <div className="text-right">
        <p className="text-gray-400 text-sm">{getRelativeDate(user.createdAt)}</p>
      </div>
    </div>
  )
}
