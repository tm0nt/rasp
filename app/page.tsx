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

export function RaspouGanhouApp() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTab, setModalTab] = useState<"login" | "register">("login")
  const [isLoaded, setIsLoaded] = useState(false)
  const [rtp, setRtp] = useState<number>(85) // Inicializa com 85 e será sobrescrito pela API
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [purchaseLoading, setPurchaseLoading] = useState<number | null>(null)
  
  const categories = [
    {
      id: 1,
      title: "PIX na conta",
      subtitle: "PRÊMIOS ATÉ R$ 2000,00",
      description: "Raspe e receba prêmios em DINHEIRO $$$ até R$2.000 diretamente no seu PIX",
      price: "R$ 0,50",
      image: "/images/money.png",
      isActive: true
    },
    {
      id: 2,
      title: "Sonho de Consumo 😍",
      subtitle: "PRÊMIOS ATÉ R$ 8000,00",
      description: "Celular, eletrônicos e componentes, receba prêmios exclusivos de alto valor agregado",
      price: "R$ 2,00",
      image: "/images/tech-products.png",
      isActive: true
    },
    {
      id: 3,
      title: "Me mimei",
      subtitle: "PRÊMIOS ATÉ R$ 800,00",
      description: "Shopee, shein, presentinhos... Quer se mimar mas tá muito caro? Não se preocupe, é só dar sorte aqui!",
      price: "R$ 2,50",
      image: "/images/luxury-items.png",
      isActive: true
    },
    {
      id: 4,
      title: "Super Prêmios",
      subtitle: "PRÊMIOS ATÉ R$ 12000,00",
      description: "Cansado de ficar a pé? Essa sua chance de sair motorizado, prêmios de até R$12.000",
      price: "R$ 5,00",
      image: "/images/vehicles.png",
      isActive: true
    },
  ]

  const { isAuthenticated, user, login, logout, addBalance, deductBalance } = useAuth()
  const { currentPage, navigateTo, goBack } = useNavigation()
  const { showToast } = useToast()

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch("/api/config/app")
        const data = await response.json()
        const apiRtp = parseFloat(data.data?.rtp_value) || 85.0
        setRtp(apiRtp)
        console.log("RTP configurado:", apiRtp)
      } catch (error) {
        console.error("Erro ao carregar configurações:", error)
        setRtp(85.0) // Fallback
      }
    }

    setIsLoaded(true)
    loadConfig()
  }, [])

  const [activeTab, setActiveTab] = useState("destaque")
  const tabs = [
    { id: "destaque", label: "Destaque" },
    { id: "pix", label: "PIX na Conta" },
    { id: "eletronico", label: "Eletrônico" },
    { id: "veiculo", label: "Veículo" },
    { id: "cosmeticos", label: "Cosméticos" },
  ]

  const filteredCategories = categories.filter(cat => {
    switch(activeTab) {
      case "pix": return cat.id === 1
      case "eletronico": return cat.id === 2
      case "cosmeticos": return cat.id === 3
      case "veiculo": return cat.id === 4
      default: return true
    }
  })

  const openModal = (tab: "login" | "register") => {
    setModalTab(tab)
    setIsModalOpen(true)
  }

  const handleAuthSuccess = async (formData: any, isRegister: boolean) => {
    return await login(formData, isRegister)
  }

  const handleAuthRequired = () => {
    showToast({
      type: "info",
      title: "🔐 Login necessário",
      message: "Você precisa fazer login para acessar esta funcionalidade.",
      duration: 5000,
    })
    openModal("login")
  }

  const handleBuyAndPlay = async (category: typeof categories[0]) => {
    if (!isAuthenticated || !user) {
      handleAuthRequired()
      return
    }

    const price = parseFloat(category.price.replace("R$", "").trim().replace(",", "."))

    if (user.balance < price) {
      showToast({
        type: "warning",
        title: "💰 Saldo insuficiente",
        message: `Você precisa de ${category.price} para jogar. Seu saldo atual é R$${user.balance.toFixed(2)}.`,
        duration: 6000,
      })
      navigateTo("deposit")
      return
    }

    setPurchaseLoading(category.id)

    try {
      await deductBalance(price, `Game purchase - ${category.title}`)
      setSelectedCategoryId(category.id)
      
      // Usa o RTP global carregado da API
      navigateTo("scratch-game")

      showToast({
        type: "success",
        title: "🎮 Compra realizada!",
        message: `Você comprou uma raspadinha de "${category.title}" por ${category.price}. Boa sorte!`,
        duration: 5000,
      })

    } catch (error) {
      console.error("Purchase failed", error)
      showToast({
        type: "error",
        title: "❌ Erro na compra",
        message: "Ocorreu um erro ao processar sua compra. Tente novamente.",
        duration: 6000,
      })
    } finally {
      setPurchaseLoading(null)
    }
  }

  const handleNavigate = (page: string) => {
    if (!isAuthenticated && page !== "home") {
      handleAuthRequired()
      return
    }
    navigateTo(page as any)
  }

  // Render different pages based on current page
  if (currentPage === "wallet" && isAuthenticated && user) {
    return <WalletPage onNavigate={handleNavigate} onBack={goBack} user={user} onLogout={logout} />
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

  if (currentPage === "scratch-game" && isAuthenticated && user && selectedCategoryId) {
    const currentCategory = categories.find(cat => cat.id === selectedCategoryId)
    const playAgain = () => handleBuyAndPlay(currentCategory!)

    switch(selectedCategoryId) {
      case 1:
        return (
          <ScratchGamePage
            onBack={goBack}
            user={user}
            onLogout={logout}
            onNavigate={handleNavigate}
            categoryId={selectedCategoryId}
            rtp={rtp} // Passa o RTP dinâmico
          />
        )
      case 2:
        return (
          <ElectronicsScratchGamePage
            onBack={goBack}
            user={user}
            onLogout={logout}
            onNavigate={handleNavigate}
            categoryId={selectedCategoryId}
            rtp={rtp} // Passa o RTP dinâmico
          />
        )
      case 3:
        return (
          <CosmeticsScratchGamePage
            onBack={goBack}
            user={user}
            onLogout={logout}
            onNavigate={handleNavigate}
            categoryId={selectedCategoryId}
            rtp={rtp} // Passa o RTP dinâmico
          />
        )
      case 4:
        return (
          <VehiclesScratchGamePage
            onBack={goBack}
            user={user}
            onLogout={logout}
            onNavigate={handleNavigate}
            categoryId={selectedCategoryId}
            rtp={rtp} // Passa o RTP dinâmico
          />
        )
      default:
        return null
    }
  }

  // Default home page
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <header className="bg-black border-b border-gray-800 sticky top-0 z-40 backdrop-blur-md bg-black/95">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center group">
              <Image
                src="/images/logo.png"
                alt="Raspou Ganhou"
                width={150}
                height={20}
                className="transition-transform duration-300 group-hover:scale-105"
                priority
              />
            </div>
          </div>

          {isAuthenticated && user ? (
            <LoggedInHeader user={user} onLogout={logout} onNavigate={handleNavigate} />
          ) : (
            <GuestHeader onOpenModal={openModal} />
          )}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4">
        <section className="relative overflow-hidden py-2">
          <HeroCarousel />
        </section>

        <LatestWinners />

        <nav className="py-4">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map(tab => (
              <Button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 whitespace-nowrap text-sm ${
                  activeTab === tab.id
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : "bg-transparent text-gray-300 hover:text-white border border-gray-600"
                }`}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </nav>

        <section className="pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredCategories.map(category => (
              <div key={category.id} className="space-y-3 group">
                <div className="relative h-48 rounded-lg overflow-hidden transition-all duration-500 group-hover:shadow-lg group-hover:shadow-green-500/20">
                  <Image
                    src={category.image}
                    alt={category.title}
                    fill
                    className="object-contain transition-transform duration-700 group-hover:scale-110"
                  />
                  <Badge className="absolute top-3 right-3 bg-green-500 text-white font-bold text-lg px-3 py-1">
                    {category.price}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">
                    {category.title}
                  </h3>
                  <p className="text-orange-400 font-semibold text-sm">
                    {category.subtitle}
                  </p>
                  <p className="text-gray-300 text-sm line-clamp-3">
                    {category.description}
                  </p>
                </div>

                <Button
                  onClick={() => handleBuyAndPlay(category)}
                  disabled={purchaseLoading === category.id}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3"
                >
                  {purchaseLoading === category.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Processando...
                    </>
                  ) : (
                    <>
                      Jogar por {category.price}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </section>
      </div>

      <MobileNav isAuthenticated={isAuthenticated} onAuthRequired={handleAuthRequired} onNavigate={handleNavigate} />

      <AuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialTab={modalTab}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  )
}

export default function RaspouGanhou() {
  return (
    <ToastProvider>
      <RaspouGanhouApp />
      <ToastContainer />
    </ToastProvider>
  )
}