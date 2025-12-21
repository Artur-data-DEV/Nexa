"use client"

import { useEffect, useMemo, useState } from "react"
import { ListCampaignsUseCase } from "@/application/use-cases/list-campaigns.use-case"
import { ApiCampaignRepository } from "@/infrastructure/repositories/campaign-repository"
import { api } from "@/infrastructure/api/axios-adapter"
import { Campaign } from "@/domain/entities/campaign"
import { CampaignCard } from "@/presentation/components/campaigns/campaign-card"
import { Skeleton } from "@/presentation/components/ui/skeleton"
import { Input } from "@/presentation/components/ui/input"
import { Search } from "lucide-react"
import { useAuth } from "@/presentation/contexts/auth-provider"
import { Button } from "@/presentation/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/presentation/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card"

// DI
const campaignRepository = new ApiCampaignRepository(api)
const listCampaignsUseCase = new ListCampaignsUseCase(campaignRepository)

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | Campaign["status"]>("all")
  const [sortBy, setSortBy] = useState<"recent" | "applications" | "budget_high" | "deadline_asc">("recent")
  const { user } = useAuth()

  useEffect(() => {
    fetchCampaigns()
  }, [user?.id, user?.role])

  const fetchCampaigns = async () => {
    setLoading(true)
    try {
      const filters: Record<string, any> = {}
      if (user?.role === "brand" && user?.id) {
        filters.brand_id = user.id
      }
      const data = await listCampaignsUseCase.execute(filters)
      setCampaigns(data)
    } catch (error) {
      console.error("Failed to fetch campaigns", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCampaigns = useMemo(() => {
    const base = Array.isArray(campaigns) ? campaigns : []
    const byRole = user?.role === "brand" && user?.id ? base.filter(c => (c.brand_id ?? c.brand?.id) === user.id) : base
    const byStatus = statusFilter === "all" ? byRole : byRole.filter(c => c.status === statusFilter)
    const bySearch = byStatus.filter(c =>
      (c.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.description || "").toLowerCase().includes(search.toLowerCase())
    )
    const sorted = [...bySearch].sort((a, b) => {
      if (sortBy === "recent") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      if (sortBy === "applications") {
        return (b.applications_count || 0) - (a.applications_count || 0)
      }
      if (sortBy === "budget_high") {
        return (b.budget || 0) - (a.budget || 0)
      }
      if (sortBy === "deadline_asc") {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      }
      return 0
    })
    return sorted
  }, [campaigns, user?.role, user?.id, statusFilter, search, sortBy])

  const stats = useMemo(() => {
    const list = filteredCampaigns
    const total = list.length
    const approved = list.filter(c => c.status === "approved").length
    const pending = list.filter(c => c.status === "pending").length
    const archived = list.filter(c => c.status === "archived").length
    const applications = list.reduce((sum, c) => sum + (c.applications_count || 0), 0)
    return { total, approved, pending, archived, applications }
  }, [filteredCampaigns])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {user?.role === "brand" ? "Minhas Campanhas" : "Campanhas"}
        </h1>
        {user?.role === "brand" ? (
          <p className="text-muted-foreground">
            Gerencie suas campanhas, acompanhe aplicações e otimize resultados.
          </p>
        ) : (
          <p className="text-muted-foreground">
            Encontre as melhores oportunidades para o seu perfil.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex w-full items-center gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar campanhas..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-52">
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger>
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais recentes</SelectItem>
                <SelectItem value="applications">Mais candidaturas</SelectItem>
                <SelectItem value="budget_high">Maior orçamento</SelectItem>
                <SelectItem value="deadline_asc">Prazo mais próximo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {user?.role === "brand" && (
            <Button className="ml-auto" asChild>
              <a href="/dashboard/campaigns/create">Nova Campanha</a>
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
          >
            Todas
          </Button>
          <Button
            variant={statusFilter === "approved" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("approved")}
          >
            Aprovadas
          </Button>
          <Button
            variant={statusFilter === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("pending")}
          >
            Pendentes
          </Button>
          <Button
            variant={statusFilter === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("active")}
          >
            Ativas
          </Button>
          <Button
            variant={statusFilter === "rejected" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("rejected")}
          >
            Rejeitadas
          </Button>
          <Button
            variant={statusFilter === "archived" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("archived")}
          >
            Arquivadas
          </Button>
        </div>
      </div>

      {user?.role === "brand" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total de Campanhas</CardTitle>
            </CardHeader>
            <CardContent className="pt-2 text-2xl font-bold">{stats.total}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Aprovadas</CardTitle>
            </CardHeader>
            <CardContent className="pt-2 text-2xl font-bold">{stats.approved}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Pendentes</CardTitle>
            </CardHeader>
            <CardContent className="pt-2 text-2xl font-bold">{stats.pending}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total de Candidaturas</CardTitle>
            </CardHeader>
            <CardContent className="pt-2 text-2xl font-bold">{stats.applications}</CardContent>
          </Card>
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
             <div key={i} className="flex flex-col space-y-3">
                <Skeleton className="h-[125px] w-full rounded-xl" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
             </div>
          ))}
        </div>
      ) : (
        <>
          {filteredCampaigns.length === 0 ? (
            <div className="flex items-center justify-center rounded-lg border p-10 text-center">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Nenhuma campanha encontrada</h3>
                <p className="text-sm text-muted-foreground">
                  Ajuste os filtros ou refine sua busca.
                </p>
                {user?.role === "brand" && (
                  <Button className="mt-2" asChild>
                    <a href="/dashboard/campaigns/create">Criar nova campanha</a>
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
              {filteredCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
