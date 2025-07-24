"use client"

import { useState, useEffect } from "react"
import { PageLayout } from "@/components/layout/page-layout"
import { ScratchOffGame } from "@/components/game/scratch-off-game"

interface CosmeticsScratchGamePageProps {
  rtp: string
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
  categoryId: number
}

export function CosmeticsScratchGamePage({
  rtp,
  onBack,
  user,
  onLogout,
  onNavigate,
  categoryId,
}: CosmeticsScratchGamePageProps) {
  const [gameKey, setGameKey] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [balance, setBalance] = useState(user.balance)
  const [currentWinningPrize, setCurrentWinningPrize] = useState<any>(null)
  const [purchaseId, setPurchaseId] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  const cosmeticsPrizes = [
    { id: "1", name: "Perfume Dior", value: "R$ 800,00", image: "/images/cosmetics/dior-perfume.webp" },
    { id: "2", name: "Kit Kérastase", value: "R$ 450,00", image: "/images/cosmetics/kerastase-kit.webp" },
    { id: "3", name: "Kit Maquiagem", value: "R$ 350,00", image: "/images/cosmetics/makeup-kit.webp" },
    { id: "4", name: "Escova Alisadora", value: "R$ 280,00", image: "/images/cosmetics/hair-straightener.webp" },
    { id: "5", name: "Caixa de Beleza", value: "R$ 200,00", image: "/images/cosmetics/beauty-box.webp" },
    { id: "6", name: "Bolsa Hobo", value: "R$ 150,00", image: "/images/cosmetics/hobo-bag.webp" },
    { id: "7", name: "Body Splash Kit", value: "R$ 120,00", image: "/images/cosmetics/body-splash.webp" },
    { id: "8", name: "Voucher SHEIN", value: "R$ 100,00", image: "/images/cosmetics/shein-vouchers.webp" },
    { id: "9", name: "Máscara Facial", value: "R$ 50,00", image: "/images/cosmetics/black-mask.webp" },
    { id: "10", name: "Cabo USB-C", value: "R$ 25,00", image: "/images/cosmetics/usb-cable.webp" },
  ]

  const generateGameResult = () => {
    const isWinner = Math.random() < parseFloat(rtp) / 100
    if (isWinner) {
      const winningProbabilities = [
        { prize: cosmeticsPrizes[9], weight: 35 },
        { prize: cosmeticsPrizes[8], weight: 25 },
        { prize: cosmeticsPrizes[7], weight: 15 },
        { prize: cosmeticsPrizes[6], weight: 10 },
        { prize: cosmeticsPrizes[5], weight: 6 },
        { prize: cosmeticsPrizes[4], weight: 4 },
        { prize: cosmeticsPrizes[3], weight: 2.5 },
        { prize: cosmeticsPrizes[2], weight: 1.5 },
        { prize: cosmeticsPrizes[1], weight: 0.8 },
        { prize: cosmeticsPrizes[0], weight: 0.2 },
      ]
      const totalWeight = winningProbabilities.reduce((sum, item) => sum + item.weight, 0)
      let random = Math.random() * totalWeight
      for (const item of winningProbabilities) {
        random -= item.weight
        if (random <= 0) return item.prize
      }
    }
    return null
  }

  useEffect(() => {
    setCurrentWinningPrize(generateGameResult())
  }, [gameKey])

  const handleGameComplete = async (isWinner: boolean, prize?: any) => {
    if (isWinner && prize && purchaseId) {
      console.log("Jogador ganhou:", prize)
      const amount = parseFloat(prize.value.replace("R$","").trim().replace(/\./g, "").replace(",", "."))
      try {
        const res = await fetch("/api/games", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "win",
            prizeValue: prize.value
          }),
        })
        
        if (res.ok) {
          const data = await res.json()
          setBalance(prev => prev + amount)
          
          await fetch("/api/games/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              betId: purchaseId,
              result: "won",
              prizeId: prize.id,
              prizeAmount: amount
            }),
          })
        } else {
          console.error("Erro ao registrar prêmio na API")
        }
      } catch (err) {
        console.error("Erro na requisição /api/games", err)
      }
    } else if (purchaseId) {
      try {
        await fetch("/api/games/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            betId: purchaseId,
            result: "lost"
          }),
        })
      } catch (err) {
        console.error("Erro ao atualizar aposta como perdida", err)
      }
      console.log("Jogador não ganhou desta vez")
    }
  }

  const handlePlayAgain = async () => {
    if (balance < 2.5) {
      onNavigate("deposit")
      return
    }

    try {
      const res = await fetch("/api/games/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          amount: 2.5
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setBalance(prev => prev - 2.5)
        setPurchaseId(data.purchaseId)
        setGameKey(prev => prev + 1)
      } else {
        const error = await res.json()
        console.error("Erro ao debitar saldo:", error.error)
        if (error.error === 'Saldo insuficiente') {
          onNavigate("deposit")
        }
      }
    } catch (err) {
      console.error("Erro ao conectar com /api/games/purchase", err)
    }
  }

  return (
    <PageLayout
      title="Me mimei"
      subtitle="Raspe e ganhe produtos de beleza incríveis!"
      showBackButton
      onBack={onBack}
      user={{ ...user, balance }}
      onLogout={onLogout}
      onNavigate={onNavigate}
    >
      <div className="max-w-2xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="w-16 h-16 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ScratchOffGame
              key={gameKey}
              prizes={cosmeticsPrizes}
              winningPrize={currentWinningPrize}
              onGameComplete={handleGameComplete}
              onPlayAgain={handlePlayAgain}
              gamePrice={2.5}
              className="w-full"
            />

            <div className="mt-6 bg-black border-2 border-white/20 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <img src="/images/luxury-items.png" alt="Me mimei" className="w-16 h-16 object-contain" />
                <div>
                  <h3 className="text-white font-bold text-lg">Me mimei</h3>
                  <p className="text-gray-400 text-sm">
                    Shopee, Shein, presentinhos... Quer se mimar mas tá caro? Não se preocupe, é só dar sorte aqui! 💄✨
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  )
}