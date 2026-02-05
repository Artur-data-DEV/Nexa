"use client"

import { redirect } from "next/navigation"
import { useAuth } from "@/presentation/contexts/auth-provider"
import TransactionHistory from "@/presentation/components/financial/transaction-history"

export default function TransactionHistoryPage() {
  const { user } = useAuth()

  if (!user) {
    redirect("/auth")
  }

  // If user is a brand, they might want to see BrandTransactionsView which is at /dashboard/financial
  // But if they specifically navigated here, maybe we should show this?
  // For now, let's just show the TransactionHistory component which seems to be for subscription payments.
  
  return (
    <div className="p-6">
      <TransactionHistory />
    </div>
  )
}
