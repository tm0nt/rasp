"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { PageLayout } from "@/components/layout/page-layout"

interface SettingsPageProps {
  user: {
    id: string
    name: string
    email: string
    phone: string
    avatar?: string
    balance: number
  }
  onBack: () => void
  onLogout: () => void
  onNavigate: (page: string) => void
}

/**
 * Settings page component for managing user preferences
 */
export function SettingsPage({ user, onBack, onLogout, onNavigate }: SettingsPageProps) {
  const [activeSection, setActiveSection] = useState("perfil")
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
  })
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const sections = [
    { id: "perfil", label: "Perfil" },
    { id: "senha", label: "Senha" },
    { id: "aparencia", label: "Aparência" },
  ]

  const handleSave = () => {
    console.log("Saving settings:", formData)
  }

  return (
    <PageLayout
      title="Configurações"
      subtitle="Gerencie suas configurações de perfil e conta"
      showBackButton
      onBack={onBack}
      user={user}
      onLogout={onLogout}
      onNavigate={onNavigate}
    >
      {/* Elementos flutuantes animados */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-32 left-4 w-1 h-1 bg-green-400/30 rounded-full animate-float"
          style={{ animationDelay: "0s" }}
        />
        <div
          className="absolute top-60 right-8 w-2 h-2 bg-blue-400/20 rounded-full animate-float"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Mobile: Sidebar ocupa toda a largura, depois o conteúdo */}
        <div className="col-span-12 md:col-span-4">
          <Card className="bg-black border-2 border-white/20 backdrop-blur-sm hover:border-white/40 transition-all duration-500">
            <CardContent className="p-4">
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`
                      w-full text-left px-4 py-3 rounded-xl transition-all duration-300 font-medium
                      ${
                        activeSection === section.id
                          ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25"
                          : "text-gray-400 hover:text-white hover:bg-white/5 border-2 border-transparent hover:border-white/20"
                      }
                    `}
                  >
                    {section.label}
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="col-span-12 md:col-span-8">
          <Card className="bg-black border-2 border-white/20 backdrop-blur-sm hover:border-white/40 transition-all duration-500">
            <CardContent className="p-6 relative">
              {/* Elementos flutuantes internos */}
              <div
                className="absolute top-4 right-4 w-1 h-1 bg-green-400/40 rounded-full animate-pulse"
                style={{ animationDelay: "1s" }}
              />

              {activeSection === "perfil" && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Informações do perfil</h2>
                  <p className="text-gray-400 text-sm mb-6">Atualize seu nome e endereço de email</p>

                  <div className="space-y-6">
                    <div className="relative group">
                      <label className="block text-white text-sm font-medium mb-3">Nome</label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        onFocus={() => setFocusedField("name")}
                        onBlur={() => setFocusedField(null)}
                        className={`
                          bg-transparent border-2 text-white placeholder-gray-400 
                          py-4 h-14 text-base px-4
                          transition-all duration-300 ease-out
                          border-white/20 hover:border-white/40
                          focus:border-green-400 focus:shadow-lg focus:shadow-green-400/20
                          focus:bg-green-400/5
                          group-hover:bg-white/5
                          rounded-xl
                          ${focusedField === "name" ? "ring-2 ring-green-400/30" : ""}
                        `}
                      />
                      {focusedField === "name" && (
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-400/20 via-transparent to-green-400/20 animate-pulse pointer-events-none" />
                      )}
                    </div>

                    <div className="relative group">
                      <label className="block text-white text-sm font-medium mb-3">Endereço de email</label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        onFocus={() => setFocusedField("email")}
                        onBlur={() => setFocusedField(null)}
                        className={`
                          bg-transparent border-2 text-white placeholder-gray-400 
                          py-4 h-14 text-base px-4
                          transition-all duration-300 ease-out
                          border-white/20 hover:border-white/40
                          focus:border-green-400 focus:shadow-lg focus:shadow-green-400/20
                          focus:bg-green-400/5
                          group-hover:bg-white/5
                          rounded-xl
                          ${focusedField === "email" ? "ring-2 ring-green-400/30" : ""}
                        `}
                      />
                      {focusedField === "email" && (
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-400/20 via-transparent to-green-400/20 animate-pulse pointer-events-none" />
                      )}
                    </div>

                    <Button
                      onClick={handleSave}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3 h-12 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Salvar
                    </Button>
                  </div>
                </div>
              )}

              {activeSection === "senha" && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Alterar Senha</h2>
                  <p className="text-gray-400 text-sm mb-6">Mantenha sua conta segura com uma senha forte</p>

                  <div className="space-y-6">
                    <div className="relative group">
                      <label className="block text-white text-sm font-medium mb-3">Senha Atual</label>
                      <Input
                        type="password"
                        onFocus={() => setFocusedField("currentPassword")}
                        onBlur={() => setFocusedField(null)}
                        className={`
                          bg-transparent border-2 text-white placeholder-gray-400 
                          py-4 h-14 text-base px-4
                          transition-all duration-300 ease-out
                          border-white/20 hover:border-white/40
                          focus:border-green-400 focus:shadow-lg focus:shadow-green-400/20
                          focus:bg-green-400/5
                          group-hover:bg-white/5
                          rounded-xl
                          ${focusedField === "currentPassword" ? "ring-2 ring-green-400/30" : ""}
                        `}
                      />
                    </div>

                    <div className="relative group">
                      <label className="block text-white text-sm font-medium mb-3">Nova Senha</label>
                      <Input
                        type="password"
                        onFocus={() => setFocusedField("newPassword")}
                        onBlur={() => setFocusedField(null)}
                        className={`
                          bg-transparent border-2 text-white placeholder-gray-400 
                          py-4 h-14 text-base px-4
                          transition-all duration-300 ease-out
                          border-white/20 hover:border-white/40
                          focus:border-green-400 focus:shadow-lg focus:shadow-green-400/20
                          focus:bg-green-400/5
                          group-hover:bg-white/5
                          rounded-xl
                          ${focusedField === "newPassword" ? "ring-2 ring-green-400/30" : ""}
                        `}
                      />
                    </div>

                    <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3 h-12 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25 hover:scale-[1.02] active:scale-[0.98]">
                      Alterar Senha
                    </Button>
                  </div>
                </div>
              )}

              {activeSection === "aparencia" && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Aparência</h2>
                  <p className="text-gray-400 text-sm mb-6">Personalize a aparência da sua conta</p>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-white text-sm font-medium mb-4">Tema</label>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-white/20 hover:border-white/40 hover:bg-white/5 transition-all duration-300 cursor-pointer">
                          <input
                            type="radio"
                            name="theme"
                            value="dark"
                            defaultChecked
                            className="w-4 h-4 text-green-500 focus:ring-green-500 focus:ring-2"
                          />
                          <span className="text-gray-300">Escuro</span>
                        </label>
                      </div>
                    </div>

                    <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3 h-12 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25 hover:scale-[1.02] active:scale-[0.98]">
                      Salvar Preferências
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  )
}
