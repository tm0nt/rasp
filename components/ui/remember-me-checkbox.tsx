"use client"

import { Checkbox } from "@/components/ui/checkbox"

interface RememberMeCheckboxProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  id?: string
  label?: string
}

/**
 * Styled "Remember Me" checkbox component
 * Features:
 * - Green theme styling
 * - Hover animations
 * - Accessible labeling
 */
export function RememberMeCheckbox({
  checked,
  onCheckedChange,
  id = "remember-me",
  label = "Lembrar de mim",
}: RememberMeCheckboxProps) {
  return (
    <div className="flex items-center space-x-2 group">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="transition-all duration-200 hover:scale-110 border-green-500 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
      />
      <label
        htmlFor={id}
        className="text-sm text-gray-300 cursor-pointer transition-colors duration-200 group-hover:text-white"
      >
        {label}
      </label>
    </div>
  )
}
