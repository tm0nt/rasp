"use client"
import { X, CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react"
import { useToast, type Toast } from "@/contexts/toast-context"

interface ToastItemProps {
  toast: Toast
}

function ToastItem({ toast }: ToastItemProps) {
  const { removeToast } = useToast()

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case "error":
        return <XCircle className="w-5 h-5 text-red-400" />
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />
      case "info":
        return <Info className="w-5 h-5 text-blue-400" />
      default:
        return <Info className="w-5 h-5 text-blue-400" />
    }
  }

  const getBackgroundColor = () => {
    switch (toast.type) {
      case "success":
        return "bg-green-900/90 border-green-500/50"
      case "error":
        return "bg-red-900/90 border-red-500/50"
      case "warning":
        return "bg-yellow-900/90 border-yellow-500/50"
      case "info":
        return "bg-blue-900/90 border-blue-500/50"
      default:
        return "bg-gray-900/90 border-gray-500/50"
    }
  }

  return (
    <div
      className={`
        ${getBackgroundColor()}
        backdrop-blur-md border rounded-lg p-4 shadow-lg
        animate-in slide-in-from-right-full duration-300
        max-w-md w-full
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-semibold text-sm mb-1">{toast.title}</h4>
          <p className="text-gray-300 text-sm leading-relaxed">{toast.message}</p>
        </div>
        <button
          onClick={() => removeToast(toast.id)}
          className="flex-shrink-0 text-gray-400 hover:text-white transition-colors duration-200 hover:scale-110"
          aria-label="Fechar notificação"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export function ToastContainer() {
  const { toasts } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      <div className="space-y-2 pointer-events-auto">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </div>
    </div>
  )
}
