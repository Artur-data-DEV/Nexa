"use client"

import { useAuth } from "@/presentation/contexts/auth-provider"
import CreatorDashboard from "@/presentation/components/dashboard/creator-dashboard"
import BrandDashboard from "@/presentation/components/dashboard/brand-dashboard"
import { Skeleton } from "@/presentation/components/ui/skeleton"

export default function DashboardPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex flex-col gap-8 p-8">
        <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
        </div>
      </div>
    )
  }

  if (user?.role === "brand") {
    return <BrandDashboard />
  }

  return <CreatorDashboard />
}
