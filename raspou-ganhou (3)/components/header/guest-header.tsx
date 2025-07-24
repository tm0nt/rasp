"use client"

import { Button } from "@/components/ui/button"
import { User, LogIn } from "lucide-react"

interface GuestHeaderProps {
  onOpenModal: (tab: "login" | "register") => void
}

/**
 * Header component for non-authenticated users
 * Features:
 * - Login button
 * - Register button
 * - Consistent styling with main design
 */
export function GuestHeader({ onOpenModal }: GuestHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <Button
        variant="ghost"
        className="text-white hover:text-gray-300 text-sm px-4 py-2 font-medium transition-all duration-300 hover:bg-white/10 hover:scale-105 active:scale-95"
        onClick={() => onOpenModal("register")}
      >
        <User className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:rotate-12" />
        Cadastrar
      </Button>
      <Button
        className="bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-2 font-medium transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25 hover:scale-105 active:scale-95 group"
        onClick={() => onOpenModal("login")}
      >
        <LogIn className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:translate-x-1" />
        Entrar
      </Button>
    </div>
  )
}
