"use client"

interface AuthTabsProps {
  activeTab: "login" | "register"
  onTabChange: (tab: "login" | "register") => void
}

/**
 * Authentication tabs component for switching between login and register
 * Features:
 * - Smooth tab transitions
 * - Active state indicators
 * - Accessible navigation
 */
export function AuthTabs({ activeTab, onTabChange }: AuthTabsProps) {
  return (
    <div className="flex mb-6 animate-in slide-in-from-top-4 duration-500 delay-300">
      <button
        onClick={() => onTabChange("login")}
        className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-all duration-300 relative overflow-hidden ${
          activeTab === "login" ? "border-green-500 text-white" : "border-gray-600 text-gray-400 hover:text-gray-200"
        }`}
      >
        <span className="relative z-10">Conecte-se</span>
        {activeTab === "login" && (
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-500 animate-in slide-in-from-left duration-300" />
        )}
      </button>
      <button
        onClick={() => onTabChange("register")}
        className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-all duration-300 relative overflow-hidden ${
          activeTab === "register" ? "border-green-500 text-white" : "border-gray-600 text-gray-400 hover:text-gray-200"
        }`}
      >
        <span className="relative z-10">Inscrever-se</span>
        {activeTab === "register" && (
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-500 animate-in slide-in-from-left duration-300" />
        )}
      </button>
    </div>
  )
}
