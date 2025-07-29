"use client"

import { useState, useEffect } from "react"
import { PageLayout } from "@/components/layout/page-layout"
import { ScratchOffGame } from "@/components/game/scratch-off-game"

interface Prize {
  id: string
  name: string
  value: string
  image: string
  isWinning?: boolean
}

interface ScratchGamePageProps {
  rtp: number
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
  const [revealedPrizes, setRevealedPrizes] = useState<Prize[]>([])
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

  const selectWinningPrizeBasedOnRTP = () => {
    const winningProbabilities = [
      { prize: prizes[11], weight: 35 },   // 50 Centavos
      { prize: prizes[10], weight: 25 },   // 1 Real
      { prize: prizes[9], weight: 15 },    // 2 Reais
      { prize: prizes[8], weight: 10 },    // 5 Reais
      { prize: prizes[7], weight: 6 },     // 10 Reais
      { prize: prizes[6], weight: 4 },     // 20 Reais
      { prize: prizes[5], weight: 2.5 },   // 50 Reais
      { prize: prizes[4], weight: 1.5 },   // 100 Reais
      { prize: prizes[3], weight: 0.7 },   // 200 Reais
      { prize: prizes[2], weight: 0.2 },   // 500 Reais
      { prize: prizes[1], weight: 0.09 },  // Mil Reais
      { prize: prizes[0], weight: 0.01 },  // 2 Mil Reais
    ]

    const totalWeight = winningProbabilities.reduce((sum, item) => sum + item.weight, 0)
    let random = Math.random() * totalWeight
    let selectedPrize = winningProbabilities[0].prize

    for (const item of winningProbabilities) {
      random -= item.weight
      if (random <= 0) {
        selectedPrize = item.prize
        break
      }
    }

    return selectedPrize
  }

  const getRandomPrize = () => {
    const randomIndex = Math.floor(Math.random() * prizes.length)
    return prizes[randomIndex]
  }

  const generateRevealedPrizes = () => {
    const isWinner = Math.random() < (rtp) / 100
    const prizesGrid: Prize[] = []

    if (isWinner) {
      const winningPrize = selectWinningPrizeBasedOnRTP()
      
      // Adiciona 3 prêmios iguais (vencedores)
      for (let i = 0; i < 3; i++) {
        prizesGrid.push({ ...winningPrize, id: `win-${i}`, isWinning: true })
      }
      
      // Preenche os outros 6 com prêmios aleatórios
      for (let i = 0; i < 6; i++) {
        const randomPrize = getRandomPrize()
        prizesGrid.push({ ...randomPrize, id: `random-${i}` })
      }
    } else {
      // Preenche todos os 9 com prêmios diferentes
      const shuffled = [...prizes].sort(() => 0.5 - Math.random())
      for (let i = 0; i < 9; i++) {
        prizesGrid.push({ ...shuffled[i % shuffled.length], id: `random-${i}` })
      }
    }

    return prizesGrid.sort(() => Math.random() - 0.5) // Embaralha
  }

  useEffect(() => {
    setRevealedPrizes(generateRevealedPrizes())
  }, [gameKey])

const handleGameComplete = async (isWinner: boolean, prize?: Prize) => {
  if (!purchaseId) return

  try {
    if (isWinner && prize) {
      const amount = parseFloat(
        prize.value
          .replace("R$", "")
          .trim()
          .replace(/\./g, "")
          .replace(",", ".")
      )

      if (isNaN(amount)) {
        console.error("Valor do prêmio inválido:", prize.value)
        return
      }

      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: purchaseId,
          action: "win",
          prizeValue: prize.value,
        }),
      })

      if (!res.ok) {
        console.error("Erro ao registrar vitória")
      }
    } else {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: purchaseId,
          action: "lost",
        }),
      })

      if (!res.ok) {
        console.error("Erro ao registrar perda")
      }
    }
  } catch (err) {
    console.error("Erro na requisição para /api/games", err)
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
        setPurchaseId(data.transactionId)
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
              revealedPrizes={revealedPrizes}
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