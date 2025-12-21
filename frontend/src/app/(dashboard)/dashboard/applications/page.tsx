"use client"

import MyApplicationsList from "@/presentation/components/dashboard/my-applications-list"

export default function ApplicationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Minhas Aplicações</h1>
        <p className="text-muted-foreground">
          Acompanhe o status das campanhas em que você se candidatou.
        </p>
      </div>

      <MyApplicationsList />
    </div>
  )
}

