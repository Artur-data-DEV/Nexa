"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle2, XCircle, ArrowLeft, Filter } from "lucide-react"

import { AuthGuard } from "@/presentation/components/auth/auth-guard"
import { useAuth } from "@/presentation/contexts/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card"
import { Button } from "@/presentation/components/ui/button"
import { Badge } from "@/presentation/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/presentation/components/ui/alert"
import { Skeleton } from "@/presentation/components/ui/skeleton"

import { ApiCampaignRepository } from "@/infrastructure/repositories/campaign-repository"
import { api } from "@/infrastructure/api/axios-adapter"
import { Campaign } from "@/domain/entities/campaign"
import { ListPendingCampaignsUseCase } from "@/application/use-cases/list-pending-campaigns.use-case"
import type { AxiosError } from "axios"

const campaignRepository = new ApiCampaignRepository(api)
const listPendingCampaignsUseCase = new ListPendingCampaignsUseCase(campaignRepository)

function AdminOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/dashboard")
    }
  }, [loading, user, router])

  if (loading) {
    return null
  }

  if (!user || user.role !== "admin") {
    return null
  }

  return <>{children}</>
}

export default function AdminPendingCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    const loadPendingCampaigns = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await listPendingCampaignsUseCase.execute()
        setCampaigns(data)
      } catch (err: unknown) {
        const axiosError = err as AxiosError<{ message?: string; error?: string }>
        const message =
          axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          axiosError.message ||
          "Não foi possível carregar as campanhas pendentes."
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    loadPendingCampaigns()
  }, [])

  const handleApprove = async (id: number) => {
    setProcessingId(id)
    setError(null)
    try {
      await api.patch(`/campaigns/${id}/approve`)
      setCampaigns(prev => prev.filter(campaign => campaign.id !== id))
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string; error?: string }>
      const message =
        axiosError.response?.data?.message ||
        axiosError.response?.data?.error ||
        axiosError.message ||
        "Erro ao aprovar campanha."
      setError(message)
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (id: number) => {
    setProcessingId(id)
    setError(null)
    try {
      await api.patch(`/campaigns/${id}/reject`, { rejection_reason: null })
      setCampaigns(prev => prev.filter(campaign => campaign.id !== id))
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string; error?: string }>
      const message =
        axiosError.response?.data?.message ||
        axiosError.response?.data?.error ||
        axiosError.message ||
        "Erro ao rejeitar campanha."
      setError(message)
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <AuthGuard>
      <AdminOnly>
        <main className="min-h-screen bg-background px-4 py-8">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                  Campanhas
                </div>
                <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Campanhas Pendentes
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Aprove ou rejeite campanhas submetidas por marcas antes de ficarem visíveis
                  para criadores.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" onClick={() => router.push("/admin")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para painel admin
                </Button>
                <Button variant="outline" disabled>
                  <Filter className="mr-2 h-4 w-4" />
                  Filtros em breve
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2, 3, 4].map(key => (
                  <Card key={key}>
                    <CardHeader>
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="mt-2 h-6 w-56" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-8 w-24" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : campaigns.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <p className="text-sm text-muted-foreground">
                    Não há campanhas pendentes para aprovação neste momento.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {campaigns.map(campaign => (
                  <Card key={campaign.id} className="flex flex-col justify-between">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Badge variant="outline" className="mb-2">
                            Pendente
                          </Badge>
                          <CardTitle className="text-lg">{campaign.title}</CardTitle>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {campaign.brand?.name || "Marca desconhecida"}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(campaign.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {campaign.description}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <div className="space-y-1">
                          <div className="text-muted-foreground">
                            Orçamento{" "}
                            <span className="font-semibold text-foreground">
                              {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(campaign.budget)}
                            </span>
                          </div>
                          {campaign.category && (
                            <div className="text-muted-foreground">
                              Categoria{" "}
                              <span className="font-medium text-foreground">
                                {campaign.category}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                          >
                            <Link href={`/dashboard/campaigns/${campaign.id}`}>
                              Ver detalhes
                            </Link>
                          </Button>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={processingId === campaign.id}
                              onClick={() => handleReject(campaign.id)}
                            >
                              <XCircle className="mr-1 h-4 w-4 text-red-500" />
                              Rejeitar
                            </Button>
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              disabled={processingId === campaign.id}
                              onClick={() => handleApprove(campaign.id)}
                            >
                              <CheckCircle2 className="mr-1 h-4 w-4" />
                              Aprovar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </AdminOnly>
    </AuthGuard>
  )
}

