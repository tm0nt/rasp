"use client"

interface LoginMethodTabsProps {
  activeMethod: "email" | "phone"
  onMethodChange: (method: "email" | "phone") => void
}

/**
 * Toggle tabs for selecting login method (email or phone)
 * Features:
 * - Smooth transitions
 * - Active state styling
 * - Accessible button design
 * - Enhanced visual effects
 */
export function LoginMethodTabs({ activeMethod, onMethodChange }: LoginMethodTabsProps) {
  return (
    <div className="relative bg-transparent border-2 border-gray-600 rounded-xl p-1 backdrop-blur-sm">
      {/* Background slider */}
      <div
        className={`
          absolute top-1 bottom-1 w-[calc(50%-4px)] 
          bg-gradient-to-r from-green-500 to-green-600 
          rounded-lg transition-all duration-300 ease-out
          shadow-lg shadow-green-500/25
          ${activeMethod === "email" ? "left-1" : "left-[calc(50%+2px)]"}
        `}
      />

      <div className="relative flex">
        <button
          type="button"
          onClick={() => onMethodChange("email")}
          className={`
            flex-1 py-3 px-6 text-sm font-medium rounded-lg
            transition-all duration-300 relative z-10
            ${activeMethod === "email" ? "text-white" : "text-gray-400 hover:text-gray-200"}
          `}
        >
          E-mail
        </button>
        <button
          type="button"
          onClick={() => onMethodChange("phone")}
          className={`
            flex-1 py-3 px-6 text-sm font-medium rounded-lg
            transition-all duration-300 relative z-10
            ${activeMethod === "phone" ? "text-white" : "text-gray-400 hover:text-gray-200"}
          `}
        >
          Telefone
        </button>
      </div>
    </div>
  )
}
