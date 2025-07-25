"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight } from "lucide-react"
import { AuthModal } from "@/components/auth/auth-modal"
import { LoggedInHeader } from "@/components/header/logged-in-header"
import { GuestHeader } from "@/components/header/guest-header"
import { MobileNav } from "@/components/navigation/mobile-nav"
import { WalletPage } from "@/components/pages/wallet-page"
import { DepositPage } from "@/components/pages/deposit-page"
import { BonusesPage } from "@/components/pages/bonuses-page"
import { DeliveriesPage } from "@/components/pages/deliveries-page"
import { ReferEarnPage } from "@/components/pages/refer-earn-page"
import { SettingsPage } from "@/components/pages/settings-page"
import { CartPage } from "@/components/pages/cart-page"
import { WithdrawPage } from "@/components/pages/withdraw-page"
import { ScratchGamePage } from "@/components/pages/scratch-game-page"
import { CosmeticsScratchGamePage } from "@/components/pages/cosmetics-scratch-game-page"
import { ElectronicsScratchGamePage } from "@/components/pages/electronics-scratch-game-page"
import { VehiclesScratchGamePage } from "@/components/pages/vehicles-scratch-game-page"
import { LatestWinners } from "@/components/pages/latest-winners"
import { ToastProvider } from "@/contexts/toast-context"
import { ToastContainer } from "@/components/ui/toast"
import { useAuth } from "@/hooks/useAuth"
import { useNavigation } from "@/hooks/useNavigation"
import { useToast } from "@/contexts/toast-context"

function HeroCarousel() {
  return (
    <div className="relative h-[200px] md:h-[300px] lg:h-[400px] w-full group">
      <div className="relative w-full h-full overflow-hidden rounded-lg transition-all duration-500 hover:shadow-2xl hover:shadow-green-500/20">
        <Image
          src="/images/banner-motorcycle.png"
          alt="Raspou, achou 3 iguais, Ganhou! Prêmios até R$25.000"
          fill
          className="object-contain object-center transition-transform duration-700 group-hover:scale-105"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
    </div>
  )
}

/**
 * Main application component with comprehensive API integration points
 * Features:
 * - User authentication with toast notifications
 * - Game purchase and play functionality
 * - Balance management
 * - Navigation between different pages
 * - Real-time updates and notifications
 */
