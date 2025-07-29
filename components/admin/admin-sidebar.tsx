"use client"

import { LayoutDashboard, Users, CreditCard, Gift, UserCheck, Settings, LockIcon ,Banknote, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AdminSidebarProps {
  currentPage: string
  onPageChange: (page: string) => void
  isOpen: boolean
  onClose: () => void
}

/**
 * Sidebar de navegação da administração
 */
export function AdminSidebar({ currentPage, onPageChange, isOpen, onClose }: AdminSidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "users", label: "Usuários", icon: Users },
    { id: "transactions", label: "Transações", icon: CreditCard },
    { id: "bonuses", label: "Bônus", icon: Gift },
    { id: "affiliates", label: "Afiliados", icon: UserCheck },
    { id: "settings", label: "Configurações", icon: Settings },
    { id: "password", label: "Senha", icon: LockIcon },
  ]

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <div
        className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-gray-800 border-r border-gray-700 transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Admin Panel</h2>
              <Button variant="ghost" size="sm" onClick={onClose} className="lg:hidden text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Menu */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onPageChange(item.id)
                  onClose()
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors
                  ${
                    currentPage === item.id
                      ? "bg-red-600 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }
                `}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </>
  )
}
