"use client"

import { redirect } from "next/navigation"
import { useAuth } from "@/presentation/contexts/auth-provider"
import FinancialView from "@/presentation/components/creator/financial/financial-view"
import BrandTransactionsView from "@/presentation/components/brand/financial/brand-transactions"

export default function FinancialPage() {
  const { user } = useAuth()

  if (!user) {
    redirect("/auth")
  }

  if (user.role === "brand") {
    return <BrandTransactionsView />
  }

  if (user.role === "creator") {
    return <FinancialView />
  }

  redirect("/dashboard")
}

