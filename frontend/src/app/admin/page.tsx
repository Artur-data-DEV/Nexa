"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card"
import { Button } from "@/presentation/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/presentation/components/ui/avatar"
import { Badge } from "@/presentation/components/ui/badge"
import { Skeleton } from "@/presentation/components/ui/skeleton"
import {
  Clock,
  Users,
  ClipboardList,
  Loader2,
  CheckCircle,
  XCircle,
  TrendingUp,
  FileText,
  ArrowRight
} from "lucide-react"
import { api } from "@/infrastructure/api/axios-adapter"
import { toast } from "sonner"

interface DashboardMetrics {
  pendingCampaignsCount: number
  allActiveCampaignCount: number
  allRejectCampaignCount: number
  allUserCount: number
  pendingWithdrawalsCount?: number
  pendingStudentVerificationsCount?: number
}

interface PendingCampaign {
  id: number
  title: string
  brand: string
  type: string
  budget?: number
  value?: number
}

interface RecentUser {
  id: number
  name: string
  email?: string
  role: string
  avatar?: string
  tag?: string
  registeredDaysAgo?: number
  created_at?: string
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [pendingCampaigns, setPendingCampaigns] = useState<PendingCampaign[]>([])
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingCampaigns, setLoadingCampaigns] = useState<number[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      interface MetricsResponse {
        success?: boolean
        data?: DashboardMetrics
        pendingCampaignsCount?: number
        allActiveCampaignCount?: number
        allRejectCampaignCount?: number
        allUserCount?: number
      }

      interface AdminCampaignListItem {
        id: number
        title: string
        campaign_type?: string
        budget?: number | string | null
        brand?: {
          name?: string
          company_name?: string
        }
      }

      interface AdminCampaignsResponse {
        success?: boolean
        data?: AdminCampaignListItem[]
      }

      interface PendingCampaignWidgetResponse {
        success?: boolean
        data?: PendingCampaign[]
        campaigns?: PendingCampaign[]
      }

      interface UsersResponse {
        success?: boolean
        data?: RecentUser[]
        users?: RecentUser[]
      }

      // Fetch all data in parallel
      const [metricsRes, campaignsRes, usersRes] = await Promise.all([
        api.get<MetricsResponse>("/admin/dashboard-metrics").catch(() => ({}) as MetricsResponse),
        api.get<AdminCampaignsResponse>("/admin/campaigns", { params: { status: "pending", per_page: 5 } }).catch(() => ({ data: [] }) as AdminCampaignsResponse),
        api.get<UsersResponse>("/admin/recent-users", { params: { limit: 5 } }).catch(() => ({ data: [] }) as UsersResponse),
      ])

      const metricsData = metricsRes.data ?? metricsRes
      setMetrics({
        pendingCampaignsCount: metricsData?.pendingCampaignsCount ?? 0,
        allActiveCampaignCount: metricsData?.allActiveCampaignCount ?? 0,
        allRejectCampaignCount: metricsData?.allRejectCampaignCount ?? 0,
        allUserCount: metricsData?.allUserCount ?? 0
      })

      let campaignsData: PendingCampaign[] = Array.isArray(campaignsRes.data)
        ? campaignsRes.data.map((campaign) => ({
          id: campaign.id,
          title: campaign.title,
          brand: campaign.brand?.company_name || campaign.brand?.name || "Marca desconhecida",
          type: campaign.campaign_type || "Geral",
          budget: Number(campaign.budget ?? 0) || 0,
        }))
        : []

      // Fallback to dashboard widget endpoint when list endpoint returns empty
      // but metrics indicate pending campaigns exist.
      if (campaignsData.length === 0 && (metricsData?.pendingCampaignsCount ?? 0) > 0) {
        const fallbackRes = await api.get<PendingCampaignWidgetResponse>("/admin/pending-campaigns", { params: { limit: 5 } }).catch(() => ({ data: [] }) as PendingCampaignWidgetResponse)
        const fallbackData = Array.isArray(fallbackRes.data)
          ? fallbackRes.data
          : Array.isArray(fallbackRes.campaigns)
            ? fallbackRes.campaigns
            : []
        campaignsData = fallbackData
      }

      setPendingCampaigns(
        Array.isArray(campaignsData)
          ? campaignsData.slice(0, 5).map((campaign: PendingCampaign) => ({
            ...campaign,
            budget: Number(campaign.budget ?? campaign.value ?? 0) || 0,
          }))
          : []
      )

      const usersData = Array.isArray(usersRes.data)
        ? usersRes.data
        : Array.isArray(usersRes.users)
          ? usersRes.users
          : []
      setRecentUsers(Array.isArray(usersData) ? usersData.slice(0, 5).map((user: RecentUser) => ({
        ...user,
        registeredDaysAgo:
          typeof user.registeredDaysAgo === 'number'
            ? user.registeredDaysAgo
            : user.created_at
              ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
              : 0
      })) : [])
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      toast.error("Falha ao carregar dados do painel")
    } finally {
      setLoading(false)
    }
  }


  const handleCampaignAction = async (campaignId: number, action: 'approve' | 'reject') => {
    try {
      setLoadingCampaigns(prev => [...prev, campaignId])

      if (action === 'approve') {
        await api.patch(`/admin/campaigns/${campaignId}/approve`)
        toast.success("Campanha aprovada com sucesso")
      } else {
        await api.patch(`/admin/campaigns/${campaignId}/reject`)
        toast.success("Campanha rejeitada com sucesso")
      }

      // Refresh data
      fetchDashboardData()
    } catch (error) {
      console.error(`Failed to ${action} campaign:`, error)
      toast.error(`Falha ao ${action === 'approve' ? 'aprovar' : 'rejeitar'} campanha`)
    } finally {
      setLoadingCampaigns(prev => prev.filter(id => id !== campaignId))
    }
  }

  const getBadgeColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'brand':
      case 'marca':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300'
      case 'creator':
      case 'criador':
        return 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-300'
      case 'admin':
        return 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300'
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-900/40 dark:text-gray-300'
    }
  }

  const formatRole = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'brand': return 'Marca'
      case 'creator': return 'Criador'
      case 'admin': return 'Admin'
      default: return role
    }
  }

  const stats = [
    {
      icon: <ClipboardList className="w-full h-full text-[#F72585] bg-pink-100 dark:bg-pink-900/40 rounded-full p-3" />,
      label: "Campanhas Pendentes",
      value: metrics?.pendingCampaignsCount || 0,
      href: "/admin/campaigns/pending"
    },
    {
      icon: <FileText className="w-full h-full text-blue-500 bg-blue-100 dark:bg-blue-900/40 rounded-full p-3" />,
      label: "Campanhas Ativas",
      value: metrics?.allActiveCampaignCount || 0,
      href: "/admin/campaigns"
    },
    {
      icon: <Users className="w-full h-full text-green-600 bg-green-100 dark:bg-green-900/40 rounded-full p-3" />,
      label: "Total de Usuários",
      value: metrics?.allUserCount || 0,
      href: "/admin/users"
    },
    {
      icon: <TrendingUp className="w-full h-full text-purple-500 bg-purple-100 dark:bg-purple-900/40 rounded-full p-3" />,
      label: "Campanhas Rejeitadas",
      value: metrics?.allRejectCampaignCount || 0,
      href: "/admin/campaigns"
    },
  ]

  return (
    <div className="flex flex-col gap-6 max-w-full mx-auto">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Painel do Administrador</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie campanhas, usuários e regras da plataforma</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="flex items-center justify-center gap-4 py-6 px-2 bg-background hover:shadow-md transition-shadow cursor-pointer">
              <div className="mb-2 w-12 h-12 flex items-center justify-center">{stat.icon}</div>
              <div className="flex flex-col">
                <div className="text-sm text-muted-foreground mb-1 text-center">{stat.label}</div>
                <div className="text-2xl font-bold text-foreground flex items-center justify-center">
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : stat.value.toLocaleString()}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Recent Campaigns */}
        <Card className="bg-background">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Campanhas Pendentes Recentes</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/campaigns/pending" className="text-pink-500 hover:text-pink-600">
                Ver todas <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : pendingCampaigns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p className="font-medium">Tudo em dia!</p>
                <p className="text-sm">Nenhuma campanha pendente de aprovação.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {pendingCampaigns.map((campaign) => (
                  <div key={campaign.id} className="flex flex-col sm:flex-row sm:items-center justify-between border rounded-lg px-4 py-3 bg-muted/40 dark:bg-muted/20">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">{campaign.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {campaign.brand} • {campaign.type} • R$ {(campaign.budget ?? 0).toLocaleString('pt-BR')}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 sm:mt-0 sm:ml-4">
                      <Button
                        className="bg-[#F72585] hover:bg-pink-600 text-white"
                        size="sm"
                        onClick={() => handleCampaignAction(campaign.id, 'approve')}
                        disabled={loadingCampaigns.includes(campaign.id)}
                      >
                        {loadingCampaigns.includes(campaign.id) ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Aprovar'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        className="text-muted-foreground border-muted-foreground/30"
                        size="sm"
                        onClick={() => handleCampaignAction(campaign.id, 'reject')}
                        disabled={loadingCampaigns.includes(campaign.id)}
                      >
                        {loadingCampaigns.includes(campaign.id) ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Rejeitar'
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Recent Users */}
        <Card className="bg-background">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Usuários Recentes</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/users" className="text-pink-500 hover:text-pink-600">
                Ver todos <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : recentUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="font-medium">Nenhum usuário recente</p>
                <p className="text-sm">Novos usuários aparecerão aqui.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {recentUsers.map((user) => (
                  <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between border rounded-lg px-4 py-3 bg-muted/40 dark:bg-muted/20">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-medium text-foreground text-sm truncate">{user.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {user.email ? `${user.email} • ` : ''}Registrado há {user.registeredDaysAgo} {user.registeredDaysAgo === 1 ? 'dia' : 'dias'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center mt-3 sm:mt-0 sm:ml-4">
                      <Badge className={getBadgeColor(user.role)}>
                        {formatRole(user.role)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <Link href="/admin/campaigns/pending">
                <ClipboardList className="h-6 w-6 text-pink-500" />
                <span>Aprovar Campanhas</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <Link href="/admin/withdrawals/verification">
                <Clock className="h-6 w-6 text-blue-500" />
                <span>Verificar Saques</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <Link href="/admin/users">
                <Users className="h-6 w-6 text-green-500" />
                <span>Gerenciar Usuários</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <Link href="/admin/students/verification">
                <XCircle className="h-6 w-6 text-purple-500" />
                <span>Verificar Alunos</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
