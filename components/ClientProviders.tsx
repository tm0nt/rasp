"use client"

import { ToastProvider } from "@/contexts/toast-context"
import { ToastContainer } from "@/components/ui/toast"

export function ClientProviders({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ToastProvider>
      {children}
      <ToastContainer />
    </ToastProvider>
  )
}