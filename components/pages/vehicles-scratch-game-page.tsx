"use client"

import { useState, useEffect } from "react"
import { PageLayout } from "@/components/layout/page-layout"
import { ScratchOffGame } from "@/components/game/scratch-off-game"

interface VehiclesScratchGamePageProps {
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

export function VehiclesScratchGamePage({
  rtp,
  onBack,
  user,
  onLogout,
  onNavigate,
  categoryId,
}: VehiclesScratchGamePageProps) {
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

  const vehiclesPrizes = [
    { id: "1", name: "Honda CG 160 Start", value: "R$ 12.000,00", image: "/images/vehicles/honda-cg-160.webp" },
    { id: "2", name: "Honda Pop 110i", value: "R$ 8.500,00", image: "/images/vehicles/honda-pop-110i.webp" },
    { id: "3", name: "Bicicleta Colli", value: "R$ 1.500,00", image: "/images/vehicles/bicycle.webp" },
    { id: "4", name: "Patinete Elétrico", value: "R$ 1.200,00", image: "/images/vehicles/electric-scooter.webp" },
    { id: "5", name: "Hoverboard HYB", value: "R$ 800,00", image: "/images/vehicles/hoverboard.webp" },
    { id: "6", name: "Jaqueta Motociclista", value: "R$ 450,00", image: "/images/vehicles/motorcycle-jacket.webp" },
    { id: "7", name: "Capacete Moto", value: "R$ 350,00", image: "/images/vehicles/motorcycle-helmet.webp" },
    { id: "8", name: "Patins Inline", value: "R$ 280,00", image: "/images/vehicles/inline-skates.webp" },
    { id: "9", name: "Suporte Veicular", value: "R$ 80,00", image: "/images/vehicles/car-phone-holder.webp" },
    { id: "10", name: "Odorizante Magnil", value: "R$ 45,00", image: "/images/vehicles/car-air-freshener.webp" },
  ]

  const generateGameResult = () => {
    const isWinner = Math.random() < parseFloat(rtp) / 100
    if (isWinner) {
      const winningProbabilities = [
        { prize: vehiclesPrizes[9], weight: 30 },
        { prize: vehiclesPrizes[8], weight: 25 },
        { prize: vehiclesPrizes[7], weight: 15 },
        { prize: vehiclesPrizes[6], weight: 10 },
        { prize: vehiclesPrizes[5], weight: 8 },
        { prize: vehiclesPrizes[4], weight: 5 },
        { prize: vehiclesPrizes[3], weight: 3 },
        { prize: vehiclesPrizes[2], weight: 2 },
        { prize: vehiclesPrizes[1], weight: 1.5 },
        { prize: vehiclesPrizes[0], weight: 0.5 },
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
      const amount = parseFloat(prize.value.replace("R$", "").replace(/\./g, "").replace(",", "."))
      try {
        // Credit prize to user balance
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
          
          // Update the bet result in the database
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
      // Update the bet result as lost
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
    if (balance < 5.0) {
      onNavigate("deposit")
      return
    }

    try {
      const res = await fetch("/api/games/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          amount: 5.0
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setBalance(prev => prev - 5.0)
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
      title="Super Prêmios 🏍️"
      subtitle="Cansado de ficar a pé? Essa é sua chance!"
      showBackButton
      onBack={onBack}
      user={{ ...user, balance }}
      onLogout={onLogout}
      onNavigate={onNavigate}
    >
      <div className="max-w-2xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="w-16 h-16 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ScratchOffGame
              key={gameKey}
              prizes={vehiclesPrizes}
              winningPrize={currentWinningPrize}
              onGameComplete={handleGameComplete}
              onPlayAgain={handlePlayAgain}
              gamePrice={5.0}
              className="w-full"
            />

            <div className="mt-6 bg-black border-2 border-white/20 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <img src="/images/vehicles.png" alt="Super Prêmios" className="w-16 h-16 object-contain" />
                <div>
                  <h3 className="text-white font-bold text-lg">Super Prêmios 🏍️</h3>
                  <p className="text-gray-400 text-sm">
                    Cansado de ficar a pé? Essa sua chance de sair motorizado, prêmios de até R$12.000! 🏍️🚲⚡
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