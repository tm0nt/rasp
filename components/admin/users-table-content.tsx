/**
 * Componente para conteúdo da tabela de usuários
 * Implementa Single Responsibility Principle (SRP)
 */

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Edit, Trash2, Mail, Phone, Calendar, Wallet, Package, Gift, TrendingDown, Gamepad2, Gem } from "lucide-react"
import type { IUser } from "@/types/admin"

interface UsersTableContentProps {
  users: IUser[]
  onUserAction: (action: string, userId: string) => void
}

/**
 * Componente responsável apenas por renderizar o conteúdo da tabela
 */
export function UsersTableContent({ users, onUserAction }: UsersTableContentProps) {
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Lista de Usuários ({users.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <UsersTableHeader />
            <tbody>
              {users.map((user) => (
                <UserTableRow key={user.id} user={user} onAction={onUserAction} />
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Componente para cabeçalho da tabela
 */
function UsersTableHeader() {
  const headers = ["Usuário", "Contato", "Criado em", "Carteira", "Atividade", "Status", "Ações"]

  return (
    <thead>
      <tr className="border-b border-gray-700">
        {headers.map((header) => (
          <th key={header} className="text-left py-3 px-4 text-gray-300 font-medium">
            {header}
          </th>
        ))}
      </tr>
    </thead>
  )
}

/**
 * Componente para linha individual da tabela
 */
interface UserTableRowProps {
  user: IUser
  onAction: (action: string, userId: string) => void
}

function UserTableRow({ user, onAction }: UserTableRowProps) {
  return (
    <tr className="border-b border-gray-700/50 hover:bg-gray-700/30">
      <UserInfoCell user={user} />
      <ContactInfoCell user={user} />
      <CreatedDateCell createdAt={user.createdAt} />
      <WalletCell balance={user.balance} />
      <ActivityCell user={user} />
      <StatusCell status={user.status} />
      <ActionsCell userId={user.id} onAction={onAction} isInfluencer={user.influencer} />
    </tr>
  )
}

/**
 * Componente para célula de informações do usuário
 */
function UserInfoCell({ user }: { user: IUser }) {
  return (
    <td className="py-4 px-4">
      <div>
        <p className="text-white font-medium">{user.name}</p>
        <p className="text-gray-400 text-sm">ID: {user.id}</p>
      </div>
    </td>
  )
}

/**
 * Componente para célula de contato
 */
function ContactInfoCell({ user }: { user: IUser }) {
  return (
    <td className="py-4 px-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-gray-300">
          <Mail className="w-3 h-3" />
          <span className="text-xs">{user.email}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-300">
          <Phone className="w-3 h-3" />
          <span className="text-xs">{user.phone}</span>
        </div>
      </div>
    </td>
  )
}

/**
 * Componente para célula de data de criação
 */
function CreatedDateCell({ createdAt }: { createdAt: string }) {
  return (
    <td className="py-4 px-4">
      <div className="flex items-center gap-2 text-gray-300">
        <Calendar className="w-4 h-4" />
        <span className="text-sm">{createdAt}</span>
      </div>
    </td>
  )
}

/**
 * Componente para célula da carteira
 */
function WalletCell({ balance }: { balance: number }) {
  return (
    <td className="py-4 px-4">
      <div className="flex items-center gap-2">
        <Wallet className="w-4 h-4 text-green-400" />
        <span className="text-green-400 font-medium">R$ {(balance ?? 0).toFixed(2).replace(".", ",")}</span>
      </div>
    </td>
  )
}

/**
 * Componente para célula de atividade
 */
function ActivityCell({ user }: { user: IUser }) {
  const activities = [
    { icon: Package, value: user.deliveries, color: "text-gray-300" },
    { icon: Gift, value: user.bonuses, color: "text-gray-300" },
    { icon: TrendingDown, value: user.withdrawals, color: "text-gray-300" },
    { icon: Gamepad2, value: user.scratchGames, color: "text-gray-300" },
  ]

  return (
    <td className="py-4 px-4">
      <div className="grid grid-cols-2 gap-2 text-xs">
        {activities.map((activity, index) => (
          <div key={index} className={`flex items-center gap-1 ${activity.color}`}>
            <activity.icon className="w-3 h-3" />
            <span>{activity.value}</span>
          </div>
        ))}
      </div>
    </td>
  )
}

/**
 * Componente para célula de status
 */
function StatusCell({ status }: { status: string }) {
  return (
    <td className="py-4 px-4">
      <Badge
        variant={status === "Ativo" ? "default" : "secondary"}
        className={
          status === "Ativo"
            ? "bg-green-500/20 text-green-400 border-green-500/30"
            : "bg-gray-500/20 text-gray-400 border-gray-500/30"
        }
      >
        {status}
      </Badge>
    </td>
  )
}

/**
 * Componente para célula de ações
 */
interface ActionsCellProps {
  userId: string
  onAction: (action: string, userId: string) => void
  isInfluencer: boolean
}

function ActionsCell({ userId, onAction, isInfluencer }: ActionsCellProps) {
  const actions = [
    { action: "view", icon: Eye, color: "text-blue-400 hover:bg-blue-500/20" },
    { action: "edit", icon: Edit, color: "text-yellow-400 hover:bg-yellow-500/20" },
    { action: "influencer", icon: Gem, color: "text-purple-400 hover:bg-purple-500/20", disabled: isInfluencer },
    { action: "delete", icon: Trash2, color: "text-red-400 hover:bg-red-500/20" },
  ]

  return (
    <td className="py-4 px-4">
      <div className="flex gap-2">
        {actions.map(({ action, icon: Icon, color, disabled }) => (
          <Button key={action} size="sm" variant="ghost" onClick={() => !disabled && onAction(action, userId)} className={`${color} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <Icon className="w-4 h-4" />
          </Button>
        ))}
      </div>
    </td>
  )
}