"use client"

import { useState, useEffect } from "react"
import { PageLayout } from "@/components/layout/page-layout"
import { ScratchOffGame } from "@/components/game/scratch-off-game"

interface ScratchGamePageProps {
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

export function ScratchGamePage({ onBack, user, onLogout, onNavigate, categoryId, rtp }: ScratchGamePageProps) {
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

  const prizes = [
    { id: "1", name: "2 Mil Reais", value: "R$ 2000,00", image: "/images/money-2000.png" },
    { id: "2", name: "Mil Reais", value: "R$ 1000,00", image: "/images/money-1000.png" },
    { id: "3", name: "500 Reais", value: "R$ 500,00", image: "/images/money-500.png" },
    { id: "4", name: "200 Reais", value: "R$ 200,00", image: "/images/money-200.png" },
    { id: "5", name: "100 Reais", value: "R$ 100,00", image: "/images/money-100.png" },
    { id: "6", name: "50 Reais", value: "R$ 50,00", image: "/images/money-50.png" },
    { id: "7", name: "20 Reais", value: "R$ 20,00", image: "/images/money-20.png" },
    { id: "8", name: "10 Reais", value: "R$ 10,00", image: "/images/money-10.png" },
    { id: "9", name: "5 Reais", value: "R$ 5,00", image: "/images/money-5.png" },
    { id: "10", name: "2 Reais", value: "R$ 2,00", image: "/images/money-2.png" },
    { id: "11", name: "1 Real", value: "R$ 1,00", image: "/images/money-1-real.png" },
    { id: "12", name: "50 Centavos", value: "R$ 0,50", image: "/images/money-50-centavos.png" },
  ]

  function generateGameResult() {
    const isWinner = Math.random() < parseFloat(rtp) / 100
    if (isWinner) {
      const winningProbabilities = [
        { prize: prizes[11], weight: 35 },
        { prize: prizes[10], weight: 25 },
        { prize: prizes[9], weight: 15 },
        { prize: prizes[8], weight: 10 },
        { prize: prizes[7], weight: 6 },
        { prize: prizes[6], weight: 4 },
        { prize: prizes[5], weight: 2.5 },
        { prize: prizes[4], weight: 1.5 },
        { prize: prizes[3], weight: 0.7 },
        { prize: prizes[2], weight: 0.2 },
        { prize: prizes[1], weight: 0.09 },
        { prize: prizes[0], weight: 0.01 },
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
    if (balance < 0.5) {
      onNavigate("deposit")
      return
    }

    try {
      const res = await fetch("/api/games/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          amount: 0.5
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setBalance(prev => prev - 0.5)
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
      title="PIX na conta"
      subtitle="Raspe e ganhe prêmios em dinheiro!"
      showBackButton
      onBack={onBack}
      user={{ ...user, balance }}
      onLogout={onLogout}
      onNavigate={onNavigate}
    >
      <div className="max-w-2xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="w-16 h-16 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ScratchOffGame
              key={gameKey}
              prizes={prizes}
              winningPrize={currentWinningPrize}
              onGameComplete={handleGameComplete}
              onPlayAgain={handlePlayAgain}
              gamePrice={0.5}
              className="w-full"
            />

            <div className="mt-6 bg-black border-2 border-white/20 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <img src="/images/money.png" alt="PIX na conta" className="w-16 h-16 object-contain" />
                <div>
                  <h3 className="text-white font-bold text-lg">PIX na conta</h3>
                  <p className="text-gray-400 text-sm">
                    Raspe e receba prêmios em DINHEIRO $$$ até R$2.000 diretamente no seu PIX 💰🪙
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