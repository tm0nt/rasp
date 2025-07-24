// components/modals/confirmation-modal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle2, Trash2, PowerOff } from "lucide-react"
import { cn } from "@/lib/utils"

type Variant = "default" | "destructive" | "success" | "warning"

interface ConfirmationModalProps {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: Variant
  icon?: React.ReactNode
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

const variantStyles: Record<Variant, string> = {
  default: "bg-blue-600 hover:bg-blue-700",
  destructive: "bg-red-600 hover:bg-red-700",
  success: "bg-green-600 hover:bg-green-700",
  warning: "bg-yellow-600 hover:bg-yellow-700"
}

const variantIcons: Record<Variant, React.ReactNode> = {
  default: <CheckCircle2 className="w-5 h-5" />,
  destructive: <Trash2 className="w-5 h-5" />,
  success: <CheckCircle2 className="w-5 h-5" />,
  warning: <AlertCircle className="w-5 h-5" />
}

export function ConfirmationModal({
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "default",
  icon,
  onConfirm,
  onCancel,
  isLoading = false
}: ConfirmationModalProps) {
  const IconComponent = icon || variantIcons[variant]

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[425px] bg-gray-800 border-gray-700">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-full",
              variant === "destructive" && "bg-red-900/20 text-red-500",
              variant === "warning" && "bg-yellow-900/20 text-yellow-500",
              variant === "success" && "bg-green-900/20 text-green-500",
              variant === "default" && "bg-blue-900/20 text-blue-500"
            )}>
              {IconComponent}
            </div>
            <DialogTitle className="text-white">{title}</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="py-4 pl-4 border-l-2 border-gray-700 ml-3">
          <p className="text-gray-300">{description}</p>
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            onClick={onCancel}
            variant="outline"
            className="border-gray-600 hover:bg-gray-700"
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            className={cn(
              "flex items-center gap-2",
              variantStyles[variant],
              isLoading && "opacity-70 cursor-not-allowed"
            )}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              variant === "destructive" && <PowerOff className="w-4 h-4" />
            )}
            {confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}