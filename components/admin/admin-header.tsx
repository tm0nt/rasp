"use client"

import { Button } from "@/components/ui/button"
import { Menu, LogOut, User } from "lucide-react"

interface AdminHeaderProps {
  admin: {
    id: string
    name: string
    email: string
    role: string
  }
  onLogout: () => void
  onMenuClick: () => void
}

/**
 * Header da administração
 */
export function AdminHeader({ admin, onLogout, onMenuClick }: AdminHeaderProps) {
  return (
    <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Mobile Menu Button */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onMenuClick} className="lg:hidden text-gray-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold text-white">Painel Administrativo</h1>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-300">
            <User className="w-5 h-5" />
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-white">{admin?.name}</p>
              <p className="text-xs text-gray-400">{admin?.role}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onLogout} className="text-gray-400 hover:text-white">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