function RaspouGanhouApp() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTab, setModalTab] = useState<"login" | "register">("login")
  const [isLoaded, setIsLoaded] = useState(false)
  const [rtp, setRtp] = useState("")
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [gameData, setGameData] = useState<any | null>(null)
  const [purchaseLoading, setPurchaseLoading] = useState<number | null>(null)
  const [categories, setCategories] = useState([
    {
      id: 1,
      title: "PIX na conta",
      subtitle: "PRÊMIOS ATÉ R$ 2000,00",
      description: "Raspe e receba prêmios em DINHEIRO $$$ até R$2.000 diretamente no seu PIX",
      price: "R$ 0,50",
      image: "/images/money.png",
      isActive: true,
    },
    {
      id: 2,
      title: "Sonho de Consumo 😍",
      subtitle: "PRÊMIOS ATÉ R$ 8000,00",
      description: "Celular, eletrônicos e componentes, receba prêmios exclusivos de alto valor agregado, o...",
      price: "R$ 2,00",
      image: "/images/tech-products.png",
      isActive: true,
    },
    {
      id: 3,
      title: "Me mimei",
      subtitle: "PRÊMIOS ATÉ R$ 800,00",
      description: "Shopee, shein, presentinhos... Quer se mimar mas tá muito caro? Não se preocupe, é só dar...",
      price: "R$ 2,50",
      image: "/images/luxury-items.png",
      isActive: true,
    },
    {
      id: 4,
      title: "Super Prêmios",
      subtitle: "PRÊMIOS ATÉ R$ 12000,00",
      description: "Cansado de ficar a pé? Essa sua chance de sair motorizado, prêmios de até R$12.000",
      price: "R$ 5,00",
      image: "/images/vehicles.png",
      isActive: true,
    },
  ])

  // Authentication and navigation state
  const { isAuthenticated, user, login, logout, addBalance, deductBalance, recordBet } = useAuth()
  const { currentPage, navigateTo, goBack } = useNavigation()
  const { showToast } = useToast()

  useEffect(() => {
    setIsLoaded(true)
    loadInitialData()
  }, [])

  /**
   * Load initial application data
   */
  const loadInitialData = async () => {
    try {
      const promotionsResponse = await fetch("/api/promotions/active", {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      })
      const promotionsData = await promotionsResponse.json()
      if (!promotionsResponse.ok) {
        throw new Error(promotionsData.error || "Erro ao carregar promoções")
      }

      const configResponse = await fetch("/api/config/app", {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      })
      const configData = await configResponse.json()
      setRtp(configData.rtp_value)
      if (!configResponse.ok) {
        throw new Error(configData.error || "Erro ao carregar configuração")
      }
    } catch (error) {
      console.error("Failed to load initial data:", error)
      await fetch("/api/errors/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: error.message,
          context: "app_initialization",
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        }),
      })
    }
  }

  const [activeTab, setActiveTab] = useState("destaque")
  const tabs = [
    { id: "destaque", label: "Destaque" },
    { id: "pix", label: "PIX na Conta" },
    { id: "eletronico", label: "Eletrônico" },
    { id: "veiculo", label: "Veículo" },
    { id: "cosmeticos", label: "Cosméticos" },
  ]

  // Category filtering logic
  const categoryMapping = {
    destaque: categories,
    pix: categories.filter((cat: any) => cat.id === 1),
    eletronico: categories.filter((cat: any) => cat.id === 2),
    cosmeticos: categories.filter((cat: any) => cat.id === 3),
    veiculo: categories.filter((cat: any) => cat.id === 4),
  }

  const filteredCategories = categoryMapping[activeTab] || categories

  const tabsStyle = {
    scrollbarWidth: "none",
    msOverflowStyle: "none",
    WebkitScrollbar: { display: "none" },
  }

  /**
   * Open authentication modal with specified tab
   */
  const openModal = (tab: "login" | "register") => {
    setModalTab(tab)
    setIsModalOpen(true)
  }

  /**
   * Handle authentication success
   */
  const handleAuthSuccess = async (formData: any, isRegister: boolean) => {
    return await login(formData, isRegister)
  }

  /**
   * Handle protected action (requires authentication)
   */
  const handleAuthRequired = () => {
    showToast({
      type: "info",
      title: "🔐 Login necessário",
      message: "Você precisa fazer login para acessar esta funcionalidade.",
      duration: 5000,
    })
    openModal("login")
  }

  /**
   * Handle game purchase and play
   */
  const handleBuyAndPlay = async (category: { id: number; price: string; title: string }) => {
    if (!isAuthenticated || !user) {
      handleAuthRequired()
      return
    }

    const price = Number.parseFloat(category.price.replace("R$ ", "").replace(",", "."))

    if (user.balance < price) {
      showToast({
        type: "warning",
        title: "💰 Saldo insuficiente",
        message: `Você precisa de R$${price.toFixed(2)} para jogar. Seu saldo atual é R$${user.balance.toFixed(2)}.`,
        duration: 6000,
      })
      navigateTo("deposit")
      return
    }

    setPurchaseLoading(category.id)

    try {
      const response = await fetch("/api/games/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          categoryId: category.id,
          amount: price,
          userId: user.id,
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || "Erro na compra")
      }

      const success = await deductBalance(price, "bet")
      if (!success) {
        throw new Error("Falha ao deduzir saldo")
      }

      showToast({
        type: "success",
        title: "🎮 Compra realizada!",
        message: `Você comprou uma raspadinha de "${category.title}" por R$${price.toFixed(2)}. Boa sorte!`,
        duration: 5000,
      })

      await fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          event: "game_purchased",
          userId: user.id,
          properties: {
            categoryId: category.id,
            amount: price,
            categoryTitle: category.title,
            timestamp: new Date().toISOString(),
          },
        }),
      })

      const gameResponse = await fetch("/api/games/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          purchaseId: result.purchaseId,
          categoryId: category.id,
          userId: user.id,
        }),
      })

      const gameData = await gameResponse.json()
      if (!gameResponse.ok) {
        throw new Error(gameData.error || "Erro ao gerar jogo")
      }

      // Record bet result
      await recordBet(
        category.id,
        price,
        gameData.gameData.result.prize_value > 0 ? "win" : "lose",
        gameData.gameData.result.prize_name,
        gameData.gameData.result.prize_value,
      )

      setGameData(gameData.gameData)
      setSelectedCategoryId(category.id)
      navigateTo("scratch-game")
    } catch (error) {
      console.error("Purchase failed", error)
      showToast({
        type: "error",
        title: "❌ Erro na compra",
        message: "Ocorreu um erro ao processar sua compra. Tente novamente.",
        duration: 6000,
      })

      await fetch("/api/errors/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          error: error.message,
          context: "game_purchase",
          userId: user.id,
          categoryId: category.id,
          amount: price,
          timestamp: new Date().toISOString(),
        }),
      })
    } finally {
      setPurchaseLoading(null)
    }
  }

  /**
   * Handle navigation with authentication check
   */
  const handleNavigate = (page: string) => {
    if (!isAuthenticated && page !== "home") {
      handleAuthRequired()
      return
    }
    navigateTo(page as any)
  }

  // Render different pages based on current page
  if (currentPage === "wallet" && isAuthenticated && user) {
    return (
      <WalletPage onNavigate={handleNavigate} onBack={goBack} user={user} onLogout={logout} onAddBalance={addBalance} />
    )
  }

  if (currentPage === "deposit" && isAuthenticated && user) {
    return <DepositPage onBack={goBack} user={user} onLogout={logout} onNavigate={handleNavigate} />
  }

  if (currentPage === "withdraw" && isAuthenticated && user) {
    return <WithdrawPage onBack={goBack} user={user} onLogout={logout} onNavigate={handleNavigate} />
  }

  if (currentPage === "bonuses" && isAuthenticated && user) {
    return <BonusesPage onBack={goBack} user={user} onLogout={logout} onNavigate={handleNavigate} />
  }

  if (currentPage === "deliveries" && isAuthenticated && user) {
    return <DeliveriesPage onBack={goBack} user={user} onLogout={logout} onNavigate={handleNavigate} />
  }

  if (currentPage === "refer" && isAuthenticated && user) {
    return <ReferEarnPage onBack={goBack} user={user} onLogout={logout} onNavigate={handleNavigate} />
  }

  if (currentPage === "settings" && isAuthenticated && user) {
    return <SettingsPage user={user} onBack={goBack} onLogout={logout} onNavigate={handleNavigate} />
  }

  if (currentPage === "cart" && isAuthenticated && user) {
    return <CartPage onBack={goBack} user={user} onLogout={logout} onNavigate={handleNavigate} />
  }

  if (currentPage === "scratch-game" && isAuthenticated && user && selectedCategoryId && gameData) {
    const currentCategory = categories.find((cat: any) => cat.id === selectedCategoryId)
    const playAgain = () => handleBuyAndPlay(currentCategory)

    // Route to specific game based on category
    if (selectedCategoryId === 3) {
      return (
        <CosmeticsScratchGamePage
          onBack={goBack}
          user={user}
          onLogout={logout}
          onNavigate={handleNavigate}
          categoryId={selectedCategoryId}
          gameData={gameData}
          rtp={rtp}
          onPlayAgain={playAgain}
        />
      )
    } else if (selectedCategoryId === 2) {
      return (
        <ElectronicsScratchGamePage
          onBack={goBack}
          user={user}
          onLogout={logout}
          onNavigate={handleNavigate}
          categoryId={selectedCategoryId}
          gameData={gameData}
          rtp={rtp}
          onPlayAgain={playAgain}
        />
      )
    } else if (selectedCategoryId === 4) {
      return (
        <VehiclesScratchGamePage
          onBack={goBack}
          user={user}
          onLogout={logout}
          onNavigate={handleNavigate}
          categoryId={selectedCategoryId}
          gameData={gameData}
          rtp={rtp}
          onPlayAgain={playAgain}
        />
      )
    } else {
      return (
        <ScratchGamePage
          onBack={goBack}
          user={user}
          onLogout={logout}
          onNavigate={handleNavigate}
          categoryId={selectedCategoryId}
          gameData={gameData}
          rtp={rtp}
          onPlayAgain={playAgain}
        />
      )
    }
  }

  // Default home page
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Header */}
      <header
        className={`bg-black border-b border-gray-800 sticky top-0 z-40 backdrop-blur-md bg-black/95 transition-all duration-500 ${
          isLoaded ? "animate-in slide-in-from-top duration-700" : ""
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center group">
              <Image
                src="/images/logo.png"
                alt="Raspou Ganhou"
                width={120}
                height={40}
                className="h-8 w-auto transition-transform duration-300 group-hover:scale-105"
                priority
              />
            </div>
            {!isAuthenticated && (
              <div className="hidden md:flex items-center gap-2 text-green-400 animate-pulse">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
              </div>
            )}
          </div>

          {/* Dynamic Header Content */}
          {isAuthenticated && user ? (
            <LoggedInHeader user={user} onLogout={logout} onNavigate={handleNavigate} onAddBalance={addBalance} />
          ) : (
            <GuestHeader onOpenModal={openModal} />
          )}
        </div>
      </header>

      {/* Main Content Container */}
      <div className="max-w-6xl mx-auto px-4">
        {/* Hero Section */}
        <section
          className={`relative overflow-hidden py-2 transition-all duration-700 ${
            isLoaded ? "animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300" : ""
          }`}
        >
          <HeroCarousel />
        </section>

        {/* Latest Winners Section */}
        <LatestWinners />

        {/* Navigation Tabs */}
        <nav
          className={`py-4 transition-all duration-700 ${
            isLoaded ? "animate-in slide-in-from-left duration-1000 delay-500" : ""
          }`}
        >
          <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory md:overflow-visible" style={tabsStyle}>
            {tabs.map((tab, index) => (
              <Button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 whitespace-nowrap text-sm snap-start flex-shrink-0 transition-all duration-300 hover:scale-105 active:scale-95 ${
                  activeTab === tab.id
                    ? "bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/25"
                    : "bg-transparent text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500 hover:bg-gray-800/50"
                }`}
                style={{
                  animationDelay: `${600 + index * 100}ms`,
                }}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </nav>

        {/* Product Cards */}
        <section
          className={`pb-20 transition-all duration-700 ${
            isLoaded ? "animate-in fade-in slide-in-from-bottom duration-1000 delay-700" : ""
          }`}
        >
          <div className="space-y-6 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6 md:space-y-0">
            {filteredCategories.map((category: any, index: number) => (
              <div
                key={category.id}
                className="space-y-3 group animate-in fade-in slide-in-from-bottom duration-500"
                style={{
                  animationDelay: `${800 + index * 150}ms`,
                }}
              >
                <div className="relative h-48 rounded-lg overflow-hidden transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-green-500/20 group-hover:scale-[1.02]">
                  <Image
                    src={category.image || "/placeholder.svg"}
                    alt={category.title}
                    fill
                    className="object-contain transition-transform duration-700 group-hover:scale-110"
                  />
                  <Badge className="absolute top-3 right-3 bg-green-500 text-white font-bold text-lg px-3 py-1 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg">
                    {category.price}
                  </Badge>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                <div className="space-y-2 transition-all duration-300 group-hover:translate-y-[-2px]">
                  <h3 className="text-xl font-bold text-white transition-colors duration-300 group-hover:text-green-400">
                    {category.title}
                  </h3>
                  <p className="text-orange-400 font-semibold text-sm transition-colors duration-300 group-hover:text-orange-300">
                    {category.subtitle}
                  </p>
                  <p className="text-gray-300 text-sm line-clamp-3 transition-colors duration-300 group-hover:text-gray-200">
                    {category.description}
                  </p>
                </div>

                <Button
                  onClick={() => handleBuyAndPlay(category)}
                  disabled={purchaseLoading === category.id}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25 hover:scale-[1.02] active:scale-[0.98] group"
                >
                  {purchaseLoading === category.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Processando...
                    </>
                  ) : (
                    <>
                      Jogar por {category.price}
                      <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav isAuthenticated={isAuthenticated} onAuthRequired={handleAuthRequired} onNavigate={handleNavigate} />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialTab={modalTab}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  )
}

/**
 * Main app wrapper with toast provider
 */
export default function RaspouGanhou() {
  return (
    <ToastProvider>
      <RaspouGanhouApp />
      <ToastContainer />
    </ToastProvider>
  )
}
