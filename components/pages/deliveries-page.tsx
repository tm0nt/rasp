"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PageLayout } from "@/components/layout/page-layout"
import { Package, Filter, Truck } from "lucide-react"

interface DeliveriesPageProps {
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
 * Deliveries page component for tracking delivery status
 */
export function DeliveriesPage({ onBack, user, onLogout, onNavigate }: DeliveriesPageProps) {
  const [filterStatus, setFilterStatus] = useState("todos")

  return (
    <PageLayout
      title="Minhas Entregas"
      subtitle="Acompanhe o status das suas solicitações de entrega"
      showBackButton
      onBack={onBack}
      user={user}
      onLogout={onLogout}
      onNavigate={onNavigate}
    >
      {/* Elementos flutuantes animados */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-32 left-4 w-1 h-1 bg-blue-400/30 rounded-full animate-float"
          style={{ animationDelay: "0s" }}
        />
        <div
          className="absolute top-60 right-8 w-2 h-2 bg-green-400/20 rounded-full animate-float"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute bottom-80 left-1/3 w-1.5 h-1.5 bg-purple-400/25 rounded-full animate-float"
          style={{ animationDelay: "4s" }}
        />
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Filter Section - Mobile First */}
        <div className="col-span-12">
          <Card className="bg-black border-2 border-white/20 backdrop-blur-sm hover:border-white/40 transition-all duration-500">
            <CardContent className="p-6 relative">
              {/* Elementos flutuantes internos */}
              <div className="absolute top-2 right-2 w-1 h-1 bg-blue-400/40 rounded-full animate-pulse" />

              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
                  <Filter className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white text-lg font-bold">Filtrar por Status</h3>
                  <p className="text-gray-400 text-sm">Encontre suas entregas rapidamente</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full bg-transparent border-2 border-white/20 hover:border-white/40 focus:border-green-400 text-white rounded-xl px-4 py-3 text-sm focus:outline-none transition-all duration-300 appearance-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' strokeLinecap='round' strokeLinejoin='round' strokeWidth='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: "right 0.5rem center",
                      backgroundRepeat: "no-repeat",
                      backgroundSize: "1.5em 1.5em",
                      paddingRight: "2.5rem",
                    }}
                  >
                    <option value="todos" className="bg-black text-white">
                      Todos
                    </option>
                    <option value="pendente" className="bg-black text-white">
                      Pendente
                    </option>
                    <option value="enviado" className="bg-black text-white">
                      Enviado
                    </option>
                    <option value="entregue" className="bg-black text-white">
                      Entregue
                    </option>
                  </select>
                </div>
                <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25 hover:scale-[1.02] active:scale-[0.98]">
                  Filtrar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Empty State */}
        <div className="col-span-12">
          <Card className="bg-black border-2 border-white/20 backdrop-blur-sm hover:border-white/40 transition-all duration-500">
            <CardContent className="p-12 text-center relative">
              {/* Elementos flutuantes internos */}
              <div
                className="absolute top-8 left-8 w-1 h-1 bg-blue-400/30 rounded-full animate-pulse"
                style={{ animationDelay: "1s" }}
              />
              <div
                className="absolute bottom-8 right-12 w-2 h-2 bg-green-400/20 rounded-full animate-bounce"
                style={{ animationDelay: "2s" }}
              />

              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-600/10 border-2 border-blue-500/30 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg backdrop-blur-sm relative">
                <Package className="w-10 h-10 text-blue-400" />
                <Truck className="w-5 h-5 text-blue-400/70 absolute -top-1 -right-1 animate-bounce" />
              </div>

              <h3 className="text-xl font-bold text-blue-400 mb-3">Nenhuma entrega encontrada</h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Você ainda não possui solicitações de entrega. Ganhe prêmios nas raspadinhas para solicitar entregas
                incríveis!
              </p>

              <Button
                onClick={() => onNavigate("home")}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25 hover:scale-[1.02] active:scale-[0.98]"
              >
                Jogar Raspadinhas
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  )
}
