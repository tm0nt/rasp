"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PageLayout } from "@/components/layout/page-layout"
import { ShoppingCart, Sparkles } from "lucide-react"

interface CartPageProps {
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
 * Página do carrinho de compras
 */
export function CartPage({ onBack, user, onLogout, onNavigate }: CartPageProps) {
  // Estado vazio para demonstração
  const [cartItems] = useState([])

  return (
    <PageLayout
      title="Meu Carrinho"
      subtitle="Gerencie seus prêmios ganhos"
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
        <div
          className="absolute bottom-80 left-1/3 w-1.5 h-1.5 bg-purple-400/25 rounded-full animate-float"
          style={{ animationDelay: "4s" }}
        />
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Empty State - Seguindo exatamente o design da imagem */}
        <div className="col-span-12">
          <Card className="bg-black border-2 border-white/20 backdrop-blur-sm hover:border-white/40 transition-all duration-500">
            <CardContent className="p-16 text-center relative">
              {/* Elementos flutuantes internos */}
              <div
                className="absolute top-8 left-8 w-1 h-1 bg-green-400/30 rounded-full animate-pulse"
                style={{ animationDelay: "1s" }}
              />
              <div
                className="absolute bottom-8 right-12 w-2 h-2 bg-blue-400/20 rounded-full animate-bounce"
                style={{ animationDelay: "2s" }}
              />

              {/* Ícone do carrinho - grande e centralizado */}
              <div className="w-24 h-24 mx-auto mb-8 text-gray-400 relative">
                <ShoppingCart className="w-full h-full" strokeWidth={1} />
                <Sparkles className="w-6 h-6 text-green-400/70 absolute -top-2 -right-2 animate-bounce" />
              </div>

              {/* Título principal */}
              <h3 className="text-2xl font-bold text-white mb-4">Carrinho Vazio</h3>

              {/* Subtítulo */}
              <p className="text-gray-400 mb-8 text-lg leading-relaxed">Você ainda não possui prêmios ganhos.</p>

              {/* Botão de ação - verde como na imagem */}
              <Button
                onClick={() => onNavigate("home")}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25 hover:scale-[1.02] active:scale-[0.98] text-lg font-medium"
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
