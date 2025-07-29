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
          amount: 2.0,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setPurchaseId(data.transactionId)
        setBalance(prev => prev - 2.0)
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
    const winningProbabilities = [
      { prize: electronicsPrizes[16], weight: 25 },  // Cabo USB-C
      { prize: electronicsPrizes[15], weight: 20 },  // Capa Transparente
      { prize: electronicsPrizes[14], weight: 15 },  // Película
      { prize: electronicsPrizes[13], weight: 12 },  // Suporte Celular
      { prize: electronicsPrizes[12], weight: 8 },   // Carregador Apple
      { prize: electronicsPrizes[11], weight: 6 },   // Fones Sem Fio
      { prize: electronicsPrizes[10], weight: 4 },   // Caixa JBL
      { prize: electronicsPrizes[9], weight: 3 },    // Power Bank
      { prize: electronicsPrizes[8], weight: 2.5 },  // Echo Dot
      { prize: electronicsPrizes[7], weight: 1.5 },  // Apple Watch
      { prize: electronicsPrizes[6], weight: 1 },    // Tablet Samsung
      { prize: electronicsPrizes[5], weight: 0.7 },  // Samsung Galaxy
      { prize: electronicsPrizes[4], weight: 0.4 },  // iPad
      { prize: electronicsPrizes[3], weight: 0.2 },  // Geladeira
      { prize: electronicsPrizes[2], weight: 0.15 }, // Smart TV
      { prize: electronicsPrizes[1], weight: 0.1 },  // iPhone
      { prize: electronicsPrizes[0], weight: 0.05 }, // MacBook
    ]

    const totalWeight = winningProbabilities.reduce((sum, item) => sum + item.weight, 0)
    let random = Math.random() * totalWeight
    for (const item of winningProbabilities) {
      random -= item.weight
      if (random <= 0) return item.prize
    }
    return electronicsPrizes[16] // Default to lowest prize
  }

  const getRandomPrize = () => {
    const randomIndex = Math.floor(Math.random() * electronicsPrizes.length)
    return electronicsPrizes[randomIndex]
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
      const shuffled = [...electronicsPrizes].sort(() => 0.5 - Math.random())
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
          amount: 2.0
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setBalance(prev => prev - 2.0)
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
      title="Sonho de Consumo 😍"
      subtitle="Raspe e ganhe eletrônicos incríveis!"
      showBackButton
      onBack={handleBack} // ALTERAÇÃO: Usa handleBack personalizado
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