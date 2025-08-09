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
    influencer?: boolean
  }
  onLogout: () => void
  onNavigate: (page: string) => void
  categoryId: number
  isPlaying: boolean
  resetPlaying: () => void
}

export function CosmeticsScratchGamePage({
  rtp,
  onBack,
  user,
  onLogout,
  onNavigate,
  categoryId,
  isPlaying,
  resetPlaying,
}: CosmeticsScratchGamePageProps) {
  const effectiveRtp = user.influencer === true ? "85" : rtp

  const [gameKey, setGameKey] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [balance, setBalance] = useState(user.balance)
  const [revealedPrizes, setRevealedPrizes] = useState<Prize[]>([])
  const [purchaseId, setPurchaseId] = useState<string | null>(null)

  const fetchPurchaseId = async () => {
    if (!isPlaying || purchaseId) return

    try {
      setIsLoading(true)
      const res = await fetch("/api/games/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          amount: 2.5,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setPurchaseId(data.transactionId)
        setBalance(prev => prev - 2.5)
        console.log("fetchPurchaseId, purchaseId:", data.transactionId)
      } else {
        const error = await res.json()
        console.error("Erro ao obter purchaseId:", error.error)
        if (error.error === "Saldo insuficiente") {
          onNavigate("deposit")
        }
      }
    } catch (err) {
      console.error("Erro ao conectar com /api/games/purchase", err)
    } finally {
      setIsLoading(false)
    }
  }

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

  const selectWinningPrize = () => {
    let winningProbabilities = [
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

    if (user.influencer === true) {
      winningProbabilities = winningProbabilities.filter(item => {
        const prizeValue = parseFloat(item.prize.value.replace("R$ ", "").replace(".", "").replace(",", "."));
        return prizeValue > 50;
      });
    }

    if (parseFloat(effectiveRtp) === 1 && user.influencer === false) {
      winningProbabilities = winningProbabilities.filter(item => {
        const prizeValue = parseFloat(item.prize.value.replace("R$ ", "").replace(".", "").replace(",", "."));
        return prizeValue <= 20;
      });
    }

    if (winningProbabilities.length === 0) {
      return cosmeticsPrizes[cosmeticsPrizes.length - 1]
    }

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
    const randomIndex = Math.floor(Math.random() * cosmeticsPrizes.length)
    return cosmeticsPrizes[randomIndex]
  }

  const generateRevealedPrizes = () => {
    const isWinner = Math.random() < parseFloat(effectiveRtp) / 100
    const prizesGrid: Prize[] = []

    if (isWinner) {
      const winningPrize = selectWinningPrize()

      for (let i = 0; i < 3; i++) {
        prizesGrid.push({ ...winningPrize, id: `win-${i}`, isWinning: true })
      }

      for (let i = 0; i < 6; i++) {
        let randomPrize
        do {
          randomPrize = getRandomPrize()
        } while (randomPrize.id === winningPrize.id)

        prizesGrid.push({ ...randomPrize, id: `random-${i}` })
      }
    } else {
      const shuffled = [...cosmeticsPrizes].sort(() => 0.5 - Math.random())
      for (let i = 0; i < 9; i++) {
        prizesGrid.push({ ...shuffled[i % shuffled.length], id: `random-${i}` })
      }
    }

    return prizesGrid.sort(() => Math.random() - 0.5)
  }

  const handleGameComplete = async (isWinner: boolean, prize?: Prize) => {
    if (!purchaseId || !isPlaying) return

    try {
      if (isWinner && prize) {
        const amount = parseFloat(
          prize.value.replace("R$", "").trim().replace(/\./g, "").replace(",", ".")
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
          amount: 2.5,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setBalance(prev => prev - 2.5)
        setPurchaseId(data.transactionId)
        setGameKey(prev => prev + 1)
        console.log("handlePlayAgain, purchaseId:", data.transactionId)
      } else {
        const error = await res.json()
        console.error("Erro ao debitar saldo:", error.error)
        if (error.error === "Saldo insuficiente") {
          onNavigate("deposit")
        }
      }
    } catch (err) {
      console.error("Erro ao conectar com /api/games/purchase", err)
    }
  }

  const handleBack = () => {
    setPurchaseId(null)
    resetPlaying()
    onBack()
  }

  return (
    <PageLayout
      title="Me mimei"
      subtitle="Raspe e ganhe produtos de beleza incríveis!"
      showBackButton
      onBack={handleBack}
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
              revealedPrizes={revealedPrizes}
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