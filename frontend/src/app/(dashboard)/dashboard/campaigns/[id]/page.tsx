"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Calendar, MapPin, DollarSign, Building2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { GetCampaignByIdUseCase } from "@/application/use-cases/get-campaign-by-id.use-case"
import { ApiCampaignRepository } from "@/infrastructure/repositories/campaign-repository"
import { api } from "@/infrastructure/api/axios-adapter"
import { Campaign } from "@/domain/entities/campaign"

import { Button } from "@/presentation/components/ui/button"
import { Badge } from "@/presentation/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/presentation/components/ui/avatar"
import { Skeleton } from "@/presentation/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card"
import { Separator } from "@/presentation/components/ui/separator"
import { ApplyButton } from "@/presentation/components/campaigns/apply-button"
import { useAuth } from "@/presentation/contexts/auth-provider"
import { Users, Download, ExternalLink } from "lucide-react"
import { toast } from "sonner"

const campaignRepository = new ApiCampaignRepository(api)
const getCampaignByIdUseCase = new GetCampaignByIdUseCase(campaignRepository)
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL?.replace('/api', '') || 'http://localhost:8000';
const resolveUrl = (url: string) => (url?.startsWith('/') ? `${BACKEND_URL}${url}` : url)

export default function CampaignDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const hasCampaignAccess = user?.role !== "creator" || user?.has_premium
  const isOwnerOrAdmin = user?.role === "admin" || (user?.role === "brand" && campaign?.brand_id === user.id)

  useEffect(() => {
    if (user?.role === "creator" && !user?.has_premium) {
        setLoading(false)
        return
    }
    if (params.id) {
        fetchCampaign(Number(params.id))
    }
  }, [params.id, user?.has_premium, user?.role])

  const fetchCampaign = async (id: number) => {
    setLoading(true)
    try {
      const data = await getCampaignByIdUseCase.execute(id)
      setCampaign(data)
    } catch (error) {
      console.error("Failed to fetch campaign", error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportXLS = async () => {
    if (!campaign) return
    
    // Using the same logic as manage page but simplified for this view if needed, 
    // or we can redirect to manage page for export. 
    // For now, let's redirect to manage page for full management features including export.
    router.push(`/dashboard/campaigns/${campaign.id}/manage`)
  }

  if (loading) {
    return (
        <div className="flex flex-col gap-6">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-50 w-full" />
            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-4">
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-40 w-full" />
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-60 w-full" />
                </div>
            </div>
        </div>
    )
  }

  if (!campaign) {
    return (
        <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
            <h2 className="text-2xl font-bold">Campanha não encontrada</h2>
            <Button variant="outline" onClick={() => router.back()}>Voltar</Button>
        </div>
    )
  }

  const rawRequirements = campaign.requirements as unknown as string[] | string | undefined

  const requirements = Array.isArray(rawRequirements)
    ? rawRequirements
    : typeof rawRequirements === "string"
      ? rawRequirements
          .split(",")
          .map((req: string) => req.trim())
          .filter(Boolean)
      : []

  if (!hasCampaignAccess) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Campanhas disponíveis no Premium</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Para acessar os detalhes e se candidatar às campanhas, é necessário ter o plano Premium ativo.
            </p>
            <Button asChild>
              <Link href="/dashboard/subscription">Assinar Premium</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-semibold">Detalhes da Campanha</h1>
      </div>

      {/* Header Image & Info */}
      <div className="relative w-full h-64 md:h-80 bg-muted rounded-xl overflow-hidden">
        {campaign.image_url ? (
             <Image 
               src={resolveUrl(campaign.image_url)} 
               alt={campaign.title} 
               fill
               className="object-cover"
             />
           ) : (
             <div className="w-full h-full bg-linear-to-r from-pink-500 to-purple-600 opacity-20" />
           )}
           <div className="absolute bottom-0 left-0 w-full bg-linear-to-t from-black/80 to-transparent p-6 pt-20">
                <div className="flex flex-col md:flex-row md:items-end gap-4 justify-between text-white">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border-4 border-background/20">
                            <AvatarImage src={campaign.brand?.avatar} />
                            <AvatarFallback>{campaign.brand?.name?.substring(0,2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold">{campaign.title}</h2>
                            <div className="flex items-center gap-2 text-white/80">
                                <Building2 className="h-4 w-4" />
                                <span>{campaign.brand?.name}</span>
                            </div>
                        </div>
                    </div>
                    <Badge variant="secondary" className="text-lg px-4 py-1">
                         {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(campaign.budget)}
                    </Badge>
                </div>
           </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Description & Briefing */}
        <div className="md:col-span-2 space-y-6">
            {/* Owner Actions Section */}
            {isOwnerOrAdmin && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Users className="h-5 w-5" />
                    Gestão de Candidatos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Como dono desta campanha, você pode visualizar e gerenciar todos os criadores inscritos.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button onClick={() => router.push(`/dashboard/campaigns/${campaign.id}/manage`)} className="flex-1">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Ver Candidatos Inscritos
                    </Button>
                    <Button variant="outline" onClick={() => router.push(`/dashboard/campaigns/${campaign.id}/manage`)} className="flex-1">
                      <Download className="mr-2 h-4 w-4" />
                      Baixar Lista (XLS)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Sobre a Campanha</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="whitespace-pre-line text-muted-foreground">
                        {campaign.description}
                    </p>
                    
                    {requirements.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                            {requirements.map((req: string, i: number) => (
                                <Badge key={i} variant="outline">{req}</Badge>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Briefing & Entregáveis</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="whitespace-pre-line text-muted-foreground">
                        {campaign.briefing || "Disponível após aprovação."}
                    </p>
                </CardContent>
            </Card>
        </div>

        {/* Right Column: Info & Action */}
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Informações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <Calendar className="h-4 w-4" /> Prazo
                        </span>
                        <span className="font-medium">{new Date(campaign.deadline).toLocaleDateString()}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                         <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <MapPin className="h-4 w-4" /> Região
                        </span>
                        <span className="font-medium text-right">
                            {campaign.target_states?.join(", ") || "Brasil"}
                        </span>
                    </div>
                    <Separator />
                     <div className="flex items-center justify-between">
                         <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <DollarSign className="h-4 w-4" /> Pagamento
                        </span>
                        <span className="font-medium capitalize">
                            {campaign.remuneration_type || "Paga"}
                        </span>
                    </div>
                </CardContent>
            </Card>

            <ApplyButton campaign={campaign} onSuccess={() => router.push("/dashboard")} />
        </div>
      </div>
    </div>
  )
}
