import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ToastProvider } from "@/contexts/toast-context"
import { AuthProvider } from "@/contexts/auth-context"

// Configuração da fonte Inter do Google Fonts
const inter = Inter({ subsets: ["latin"] })

/**
 * Configuração completa de SEO e metadados para o site
 * CRÍTICO: Estes metadados são fundamentais para o posicionamento no Google
 * e compartilhamento em redes sociais
 */
export const metadata: Metadata = {
  // SEO básico - título e descrição aparecem nos resultados do Google
  title: "Raspou Ganhou - Raspadinhas Online",
  description: "Jogue raspadinhas online e ganhe prêmios incríveis! PIX na conta, eletrônicos, veículos e muito mais.",

  // Palavras-chave para SEO (menos importante hoje, mas ainda útil)
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

  // Informações de autoria
  authors: [{ name: "Raspou Ganhou" }],
  creator: "Raspou Ganhou",
  publisher: "Raspou Ganhou",

  // Desabilita detecção automática de telefones/emails (evita links indesejados)
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  // IMPORTANTE: Alterar para o domínio real em produção
  metadataBase: new URL("https://raspouganhou.com"),
  alternates: {
    canonical: "/", // URL canônica para evitar conteúdo duplicado
  },

  // Open Graph para Facebook, LinkedIn, WhatsApp
  openGraph: {
    title: "Raspou Ganhou - Raspadinhas Online",
    description:
      "Jogue raspadinhas online e ganhe prêmios incríveis! PIX na conta, eletrônicos, veículos e muito mais.",
    url: "https://raspouganhou.com",
    siteName: "Raspou Ganhou",
    images: [
      {
        // PENDENTE: Criar imagem og-image.jpg (1200x630px)
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Raspou Ganhou - Raspadinhas Online",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },

  // Twitter Cards para melhor compartilhamento no Twitter/X
  twitter: {
    card: "summary_large_image",
    title: "Raspou Ganhou - Raspadinhas Online",
    description:
      "Jogue raspadinhas online e ganhe prêmios incríveis! PIX na conta, eletrônicos, veículos e muito mais.",
    images: ["/images/og-image.png"], // PENDENTE: Criar imagem
    creator: "@raspouganhou", // Alterar para handle real do Twitter
  },

  // Configurações para robôs de busca
  robots: {
    index: true, // Permite indexação
    follow: true, // Permite seguir links
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Códigos de verificação dos motores de busca
  // PENDENTE: Adicionar códigos reais após configurar Google Search Console
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
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Favicons e ícones para diferentes dispositivos */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        {/* Configurações para PWA (Progressive Web App) */}
        <meta name="theme-color" content="#22c55e" /> {/* Verde da marca */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Raspou Ganhou" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* Configurações para Windows/Edge */}
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        {/* 
          Structured Data (JSON-LD) para Google
          CRÍTICO: Ajuda o Google a entender melhor o site
          Melhora a aparição em resultados de busca
        */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Raspou Ganhou",
              description: "A maior plataforma de raspadinhas online do Brasil",
              url: "https://raspouganhou.com",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://raspouganhou.com/search?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
              // PENDENTE: Adicionar links reais das redes sociais
              sameAs: [
                "https://www.facebook.com/raspouganhou",
                "https://www.instagram.com/raspouganhou",
                "https://twitter.com/raspouganhou",
              ],
            }),
          }}
        />
      </head>
      <body className={inter.className}>
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
