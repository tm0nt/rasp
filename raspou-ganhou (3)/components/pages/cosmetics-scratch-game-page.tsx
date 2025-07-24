"use client"

import { useState, useEffect } from "react"
import { PageLayout } from "@/components/layout/page-layout"
import { ScratchOffGame } from "@/components/game/scratch-off-game"

interface CosmeticsScratchGamePageProps {
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
 * Página do jogo de raspadinha de cosméticos
 */
export function CosmeticsScratchGamePage({
  onBack,
  user,
  onLogout,
  onNavigate,
  categoryId,
}: CosmeticsScratchGamePageProps) {
  const [gameKey, setGameKey] = useState(0) // Para forçar re-render do jogo
  const [isLoading, setIsLoading] = useState(true)

  // Efeito para simular carregamento do jogo
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [])

  // Prêmios de cosméticos disponíveis
  const cosmeticsPrizes = [
    {
      id: "1",
      name: "Perfume Dior",
      value: "R$ 800,00",
      image: "/images/cosmetics/dior-perfume.webp",
    },
    {
      id: "2",
      name: "Kit Kérastase",
      value: "R$ 450,00",
      image: "/images/cosmetics/kerastase-kit.webp",
    },
    {
      id: "3",
      name: "Kit Maquiagem",
      value: "R$ 350,00",
      image: "/images/cosmetics/makeup-kit.webp",
    },
    {
      id: "4",
      name: "Escova Alisadora",
      value: "R$ 280,00",
      image: "/images/cosmetics/hair-straightener.webp",
    },
    {
      id: "5",
      name: "Caixa de Beleza",
      value: "R$ 200,00",
      image: "/images/cosmetics/beauty-box.webp",
    },
    {
      id: "6",
      name: "Bolsa Hobo",
      value: "R$ 150,00",
      image: "/images/cosmetics/hobo-bag.webp",
    },
    {
      id: "7",
      name: "Body Splash Kit",
      value: "R$ 120,00",
      image: "/images/cosmetics/body-splash.webp",
    },
    {
      id: "8",
      name: "Voucher SHEIN",
      value: "R$ 100,00",
      image: "/images/cosmetics/shein-vouchers.webp",
    },
    {
      id: "9",
      name: "Máscara Facial",
      value: "R$ 50,00",
      image: "/images/cosmetics/black-mask.webp",
    },
    {
      id: "10",
      name: "Cabo USB-C",
      value: "R$ 25,00",
      image: "/images/cosmetics/usb-cable.webp",
    },
  ]

  // Simular resultado do jogo (70% chance de perder, 30% de ganhar)
  const generateGameResult = () => {
    const isWinner = Math.random() < 0.3 // 30% chance de ganhar

    if (isWinner) {
      // Prêmios menores têm maior probabilidade
      const winningProbabilities = [
        { prize: cosmeticsPrizes[9], weight: 35 }, // Cabo USB-C - 35%
        { prize: cosmeticsPrizes[8], weight: 25 }, // Máscara Facial - 25%
        { prize: cosmeticsPrizes[7], weight: 15 }, // Voucher SHEIN - 15%
        { prize: cosmeticsPrizes[6], weight: 10 }, // Body Splash - 10%
        { prize: cosmeticsPrizes[5], weight: 6 }, // Bolsa Hobo - 6%
        { prize: cosmeticsPrizes[4], weight: 4 }, // Caixa de Beleza - 4%
        { prize: cosmeticsPrizes[3], weight: 2.5 }, // Escova Alisadora - 2.5%
        { prize: cosmeticsPrizes[2], weight: 1.5 }, // Kit Maquiagem - 1.5%
        { prize: cosmeticsPrizes[1], weight: 0.8 }, // Kit Kérastase - 0.8%
        { prize: cosmeticsPrizes[0], weight: 0.2 }, // Perfume Dior - 0.2%
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
    // Verificar se usuário tem saldo suficiente (R$ 2,50 para cosméticos)
    if (user.balance < 2.5) {
      onNavigate("deposit")
      return
    }

    // Gerar novo resultado e reiniciar jogo
    setGameKey((prev) => prev + 1)
    // TODO: Debitar valor do jogo do saldo do usuário
  }

  return (
    <PageLayout
      title="Me mimei"
      subtitle="Raspe e ganhe produtos de beleza incríveis!"
      showBackButton
      onBack={onBack}
      user={user}
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

            {/* Game Info */}
            <div className="mt-6 bg-black border-2 border-white/20 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <img src="/images/luxury-items.png" alt="Me mimei" className="w-16 h-16 object-contain" />
                <div>
                  <h3 className="text-white font-bold text-lg">Me mimei</h3>
                  <p className="text-gray-400 text-sm">
                    Shopee, shein, presentinhos... Quer se mimar mas tá muito caro? Não se preocupe, é só dar sorte
                    aqui! 💄✨
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
