"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PageLayout } from "@/components/layout/page-layout"
import { Share, Copy, Users2, Check, DollarSign, TrendingUp, Wallet, Zap, Activity, Gift } from "lucide-react"
import { useToast } from "@/contexts/toast-context"

interface ReferEarnPageProps {
  onBack: () => void
  user: {
    id: string
    name: string
    email: string
    phone: string
    avatar?: string
    referralEarnings: number
    referralCode?: string
    affiliateStats?: {
      totalReferrals: number
      activeReferrals: number
      totalVolume: number
      pendingBonuses: {
        count: number
        amount: number
      }
    }
    affiliateSettings?: {
      min_deposit: number
      cpa_value: number
      referral_bonus: number
    }
    referredBy?: {
      name: string
      email: string
      phone: string
    } | null
  }
  onLogout: () => void
  onNavigate: (page: string) => void
}

export function ReferEarnPage({ onBack, user, onLogout, onNavigate }: ReferEarnPageProps) {
  const [isCopied, setIsCopied] = useState(false)
  const [referralLink, setReferralLink] = useState("")
  const { showToast } = useToast()

  // Set default values if not provided
  const affiliateSettings = user.affiliateSettings || {
    min_deposit: 20,
    cpa_value: 10,
    referral_bonus: 5
  }

  const affiliateStats = user.affiliateStats || {
    activeReferrals: 0,
    totalVolume: 0,
    pendingBonuses: {
      count: 0,
      amount: 0
    }
  }

  useEffect(() => {
    if (user.referralCode) {
      const currentOrigin = typeof window !== "undefined" ? window.location.origin : ""
      const link = `${currentOrigin}/?code=${user.referralCode}`
      setReferralLink(link)
    }
  }, [user.referralCode])

  const handleCopyLink = async () => {
    if (!referralLink) return
    
    try {
      await navigator.clipboard.writeText(referralLink)
      setIsCopied(true)
      showToast({
        type: "success",
        title: "Link copiado!",
        message: "O link de indicação foi copiado para sua área de transferência.",
        duration: 3000,
      })
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      showToast({
        type: "error",
        title: "Erro ao copiar",
        message: "Não foi possível copiar o link. Tente novamente.",
        duration: 3000,
      })
    }
  }

  const handleShareLink = async () => {
    if (!referralLink) return
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Raspou Ganhou - Convite",
          text: `Venha se divertir comigo no Raspou Ganhou! Use meu código ${user.referralCode} ao se cadastrar.`,
          url: referralLink,
        })
      } else {
        await navigator.clipboard.writeText(referralLink)
        showToast({
          type: "info",
          title: "Link copiado",
          message: "O link foi copiado pois seu navegador não suporta compartilhamento direto.",
          duration: 3000,
        })
      }
    } catch (error) {
      console.error("Error sharing:", error)
      if (error instanceof Error && error.name !== 'AbortError') {
        showToast({
          type: "error",
          title: "Erro ao compartilhar",
          message: "Não foi possível compartilhar o link. Tente novamente.",
          duration: 3000,
        })
      }
    }
  }

  const formatCurrency = (value: number) => {
    return value.toFixed(2).replace(".", ",")
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
      {/* Floating animated elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-green-400/30 rounded-full animate-float"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${i}s`,
            }}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Stats Cards Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Available Balance Card */}
          <Card className="bg-gradient-to-r from-purple-900/50 to-purple-800/30 border-2 border-purple-500/30 backdrop-blur-sm hover:border-purple-500/50 transition-all duration-500">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center mx-auto mb-2">
                <Wallet className="w-4 h-4 text-purple-300" />
              </div>
              <p className="text-purple-300 text-xs font-medium mb-1">Ganhos Disponíveis</p>
              <p className="text-white text-lg font-bold">R$ {formatCurrency(user.referralEarnings)}</p>
            </CardContent>
          </Card>

          {/* Total Referrals Card */}
          <Card className="bg-gradient-to-r from-blue-900/50 to-blue-800/30 border-2 border-blue-500/30 backdrop-blur-sm hover:border-blue-500/50 transition-all duration-500">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center mx-auto mb-2">
                <Users2 className="w-4 h-4 text-blue-300" />
              </div>
              <p className="text-blue-300 text-xs font-medium mb-1">Total de Indicações</p>
              <p className="text-white text-lg font-bold">{user.affiliateStats.totalReferrals}</p>
            </CardContent>
          </Card>
        </div>

        {/* Second Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          {/* Active Referrals Card */}
          <Card className="bg-gradient-to-r from-green-900/50 to-emerald-800/30 border-2 border-green-500/30 backdrop-blur-sm hover:border-green-500/50 transition-all duration-500">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center mx-auto mb-2">
                <Activity className="w-4 h-4 text-green-300" />
              </div>
              <p className="text-green-300 text-xs font-medium mb-1">Ativas</p>
              <p className="text-white text-lg font-bold">{affiliateStats.activeReferrals}</p>
            </CardContent>
          </Card>

          {/* Total Volume Card */}
          <Card className="bg-gradient-to-r from-amber-900/50 to-yellow-800/30 border-2 border-amber-500/30 backdrop-blur-sm hover:border-amber-500/50 transition-all duration-500">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-4 h-4 text-amber-300" />
              </div>
              <p className="text-amber-300 text-xs font-medium mb-1">Volume Total</p>
              <p className="text-white text-lg font-bold">R$ {formatCurrency(affiliateStats.totalVolume)}</p>
            </CardContent>
          </Card>

          {/* Pending Bonuses Card */}
          <Card className="bg-gradient-to-r from-pink-900/50 to-rose-800/30 border-2 border-pink-500/30 backdrop-blur-sm hover:border-pink-500/50 transition-all duration-500">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center mx-auto mb-2">
                <Gift className="w-4 h-4 text-pink-300" />
              </div>
              <p className="text-pink-300 text-xs font-medium mb-1">Bônus Pendentes</p>
              <p className="text-white text-lg font-bold">{affiliateStats.pendingBonuses.count}</p>
            </CardContent>
          </Card>
        </div>

        {/* CPA Info Cards Row */}
        <div className="grid grid-cols-3 gap-3">
          {/* CPA Value Card */}
          <Card className="bg-gradient-to-r from-green-900/50 to-emerald-800/30 border-2 border-green-500/30 backdrop-blur-sm hover:border-green-500/50 transition-all duration-500">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center mx-auto mb-2">
                <DollarSign className="w-4 h-4 text-green-300" />
              </div>
              <p className="text-green-300 text-xs font-medium mb-1">Valor CPA</p>
              <p className="text-white text-lg font-bold">R$ {formatCurrency(affiliateSettings.cpa_value)}</p>
            </CardContent>
          </Card>

          {/* Min Deposit Card */}
          <Card className="bg-gradient-to-r from-orange-900/50 to-amber-800/30 border-2 border-orange-500/30 backdrop-blur-sm hover:border-orange-500/50 transition-all duration-500">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-4 h-4 text-orange-300" />
              </div>
              <p className="text-orange-300 text-xs font-medium mb-1">Depósito Min.</p>
              <p className="text-white text-lg font-bold">R$ {formatCurrency(affiliateSettings.min_deposit)}</p>
            </CardContent>
          </Card>

          {/* Referral Bonus Card */}
          <Card className="bg-gradient-to-r from-blue-900/50 to-indigo-800/30 border-2 border-blue-500/30 backdrop-blur-sm hover:border-blue-500/50 transition-all duration-500">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center mx-auto mb-2">
                <Zap className="w-4 h-4 text-blue-300" />
              </div>
              <p className="text-blue-300 text-xs font-medium mb-1">Bônus por Indicação</p>
              <p className="text-white text-lg font-bold">R$ {formatCurrency(affiliateSettings.referral_bonus)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Referral Link Card */}
        <Card className="bg-black/80 border-2 border-white/20 backdrop-blur-sm hover:border-white/40 transition-all duration-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <Share className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white text-lg font-bold">Seu Link de Indicação</h3>
                <p className="text-gray-400 text-sm">
                  Compartilhe este link e ganhe bônus quando seus amigos se cadastrarem
                </p>
              </div>
            </div>

            <div className="relative mb-6 group">
              <Input
                value={referralLink}
                readOnly
                className="bg-black/50 border-2 border-white/20 hover:border-white/40 text-white h-14 text-sm px-4 pr-12 rounded-xl transition-all duration-300"
                placeholder={user.referralCode ? "" : "Gerando link..."}
              />
              {user.referralCode && (
                <button
                  onClick={handleCopyLink}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-white transition-colors"
                >
                  {isCopied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                </button>
              )}
            </div>

            <div className="flex gap-3 mb-6">
              <Button
                onClick={handleCopyLink}
                variant="outline"
                disabled={!user.referralCode}
                className="flex-1 border-2 border-white/20 bg-transparent text-gray-300 hover:text-white hover:bg-white/5 hover:border-white/40 py-3 h-12 rounded-xl transition-all duration-300"
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar
                  </>
                )}
              </Button>
              <Button
                onClick={handleShareLink}
                disabled={!user.referralCode}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 h-12 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25"
              >
                <Share className="w-4 h-4 mr-2" />
                Compartilhar
              </Button>
            </div>

            {user.referralCode && (
              <div className="text-center bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-1">Seu código de indicação</p>
                <p className="text-white font-mono text-lg font-bold">{user.referralCode}</p>
              </div>
            )}

            {/* Show referrer info if available */}
            {user.referredBy && (
              <div className="text-center bg-white/5 border border-white/10 rounded-xl p-4 mt-4">
                <p className="text-gray-400 text-sm mb-1">Você foi indicado por</p>
                <p className="text-white text-lg font-bold">{user.referredBy.name}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* How it Works Card */}
        <Card className="bg-black/80 border-2 border-white/20 backdrop-blur-sm hover:border-white/40 transition-all duration-500">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-600/10 border-2 border-blue-500/30 flex items-center justify-center mx-auto mb-6 shadow-lg backdrop-blur-sm">
              <Users2 className="w-10 h-10 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-blue-400 mb-3">Como funciona?</h3>
            <div className="text-gray-300 text-sm space-y-3 text-left">
              <p>1. Compartilhe seu link único com amigos</p>
              <p>2. Eles se cadastram usando seu link</p>
              <p>
                3. Quando fazem um depósito de R$ {formatCurrency(affiliateSettings.min_deposit)}, você ganha R${" "}
                {formatCurrency(affiliateSettings.cpa_value)}
              </p>
              <p>4. Você também ganha R$ {formatCurrency(affiliateSettings.referral_bonus)} por cada indicação ativa</p>
              <p>5. Eles ganham um bônus de boas-vindas!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}