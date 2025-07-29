"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Lock } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function PasswordSettings() {
  const { toast } = useToast()
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handlePasswordChange = async () => {
    if (!isOnline) {
      toast({
        title: "⚠️ Você está offline",
        description: "Não é possível alterar a senha sem conexão",
        variant: "default",
        duration: 5000,
      })
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "❌ Erro",
        description: "As senhas nova e de confirmação não coincidem",
        variant: "destructive",
        duration: 5000,
      })
      return
    }

    if (passwordForm.newPassword.length < 8) {
      toast({
        title: "❌ Erro",
        description: "A nova senha deve ter pelo menos 8 caracteres",
        variant: "destructive",
        duration: 5000,
      })
      return
    }

    setIsChangingPassword(true)
    try {
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/admin/change-password?t=${timestamp}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao alterar a senha")
      }

      toast({
        title: "✅ Sucesso",
        description: "Senha alterada com sucesso",
        className: "bg-green-600 text-white border-0",
        duration: 3000,
      })

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "❌ Erro ao alterar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Alterar Senha</h1>
        <p className="text-gray-400">Atualize sua senha de administrador</p>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Alteração de Senha
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Senha Atual</label>
            <Input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Nova Senha</label>
            <Input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white"
            />
            <p className="text-xs text-gray-400 mt-1">Mínimo de 8 caracteres</p>
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Confirmar Nova Senha</label>
            <Input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handlePasswordChange}
              className="bg-green-600 hover:bg-green-700 text-white px-8"
              disabled={isChangingPassword || !isOnline}
            >
              {isChangingPassword ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Alterando...
                </>
              ) : !isOnline ? (
                "Offline - Não é possível alterar"
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Alterar Senha
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}