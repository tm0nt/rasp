"use client"

import type React from "react"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LoggedInHeader } from "@/components/header/logged-in-header"
import { MobileNav } from "@/components/navigation/mobile-nav"
import { useAuth } from "@/hooks/useAuth"
import { useNavigation } from "@/hooks/useNavigation"

interface PageLayoutProps {
  title: string
  subtitle?: string
  showBackButton?: boolean
  onBack?: () => void
  children: React.ReactNode
  user?: {
    id: string
    name: string
    email: string
    phone: string
    avatar?: string
    balance: number
  }
  onLogout?: () => void
  onNavigate?: (page: string) => void
}

/**
 * Common layout for all internal dashboard pages
 * 
 * Features:
 * - Fixed header with logo and navigation
 * - Breadcrumb with back button
 * - Consistent spacing
 * - Standardized footer
 * - Integrated mobile navigation
 * - Authentication handling
 *
 * Structure:
 * - Main header (if user logged in)
 * - Page header with title/subtitle
 * - Main content
 * - Mobile navigation footer
 */
export function PageLayout({
  title,
  subtitle,
  showBackButton,
  onBack,
  children,
  user,
  onLogout,
  onNavigate,
}: PageLayoutProps) {
  const { isAuthenticated } = useAuth()
  const { navigateTo } = useNavigation()

  const handleAuthRequired = () => {
    // Default behavior when auth is required
    if (onNavigate) {
      onNavigate("home")
    }
  }

  const handleNavigate = (page: string) => {
    if (onNavigate) {
      onNavigate(page)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white pb-16 md:pb-0">
      {/* MAIN HEADER - Only shown if user is logged in */}
      {user && onLogout && onNavigate && (
        <header className="bg-black border-b border-gray-800 fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/95">
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
            </div>
            <LoggedInHeader user={user} onLogout={onLogout} onNavigate={onNavigate} />
          </div>
        </header>
      )}

      {/* PAGE HEADER - Title, subtitle and navigation */}
      <header
        className={`bg-black border-b border-gray-800 sticky z-40 backdrop-blur-md bg-black/95 ${
          user ? "top-[73px]" : "top-0" // Adjust position based on main header
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 py-2">
          <div className="flex items-center gap-4">
            {/* Back button */}
            {showBackButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="text-white hover:text-gray-300 hover:bg-white/10"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}

            {/* Title and subtitle */}
            <div>
              <h1 className="text-2xl font-bold text-white">{title}</h1>
              {subtitle && <p className="text-gray-400 text-sm mt-1">{subtitle}</p>}
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main
        className={`max-w-6xl mx-auto px-4 pb-6 ${
          user ? "pt-[100px]" : "pt-10" // Spacing to account for fixed headers
        }`}
      >
        {children}
      </main>

      {/* MOBILE NAVIGATION - Only shown on mobile devices */}
      <MobileNav 
        isAuthenticated={isAuthenticated} 
        onAuthRequired={handleAuthRequired}
        onNavigate={handleNavigate}
      />
    </div>
  )
}