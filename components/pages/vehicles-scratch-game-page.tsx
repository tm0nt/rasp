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

interface VehiclesScratchGamePageProps {
  rtp: string // Note: Consider changing to number for consistency
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
  isPlaying: boolean // ALTERAÇÃO: Adiciona isPlaying
  resetPlaying: () => void // ALTERAÇÃO: Adiciona resetPlaying
}

export function VehiclesScratchGamePage({
  rtp,
  onBack,
  user,
  onLogout,
  onNavigate,
  categoryId,
  isPlaying,
  resetPlaying,
}: VehiclesScratchGamePageProps) {
  const [gameKey, setGameKey] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [balance, setBalance] = useState(user.balance)
  const [revealedPrizes, setRevealedPrizes] = useState<Prize[]>([])
  const [purchaseId, setPurchaseId] = useState<string | null>(null)

  // ALTERAÇÃO: Função para buscar purchaseId após a compra inicial
  const fetchPurchaseId = async () => {
    if (!isPlaying || purchaseId) return // Evita chamadas redundantes

    try {
      setIsLoading(true)
      const res = await fetch("/api/games/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          amount: 5.0,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setPurchaseId(data.transactionId)
        setBalance(prev => prev - 5.0)
        console.log("fetchPurchaseId, purchaseId:", data.transactionId) // Debug
      } else {
        const error = await res.json()
        console.error("Erro ao obter purchaseId:", error.error)
        if (error.error === 'Saldo insuficiente') {
          onNavigate("deposit")
        }
      }
    } catch (err) {
      console.error("Erro ao conectar com /api/games/purchase", err)
    } finally {
      setIsLoading(false)
    }
  }

  // ALTERAÇÃO: Chama fetchPurchaseId quando isPlaying for true
  useEffect(() => {
    if (isPlaying) {
      fetchPurchaseId()
      setRevealedPrizes(generateRevealedPrizes())
    }

    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [isPlaying, gameKey])

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

  const selectWinningPrize = () => {
    const winningProbabilities = [
      { prize: vehiclesPrizes[9], weight: 30 },  // Odorizante
      { prize: vehiclesPrizes[8], weight: 25 },  // Suporte
      { prize: vehiclesPrizes[7], weight: 15 },  // Patins
      { prize: vehiclesPrizes[6], weight: 10 },  // Capacete
      { prize: vehiclesPrizes[5], weight: 8 },   // Jaqueta
      { prize: vehiclesPrizes[4], weight: 5 },   // Hoverboard
      { prize: vehiclesPrizes[3], weight: 3 },   // Patinete
      { prize: vehiclesPrizes[2], weight: 2 },   // Bicicleta
      { prize: vehiclesPrizes[1], weight: 1.5 }, // Honda Pop
      { prize: vehiclesPrizes[0], weight: 0.5 }, // Honda CG
    ]

    const totalWeight = winningProbabilities.reduce((sum, item) => sum + item.weight, 0)
    let random = Math.random() * totalWeight
    for (const item of winningProbabilities) {
      random -= item.weight
      if (random <= 0) return item.prize
    }
    return vehiclesPrizes[9] // Default to lowest prize
  }

  const getRandomPrize = () => {
    const randomIndex = Math.floor(Math.random() * vehiclesPrizes.length)
    return vehiclesPrizes[randomIndex]
  }

  const generateRevealedPrizes = () => {
    const isWinner = Math.random() < parseFloat(rtp) / 100
    const prizesGrid: Prize[] = []

    if (isWinner) {
      const winningPrize = selectWinningPrize()
      
      // Add 3 winning prizes
      for (let i = 0; i < 3; i++) {
        prizesGrid.push({ ...winningPrize, id: `win-${i}`, isWinning: true })
      }
      
      // Add 6 random non-winning prizes
      for (let i = 0; i < 6; i++) {
        let randomPrize
        do {
          randomPrize = getRandomPrize()
        } while (randomPrize.id === winningPrize.id) // Ensure different from winning prize
        
        prizesGrid.push({ ...randomPrize, id: `random-${i}` })
      }
    } else {
      // Add 9 random non-winning prizes (all different)
      const shuffled = [...vehiclesPrizes].sort(() => 0.5 - Math.random())
      for (let i = 0; i < 9; i++) {
        prizesGrid.push({ ...shuffled[i % shuffled.length], id: `random-${i}` })
      }
    }

    return prizesGrid.sort(() => Math.random() - 0.5) // Shuffle the array
  }

  const handleGameComplete = async (isWinner: boolean, prize?: Prize) => {
    if (!purchaseId || !isPlaying) return // ALTERAÇÃO: Verifica isPlaying

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
        setPurchaseId(data.transactionId)
        setGameKey(prev => prev + 1)
        console.log("handlePlayAgain, purchaseId:", data.transactionId) // Debug
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

  // ALTERAÇÃO: Função para resetar estados ao sair
  const handleBack = () => {
    setPurchaseId(null)
    resetPlaying() // Chama resetPlaying para resetar isPlaying no componente pai
    onBack()
  }

  return (
    <PageLayout
      title="Super Prêmios 🏍️"
      subtitle="Cansado de ficar a pé? Essa é sua chance!"
      showBackButton
      onBack={handleBack} // ALTERAÇÃO: Usa handleBack personalizado
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
              revealedPrizes={revealedPrizes}
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
