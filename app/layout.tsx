import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/Providers"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { ClientProviders } from "@/components/ClientProviders" // Adjust the path to where you place ClientProviders

// Configuração da fonte Inter do Google Fonts
const inter = Inter({ subsets: ["latin"] })

/**
 * Configuração completa de SEO e metadados para o site
 * CRÍTICO: Estes metadados são fundamentais para o posicionamento no Google
 * e compartilhamento em redes sociais
 */
export const metadata: Metadata = {
  title: "Raspou Ganhou - Raspadinhas Online",
  description: "Jogue raspadinhas online e ganhe prêmios incríveis! PIX na conta, eletrônicos, veículos e muito mais.",
  keywords: [
    "raspadinha",
    "jogos online",
    "prêmios",
    "PIX",
    "dinheiro",
    "sorte",
    "ganhar dinheiro",
    "jogos de azar",
    "loteria",
    "Brasil",
    "eletrônicos",
    "veículos",
    "cosméticos",
  ],
  authors: [{ name: "Raspou Ganhou" }],
  creator: "Raspou Ganhou",
  publisher: "Raspou Ganhou",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://raspouganhou.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Raspou Ganhou - Raspadinhas Online",
    description:
      "Jogue raspadinhas online e ganhe prêmios incríveis! PIX na conta, eletrônicos, veículos e muito mais.",
    url: "https://raspouganhou.com",
    siteName: "Raspou Ganhou",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Raspou Ganhou - Raspadinhas Online",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Raspou Ganhou - Raspadinhas Online",
    description:
      "Jogue raspadinhas online e ganhe prêmios incríveis! PIX na conta, eletrônicos, veículos e muito mais.",
    images: ["/images/og-image.png"],
    creator: "@raspouganhou",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
  category: "entertainment",
  generator: 'v0.dev'
}

/**
 * Layout raiz da aplicação Next.js
 * Este componente envolve todas as páginas do site
 *
 * @param children - Conteúdo das páginas que serão renderizadas
 */
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions); // Obtém a sessão no server-side

  return (
    <html lang="pt-BR">
      <head><link rel="icon" href="/favicon.ico" sizes="any"/><link rel="icon" href="/icon.svg" type="image/svg+xml"/><link rel="apple-touch-icon" href="/apple-touch-icon.png"/><link rel="manifest" href="/manifest.json"/><meta name="theme-color" content="#22c55e"/><meta name="apple-mobile-web-app-capable" content="yes"/><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/><meta name="apple-mobile-web-app-title" content="Raspou Ganhou"/><meta name="mobile-web-app-capable" content="yes"/><meta name="msapplication-TileColor" content="#000000"/><meta name="msapplication-config" content="/browserconfig.xml"/><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebSite", name: "Raspou Ganhou", description: "A maior plataforma de raspadinhas online do Brasil", url: "https://raspouganhou.com", potentialAction: { "@type": "SearchAction", target: "https://raspouganhou.com/search?q={search_term_string}", "query-input": "required name=search_term_string" }, sameAs: [ "https://www.facebook.com/raspouganhou", "https://www.instagram.com/raspouganhou", "https://twitter.com/raspouganhou" ] }) }}/></head>
      <body className={inter.className}>
        <Providers session={session}>
          <ClientProviders>
            {children}
          </ClientProviders>
        </Providers>
      </body>
    </html>
  )
}