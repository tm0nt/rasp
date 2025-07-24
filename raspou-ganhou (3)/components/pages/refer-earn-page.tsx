"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PageLayout } from "@/components/layout/page-layout"
import { Share, Copy, Users2 } from "lucide-react"

interface ReferEarnPageProps {
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
 * Refer and Earn page component
 */
export function ReferEarnPage({ onBack, user, onLogout, onNavigate }: ReferEarnPageProps) {
  const [referralLink] = useState("https://raspadinhadasorte.site/ref/tassio-montenegro")
  const [userCode] = useState("tassio-montenegro")

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink)
  }

  const handleShareLink = () => {
    if (navigator.share) {
      navigator.share({
        title: "Raspou Ganhou - Convite",
        text: "Venha se divertir comigo no Raspou Ganhou!",
        url: referralLink,
      })
    }
  }

  return (
    <PageLayout
      title="Indique e Ganhe"
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
          className="absolute top-60 right-8 w-2 h-2 bg-purple-400/20 rounded-full animate-float"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Card de saldo disponível para saque */}
        <div className="col-span-12">
          <Card className="bg-gradient-to-r from-purple-900/50 to-purple-800/30 border-2 border-purple-500/30 backdrop-blur-sm hover:border-purple-500/50 transition-all duration-500">
            <CardContent className="p-4 text-center">
              <p className="text-purple-300 text-sm font-medium">Disponível para saque</p>
            </CardContent>
          </Card>
        </div>

        {/* Seu Link de Indicação */}
        <div className="col-span-12">
          <Card className="bg-black border-2 border-white/20 backdrop-blur-sm hover:border-white/40 transition-all duration-500">
            <CardContent className="p-6 relative">
              {/* Elementos flutuantes internos */}
              <div
                className="absolute top-4 right-4 w-1 h-1 bg-green-400/40 rounded-full animate-pulse"
                style={{ animationDelay: "1s" }}
              />

              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                  <Share className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white text-lg font-bold">Seu Link de Indicação</h3>
                  <p className="text-gray-400 text-sm">
                    Compartilhe este link com seus amigos para que eles se cadastrem
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mb-6">
                <div className="flex-1 relative group">
                  <Input
                    value={referralLink}
                    readOnly
                    className="bg-transparent border-2 border-white/20 hover:border-white/40 text-white h-14 text-sm px-4 rounded-xl focus:border-green-400 transition-all duration-300"
                  />
                </div>
              </div>

              <div className="flex gap-3 mb-6">
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  className="flex-1 border-2 border-white/20 bg-transparent text-gray-300 hover:text-white hover:bg-white/5 hover:border-white/40 py-3 h-12 rounded-xl transition-all duration-300"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar
                </Button>
                <Button
                  onClick={handleShareLink}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 h-12 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25"
                >
                  <Share className="w-4 h-4 mr-2" />
                  Compartilhar
                </Button>
              </div>

              <div className="text-center bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-gray-400 text-sm">
                  Seu código: <span className="text-white font-mono bg-white/10 px-2 py-1 rounded-md">{userCode}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Convide Amigos */}
        <div className="col-span-12">
          <Card className="bg-black border-2 border-white/20 backdrop-blur-sm hover:border-white/40 transition-all duration-500">
            <CardContent className="p-12 text-center relative">
              {/* Elementos flutuantes internos */}
              <div
                className="absolute top-8 left-8 w-1 h-1 bg-blue-400/30 rounded-full animate-pulse"
                style={{ animationDelay: "2s" }}
              />

              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-600/10 border-2 border-blue-500/30 flex items-center justify-center mx-auto mb-6 shadow-lg backdrop-blur-sm">
                <Users2 className="w-10 h-10 text-blue-400" />
              </div>

              <h3 className="text-xl font-bold text-blue-400 mb-3">Convide Amigos</h3>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  )
}
