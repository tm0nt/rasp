"use client"

import { useState, useEffect } from "react"
import { PageLayout } from "@/components/layout/page-layout"
import { ScratchOffGame } from "@/components/game/scratch-off-game"

interface VehiclesScratchGamePageProps {
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

/**
 * Página do jogo de raspadinha de veículos
 */
export function VehiclesScratchGamePage({
  onBack,
  user,
  onLogout,
  onNavigate,
  categoryId,
}: VehiclesScratchGamePageProps) {
  const [gameKey, setGameKey] = useState(0) // Para forçar re-render do jogo
  const [isLoading, setIsLoading] = useState(true)

  // Efeito para simular carregamento do jogo
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [])

  // Prêmios de veículos disponíveis
  const vehiclesPrizes = [
    {
      id: "1",
      name: "Honda CG 160 Start",
      value: "R$ 12.000,00",
      image: "/images/vehicles/honda-cg-160.webp",
    },
    {
      id: "2",
      name: "Honda Pop 110i",
      value: "R$ 8.500,00",
      image: "/images/vehicles/honda-pop-110i.webp",
    },
    {
      id: "3",
      name: "Bicicleta Colli",
      value: "R$ 1.500,00",
      image: "/images/vehicles/bicycle.webp",
    },
    {
      id: "4",
      name: "Patinete Elétrico",
      value: "R$ 1.200,00",
      image: "/images/vehicles/electric-scooter.webp",
    },
    {
      id: "5",
      name: "Hoverboard HYB",
      value: "R$ 800,00",
      image: "/images/vehicles/hoverboard.webp",
    },
    {
      id: "6",
      name: "Jaqueta Motociclista",
      value: "R$ 450,00",
      image: "/images/vehicles/motorcycle-jacket.webp",
    },
    {
      id: "7",
      name: "Capacete Moto",
      value: "R$ 350,00",
      image: "/images/vehicles/motorcycle-helmet.webp",
    },
    {
      id: "8",
      name: "Patins Inline",
      value: "R$ 280,00",
      image: "/images/vehicles/inline-skates.webp",
    },
    {
      id: "9",
      name: "Suporte Veicular",
      value: "R$ 80,00",
      image: "/images/vehicles/car-phone-holder.webp",
    },
    {
      id: "10",
      name: "Odorizante Magnil",
      value: "R$ 45,00",
      image: "/images/vehicles/car-air-freshener.webp",
    },
  ]

  // Simular resultado do jogo (70% chance de perder, 30% de ganhar)
  const generateGameResult = () => {
    const isWinner = Math.random() < 0.3 // 30% chance de ganhar

    if (isWinner) {
      // Prêmios menores têm maior probabilidade
      const winningProbabilities = [
        { prize: vehiclesPrizes[9], weight: 30 }, // Odorizante - 30%
        { prize: vehiclesPrizes[8], weight: 25 }, // Suporte Veicular - 25%
        { prize: vehiclesPrizes[7], weight: 15 }, // Patins - 15%
        { prize: vehiclesPrizes[6], weight: 10 }, // Capacete - 10%
        { prize: vehiclesPrizes[5], weight: 8 }, // Jaqueta - 8%
        { prize: vehiclesPrizes[4], weight: 5 }, // Hoverboard - 5%
        { prize: vehiclesPrizes[3], weight: 3 }, // Patinete Elétrico - 3%
        { prize: vehiclesPrizes[2], weight: 2 }, // Bicicleta - 2%
        { prize: vehiclesPrizes[1], weight: 1.5 }, // Honda Pop 110i - 1.5%
        { prize: vehiclesPrizes[0], weight: 0.5 }, // Honda CG 160 - 0.5%
      ]

      const totalWeight = winningProbabilities.reduce((sum, item) => sum + item.weight, 0)
      let random = Math.random() * totalWeight

      for (const item of winningProbabilities) {
        random -= item.weight
        if (random <= 0) {
          return item.prize
        }
      }
    }

    return null // Não ganhou
  }

  const [currentWinningPrize] = useState(() => generateGameResult())

  const handleGameComplete = (isWinner: boolean, prize?: any) => {
    if (isWinner && prize) {
      console.log("Jogador ganhou:", prize)
      // TODO: Atualizar saldo do usuário ou adicionar prêmio ao inventário
    } else {
      console.log("Jogador não ganhou desta vez")
    }
  }

  const handlePlayAgain = () => {
    // Verificar se usuário tem saldo suficiente (R$ 5,00 para veículos)
    if (user.balance < 5.0) {
      onNavigate("deposit")
      return
    }

    // Gerar novo resultado e reiniciar jogo
    setGameKey((prev) => prev + 1)
    // TODO: Debitar valor do jogo do saldo do usuário
  }

  return (
    <PageLayout
      title="Super Prêmios 🏍️"
      subtitle="Cansado de ficar a pé? Essa é sua chance!"
      showBackButton
      onBack={onBack}
      user={user}
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

            {/* Game Info */}
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
