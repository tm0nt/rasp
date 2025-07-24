// components/user-view-modal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { UserIcon, MailIcon, PhoneIcon, WalletIcon, CalendarIcon, CheckIcon, XIcon } from "lucide-react"

interface UserViewModalProps {
  user: IUser
  onClose: () => void
}

export function UserViewModal({ user, onClose }: UserViewModalProps) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Detalhes do Usuário</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div className="flex items-center space-x-3">
            <UserIcon className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-400">Nome</p>
              <p className="text-white">{user.name}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <MailIcon className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-400">Email</p>
              <p className="text-white">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <PhoneIcon className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-400">Telefone</p>
              <p className="text-white">{user.phone || "Não informado"}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <WalletIcon className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-400">Saldo</p>
              <p className="text-white">R$ {user.balance.toFixed(2).replace(".", ",")}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-400">Cadastrado em</p>
              <p className="text-white">
                {new Date(user.created_at).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {user.is_verified ? (
              <CheckIcon className="h-5 w-5 text-green-400" />
            ) : (
              <XIcon className="h-5 w-5 text-red-400" />
            )}
            <div>
              <p className="text-sm text-gray-400">Verificado</p>
              <p className="text-white">
                {user.is_verified ? "Sim" : "Não"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose} className="bg-gray-700 hover:bg-gray-600">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}