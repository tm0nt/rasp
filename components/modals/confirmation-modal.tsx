// components/modals/confirmation-modal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ConfirmationModalProps {
  title: string
  description: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmationModal({
  title,
  description,
  onConfirm,
  onCancel
}: ConfirmationModalProps) {
  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[425px] bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">{title}</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-gray-300">{description}</p>
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            onClick={onCancel}
            className="bg-gray-700 hover:bg-gray-600"
          >
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700"
          >
            Confirmar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}