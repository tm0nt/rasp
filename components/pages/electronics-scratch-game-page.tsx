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

interface ElectronicsScratchGamePageProps {
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

export function ElectronicsScratchGamePage({
  rtp,
  onBack,
  user,
  onLogout,
  onNavigate,
  categoryId,
  isPlaying,
  resetPlaying,
}: ElectronicsScratchGamePageProps) {
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
          amount: 2.0,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setPurchaseId(data.transactionId)
        setBalance(prev => prev - 2.0)
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

  const electronicsPrizes = [
    { id: "1", name: "MacBook Air", value: "R$ 8.000,00", image: "/images/electronics/macbook-air.webp" },
    { id: "2", name: "iPhone 15 Pro", value: "R$ 5.000,00", image: "/images/electronics/iphone-15-pro.webp" },
    { id: "3", name: 'Smart TV 55" Aiwa', value: "R$ 3.500,00", image: "/images/electronics/smart-tv.webp" },
    { id: "4", name: "Geladeira Electrolux", value: "R$ 3.000,00", image: "/images/electronics/refrigerator.webp" },
    { id: "5", name: "iPad", value: "R$ 2.500,00", image: "/images/electronics/ipad.webp" },
    { id: "6", name: "Samsung Galaxy", value: "R$ 2.000,00", image: "/images/electronics/samsung-galaxy.webp" },
    { id: "7", name: "Tablet Samsung", value: "R$ 1.500,00", image: "/images/electronics/samsung-tablet.webp" },
    { id: "8", name: "Apple Watch", value: "R$ 1.200,00", image: "/images/electronics/apple-watch.webp" },
    { id: "9", name: "Echo Dot Alexa", value: "R$ 400,00", image: "/images/electronics/echo-dot.webp" },
    { id: "10", name: "Power Bank 20000mAh", value: "R$ 250,00", image: "/images/electronics/power-bank.webp" },
    { id: "11", name: "Caixa JBL", value: "R$ 200,00", image: "/images/electronics/jbl-speaker.webp" },
    { id: "12", name: "Fones Sem Fio", value: "R$ 150,00", image: "/images/electronics/wireless-earbuds.webp" },
    { id: "13", name: "Carregador Apple", value: "R$ 120,00", image: "/images/electronics/apple-charger.webp" },
    { id: "14", name: "Suporte Celular", value: "R$ 80,00", image: "/images/electronics/phone-stand.webp" },
    { id: "15", name: "Película ColorGlass", value: "R$ 50,00", image: "/images/electronics/screen-protector.webp" },
    { id: "16", name: "Capa Transparente", value: "R$ 30,00", image: "/images/electronics/phone-case.webp" },
    { id: "17", name: "Cabo USB-C", value: "R$ 25,00", image: "/images/electronics/usb-cable.webp" },
  ]

  const selectWinningPrize = () => {
    let winningProbabilities = [
      { prize: electronicsPrizes[16], weight: 25 },
      { prize: electronicsPrizes[15], weight: 20 },
      { prize: electronicsPrizes[14], weight: 15 },
      { prize: electronicsPrizes[13], weight: 12 },
      { prize: electronicsPrizes[12], weight: 8 },
      { prize: electronicsPrizes[11], weight: 6 },
      { prize: electronicsPrizes[10], weight: 4 },
      { prize: electronicsPrizes[9], weight: 3 },
      { prize: electronicsPrizes[8], weight: 2.5 },
      { prize: electronicsPrizes[7], weight: 1.5 },
      { prize: electronicsPrizes[6], weight: 1 },
      { prize: electronicsPrizes[5], weight: 0.7 },
      { prize: electronicsPrizes[4], weight: 0.4 },
      { prize: electronicsPrizes[3], weight: 0.2 },
      { prize: electronicsPrizes[2], weight: 0.15 },
      { prize: electronicsPrizes[1], weight: 0.1 },
      { prize: electronicsPrizes[0], weight: 0.05 },
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
      return electronicsPrizes[electronicsPrizes.length - 1]
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
    const randomIndex = Math.floor(Math.random() * electronicsPrizes.length)
    return electronicsPrizes[randomIndex]
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
      const shuffled = [...electronicsPrizes].sort(() => 0.5 - Math.random())
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
    if (balance < 2.0) {
      onNavigate("deposit")
      return
    }

    try {
      const res = await fetch("/api/games/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          amount: 2.0,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setBalance(prev => prev - 2.0)
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
      title="Sonho de Consumo 😍"
      subtitle="Raspe e ganhe eletrônicos incríveis!"
      showBackButton
      onBack={handleBack}
      user={{ ...user, balance }}
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
              revealedPrizes={revealedPrizes}
              onGameComplete={handleGameComplete}
              onPlayAgain={handlePlayAgain}
              gamePrice={2.0}
              className="w-full"
            />

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