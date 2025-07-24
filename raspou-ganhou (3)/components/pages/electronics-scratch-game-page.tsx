"use client"

import { useState, useEffect } from "react"
import { PageLayout } from "@/components/layout/page-layout"
import { ScratchOffGame } from "@/components/game/scratch-off-game"

interface ElectronicsScratchGamePageProps {
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
 * Página do jogo de raspadinha de eletrônicos
 */
export function ElectronicsScratchGamePage({
  onBack,
  user,
  onLogout,
  onNavigate,
  categoryId,
}: ElectronicsScratchGamePageProps) {
  const [gameKey, setGameKey] = useState(0) // Para forçar re-render do jogo
  const [isLoading, setIsLoading] = useState(true)

  // Efeito para simular carregamento do jogo
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [])

  // Prêmios de eletrônicos disponíveis - LISTA EXPANDIDA
  const electronicsPrizes = [
    {
      id: "1",
      name: "MacBook Air",
      value: "R$ 8.000,00",
      image: "/images/electronics/macbook-air.webp",
    },
    {
      id: "2",
      name: "iPhone 15 Pro",
      value: "R$ 5.000,00",
      image: "/images/electronics/iphone-15-pro.webp",
    },
    {
      id: "3",
      name: 'Smart TV 55" Aiwa',
      value: "R$ 3.500,00",
      image: "/images/electronics/smart-tv.webp",
    },
    {
      id: "4",
      name: "Geladeira Electrolux",
      value: "R$ 3.000,00",
      image: "/images/electronics/refrigerator.webp",
    },
    {
      id: "5",
      name: "iPad",
      value: "R$ 2.500,00",
      image: "/images/electronics/ipad.webp",
    },
    {
      id: "6",
      name: "Samsung Galaxy",
      value: "R$ 2.000,00",
      image: "/images/electronics/samsung-galaxy.webp",
    },
    {
      id: "7",
      name: "Tablet Samsung",
      value: "R$ 1.500,00",
      image: "/images/electronics/samsung-tablet.webp",
    },
    {
      id: "8",
      name: "Apple Watch",
      value: "R$ 1.200,00",
      image: "/images/electronics/apple-watch.webp",
    },
    {
      id: "9",
      name: "Echo Dot Alexa",
      value: "R$ 400,00",
      image: "/images/electronics/echo-dot.webp",
    },
    {
      id: "10",
      name: "Power Bank 20000mAh",
      value: "R$ 250,00",
      image: "/images/electronics/power-bank.webp",
    },
    {
      id: "11",
      name: "Caixa JBL",
      value: "R$ 200,00",
      image: "/images/electronics/jbl-speaker.webp",
    },
    {
      id: "12",
      name: "Fones Sem Fio",
      value: "R$ 150,00",
      image: "/images/electronics/wireless-earbuds.webp",
    },
    {
      id: "13",
      name: "Carregador Apple",
      value: "R$ 120,00",
      image: "/images/electronics/apple-charger.webp",
    },
    {
      id: "14",
      name: "Suporte Celular",
      value: "R$ 80,00",
      image: "/images/electronics/phone-stand.webp",
    },
    {
      id: "15",
      name: "Película ColorGlass",
      value: "R$ 50,00",
      image: "/images/electronics/screen-protector.webp",
    },
    {
      id: "16",
      name: "Capa Transparente",
      value: "R$ 30,00",
      image: "/images/electronics/phone-case.webp",
    },
    {
      id: "17",
      name: "Cabo USB-C",
      value: "R$ 25,00",
      image: "/images/electronics/usb-cable.webp",
    },
  ]

  // Simular resultado do jogo (70% chance de perder, 30% de ganhar)
  const generateGameResult = () => {
    const isWinner = Math.random() < 0.3 // 30% chance de ganhar

    if (isWinner) {
      // Prêmios menores têm maior probabilidade
      const winningProbabilities = [
        { prize: electronicsPrizes[16], weight: 25 }, // Cabo USB-C - 25%
        { prize: electronicsPrizes[15], weight: 20 }, // Capa Transparente - 20%
        { prize: electronicsPrizes[14], weight: 15 }, // Película - 15%
        { prize: electronicsPrizes[13], weight: 12 }, // Suporte - 12%
        { prize: electronicsPrizes[12], weight: 8 }, // Carregador Apple - 8%
        { prize: electronicsPrizes[11], weight: 6 }, // Fones Sem Fio - 6%
        { prize: electronicsPrizes[10], weight: 4 }, // Caixa JBL - 4%
        { prize: electronicsPrizes[9], weight: 3 }, // Power Bank - 3%
        { prize: electronicsPrizes[8], weight: 2.5 }, // Echo Dot - 2.5%
        { prize: electronicsPrizes[7], weight: 1.5 }, // Apple Watch - 1.5%
        { prize: electronicsPrizes[6], weight: 1 }, // Tablet Samsung - 1%
        { prize: electronicsPrizes[5], weight: 0.7 }, // Samsung Galaxy - 0.7%
        { prize: electronicsPrizes[4], weight: 0.4 }, // iPad - 0.4%
        { prize: electronicsPrizes[3], weight: 0.2 }, // Geladeira - 0.2%
        { prize: electronicsPrizes[2], weight: 0.15 }, // Smart TV - 0.15%
        { prize: electronicsPrizes[1], weight: 0.1 }, // iPhone 15 Pro - 0.1%
        { prize: electronicsPrizes[0], weight: 0.05 }, // MacBook Air - 0.05%
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
    // Verificar se usuário tem saldo suficiente (R$ 2,00 para eletrônicos)
    if (user.balance < 2.0) {
      onNavigate("deposit")
      return
    }

    // Gerar novo resultado e reiniciar jogo
    setGameKey((prev) => prev + 1)
    // TODO: Debitar valor do jogo do saldo do usuário
  }

  return (
    <PageLayout
      title="Sonho de Consumo 😍"
      subtitle="Raspe e ganhe eletrônicos incríveis!"
      showBackButton
      onBack={onBack}
      user={user}
      onLogout={onLogout}
      onNavigate={onNavigate}
    >
      <div className="max-w-2xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ScratchOffGame
              key={gameKey}
              prizes={electronicsPrizes}
              winningPrize={currentWinningPrize}
              onGameComplete={handleGameComplete}
              onPlayAgain={handlePlayAgain}
              gamePrice={2.0}
              className="w-full"
            />

            {/* Game Info */}
            <div className="mt-6 bg-black border-2 border-white/20 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <img src="/images/tech-products.png" alt="Sonho de Consumo" className="w-16 h-16 object-contain" />
                <div>
                  <h3 className="text-white font-bold text-lg">Sonho de Consumo 😍</h3>
                  <p className="text-gray-400 text-sm">
                    Celular, eletrônicos e componentes, receba prêmios exclusivos de alto valor agregado! 📱⚡
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
