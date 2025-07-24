"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import type { LucideIcon } from "lucide-react"

interface IconInputProps {
  icon: LucideIcon
  type?: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  className?: string
  required?: boolean
}

/**
 * Reusable input component with left-side icon
 * Features:
 * - Dynamic icon support
 * - Consistent styling and animations
 * - Focus state management
 * - Transparent background with interactive borders
 */
export function IconInput({
  icon: Icon,
  type = "text",
  placeholder,
  value,
  onChange,
  className = "",
  required = false,
}: IconInputProps) {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <div className="relative group">
      {/* Dynamic icon */}
      <Icon
        className={`
          absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 
          transition-all duration-300 z-10
          ${isFocused ? "text-green-400 scale-110" : "text-gray-400 group-hover:text-gray-300"}
        `}
      />

      {/* Input field */}
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`
          bg-transparent border-2 text-white placeholder-gray-400 
          pl-14 py-4 h-14 text-base
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

      {/* Animated border gradient */}
      {isFocused && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-400/20 via-transparent to-green-400/20 animate-pulse pointer-events-none" />
      )}
    </div>
  )
}
