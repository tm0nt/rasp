"use client"

import { useState } from "react"
import { AdminSidebar } from "./admin-sidebar"
import { AdminHeader } from "./admin-header"
import { DashboardOverview } from "./dashboard-overview"
import { UsersTable } from "./users-table"
import { TransactionsTable } from "./transactions-table"
import { BonusesPage } from "./bonuses-page"
import { AffiliatesPage } from "./affiliates-page"
import { GeneralSettings } from "./general-settings"

type AdminPage = "dashboard" | "users" | "transactions" | "bonuses" | "affiliates" | "gateway" | "settings"

interface AdminDashboardProps {
  admin: {
    id: string
    name: string
    email: string
    role: string
  }
  onLogout: () => void
}

/**
 * Dashboard principal da administração
 */
export function AdminDashboard({ admin, onLogout }: AdminDashboardProps) {
  const [currentPage, setCurrentPage] = useState<AdminPage>("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardOverview />
      case "users":
        return <UsersTable />
      case "transactions":
        return <TransactionsTable />
      case "bonuses":
        return <BonusesPage />
      case "affiliates":
        return <AffiliatesPage />
      case "settings":
        return <GeneralSettings />
      default:
        return <DashboardOverview />
    }
  }

  return (
    <div className="min-h-screen bg-black flex">
      {/* Sidebar */}
      <AdminSidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <AdminHeader admin={admin} onLogout={onLogout} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-gray-900 p-6">{renderCurrentPage()}</main>
      </div>
    </div>
  )
}
