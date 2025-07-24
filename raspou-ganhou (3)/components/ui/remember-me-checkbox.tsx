"use client"

import { Check } from "lucide-react"

interface RememberMeCheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
}

export function RememberMeCheckbox({
  checked,
  onChange,
  label = "Lembrar de mim",
  disabled = false,
}: RememberMeCheckboxProps) {
  return (
    <label className="flex items-center space-x-2 cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={`
            w-4 h-4 rounded border-2 transition-all duration-200
            ${checked ? "bg-green-600 border-green-600" : "bg-white border-gray-300 hover:border-green-400"}
            ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          `}
        >
          {checked && <Check className="w-3 h-3 text-white absolute top-0 left-0" strokeWidth={3} />}
        </div>
      </div>
      <span
        className={`
          text-sm select-none
          ${disabled ? "text-gray-400 cursor-not-allowed" : "text-gray-700 cursor-pointer"}
        `}
      >
        {label}
      </span>
    </label>
  )
}
