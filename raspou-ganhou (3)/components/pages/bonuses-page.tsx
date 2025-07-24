"use client"

import { useState } from "react"
import { PageLayout } from "@/components/layout/page-layout"
import { Gift, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface BonusesPageProps {
  onBack: () => void
  user: {
    id: string
    name: string
    email: string
    phone: string
    avatar?: string
    balance: number
  }
  onLogout: () => void
  onNavigate: (page: string) => void
}

/**
 * Bonuses page component for managing user bonuses
 */
export function BonusesPage({ onBack, user, onLogout, onNavigate }: BonusesPageProps) {
  const [activeTab, setActiveTab] = useState("disponiveis")

  const tabs = [
    {
      id: "disponiveis",
      label: "Disponíveis",
      icon: Clock,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
    },
    {
      id: "pendentes",
      label: "Pendentes",
      icon: AlertCircle,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/30",
    },
    {
      id: "resgatados",
      label: "Resgatados",
      icon: CheckCircle,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
    },
  ]

  const activeTabData = tabs.find((tab) => tab.id === activeTab)

  return (
    <PageLayout
      title="Meus Bonus"
      subtitle="Gerencie seus bonus disponíveis e resgatados"
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
        {/* Enhanced Tabs */}
        <div className="col-span-12">
          <Card className="bg-black border-2 border-white/20 backdrop-blur-sm hover:border-white/40 transition-all duration-500">
            <CardContent className="p-4">
              <div className="flex gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 flex-1 py-3 px-4 text-sm font-medium rounded-lg
                      transition-all duration-300 relative group
                      ${
                        activeTab === tab.id
                          ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25"
                          : "text-gray-400 hover:text-gray-200 hover:bg-white/5 border-2 border-transparent hover:border-white/20"
                      }
                    `}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Empty State */}
        <div className="col-span-12">
          <Card className="bg-black border-2 border-white/20 backdrop-blur-sm hover:border-white/40 transition-all duration-500">
            <CardContent className="p-12 text-center relative">
              {/* Elementos flutuantes internos */}
              <div
                className="absolute top-8 left-8 w-1 h-1 bg-green-400/30 rounded-full animate-pulse"
                style={{ animationDelay: "1s" }}
              />
              <div
                className="absolute bottom-8 right-12 w-2 h-2 bg-blue-400/20 rounded-full animate-bounce"
                style={{ animationDelay: "2s" }}
              />

              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-600/10 border-2 border-green-500/30 flex items-center justify-center mx-auto mb-6 shadow-lg backdrop-blur-sm">
                <Gift className="w-10 h-10 text-green-400" />
              </div>

              <h3 className="text-xl font-bold text-green-400 mb-3">Nenhum bonus disponível</h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Você não possui bonus disponíveis para resgate no momento. Continue jogando para ganhar mais
                recompensas!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  )
}
