"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Calendar, MapPin, DollarSign, Building2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

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

const campaignRepository = new ApiCampaignRepository(api)
const getCampaignByIdUseCase = new GetCampaignByIdUseCase(campaignRepository)

export default function CampaignDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
        fetchCampaign(Number(params.id))
    }
  }, [params.id])

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

  if (loading) {
    return (
        <div className="flex flex-col gap-6">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-[200px] w-full" />
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
               src={campaign.image_url} 
               alt={campaign.title} 
               fill
               className="object-cover"
             />
           ) : (
             <div className="w-full h-full bg-gradient-to-r from-pink-500 to-purple-600 opacity-20" />
           )}
           <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-6 pt-20">
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
            <Card>
                <CardHeader>
                    <CardTitle>Sobre a Campanha</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="whitespace-pre-line text-muted-foreground">
                        {campaign.description}
                    </p>
                    
                    {campaign.requirements && (
                        <div className="flex flex-wrap gap-2 mt-4">
                            {campaign.requirements.map((req, i) => (
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
