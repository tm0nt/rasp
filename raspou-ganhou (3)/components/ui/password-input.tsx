"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Lock, Eye, EyeOff } from "lucide-react"

interface PasswordInputProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  className?: string
  required?: boolean
}

/**
 * Reusable password input component with visibility toggle
 * Features:
 * - Lock icon on the left
 * - Eye/EyeOff toggle on the right
 * - Smooth transitions and hover effects
 * - Transparent background with interactive borders
 */
export function PasswordInput({
  placeholder = "Senha",
  value,
  onChange,
  className = "",
  required = false,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const handleToggleVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="relative group">
      {/* Lock icon */}
      <Lock
        className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-300 z-10 ${
          isFocused ? "text-green-400 scale-110" : "text-gray-400 group-hover:text-gray-300"
        }`}
      />

      {/* Password input field */}
      <Input
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`
          bg-transparent border-2 text-white placeholder-gray-400 
          pl-14 pr-14 py-4 h-14 text-base
          transition-all duration-300 ease-out
          border-gray-600 hover:border-gray-500
          focus:border-green-400 focus:shadow-lg focus:shadow-green-400/20
          focus:bg-green-400/5
          group-hover:bg-gray-800/20
          rounded-xl
          ${isFocused ? "ring-2 ring-green-400/30" : ""}
          ${className}
        `}
        required={required}
      />

      {/* Visibility toggle button */}
      <button
        type="button"
        onClick={handleToggleVisibility}
        className={`
          absolute right-4 top-1/2 -translate-y-1/2 
          w-10 h-10 rounded-lg flex items-center justify-center
          transition-all duration-300 z-10
          hover:bg-gray-700/50 active:scale-95
          ${isFocused ? "text-green-400" : "text-gray-400 hover:text-white"}
        `}
        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
      >
        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>

      {/* Animated border gradient */}
      {isFocused && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-400/20 via-transparent to-green-400/20 animate-pulse pointer-events-none" />
      )}
    </div>
  )
}
