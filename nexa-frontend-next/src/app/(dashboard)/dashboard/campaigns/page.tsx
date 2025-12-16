"use client"

import { useEffect, useState } from "react"
import { ListCampaignsUseCase } from "@/application/use-cases/list-campaigns.use-case"
import { ApiCampaignRepository } from "@/infrastructure/repositories/campaign-repository"
import { api } from "@/infrastructure/api/axios-adapter"
import { Campaign } from "@/domain/entities/campaign"
import { CampaignCard } from "@/presentation/components/campaigns/campaign-card"
import { Skeleton } from "@/presentation/components/ui/skeleton"
import { Input } from "@/presentation/components/ui/input"
import { Search } from "lucide-react"

// DI
const campaignRepository = new ApiCampaignRepository(api)
const listCampaignsUseCase = new ListCampaignsUseCase(campaignRepository)

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    setLoading(true)
    try {
      const data = await listCampaignsUseCase.execute()
      setCampaigns(data)
    } catch (error) {
      console.error("Failed to fetch campaigns", error)
      // Mock data for fallback/demo
      setCampaigns([
          {
              id: 1,
              title: "Lançamento Coleção Verão 2026",
              description: "Estamos procurando criadores de conteúdo fashion para o lançamento da nossa nova coleção de verão. O foco é Instagram Reels e TikTok.",
              budget: 5000,
              deadline: "2025-12-31",
              status: "approved",
              brand: { id: 1, name: "Moda Fashion", email: "contact@moda.com" },
              created_at: new Date().toISOString()
          },
          {
              id: 2,
              title: "Review Tech Gadget X",
              description: "Review detalhado do nosso novo fone de ouvido com cancelamento de ruído. Youtube e Tech Blogs.",
              budget: 2500,
              deadline: "2026-01-15",
              status: "approved",
              brand: { id: 2, name: "TechZone", email: "marketing@techzone.io" },
              created_at: new Date().toISOString()
          },
           {
              id: 3,
              title: "Parceria SkinCare Natural",
              description: "Campanha focada em rotina de pele com produtos 100% naturais e veganos.",
              budget: 1200,
              deadline: "2026-02-01",
              status: "approved",
              brand: { id: 3, name: "EcoBeauty", email: "hello@ecobeauty.com" },
              created_at: new Date().toISOString()
          }
      ])
    } finally {
      setLoading(false)
    }
  }

  const filteredCampaigns = Array.isArray(campaigns) ? campaigns.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.description.toLowerCase().includes(search.toLowerCase())
  ) : []

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Campanhas</h1>
        <p className="text-muted-foreground">
          Encontre as melhores oportunidades para o seu perfil.
        </p>
      </div>

      <div className="flex w-full max-w-sm items-center space-x-2">
        <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
                type="search" 
                placeholder="Buscar campanhas..." 
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCampaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  )
}
