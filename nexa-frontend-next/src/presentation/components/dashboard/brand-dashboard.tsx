"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/presentation/contexts/auth-provider"
import { ApiCampaignRepository } from "@/infrastructure/repositories/campaign-repository"
import { api } from "@/infrastructure/api/axios-adapter"
import { Campaign } from "@/domain/entities/campaign"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/presentation/components/ui/tabs"
import { Briefcase, FileText, CreditCard, PlusCircle, Users } from "lucide-react"
import ContractList from "@/presentation/components/dashboard/contract-list"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/presentation/components/ui/card"
import { Button } from "@/presentation/components/ui/button"
import { Badge } from "@/presentation/components/ui/badge"
import { Skeleton } from "@/presentation/components/ui/skeleton"

const campaignRepository = new ApiCampaignRepository(api)

export default function BrandDashboard() {
    const { user } = useAuth()
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [activeTab, setActiveTab] = useState("campaigns")
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchBrandCampaigns = async () => {
            setIsLoading(true)
            try {
                // In a real scenario, this endpoint should filter by the logged-in brand
                const data = await campaignRepository.findAll({ brand_id: user?.id })
                setCampaigns(data)
            } catch (error) {
                console.error("Failed to fetch campaigns", error)
            } finally {
                setIsLoading(false)
            }
        }
        
        if (user?.id) {
            fetchBrandCampaigns()
        }
    }, [user?.id])

    return (
        <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8 p-4 sm:p-6 lg:p-8 min-h-[92vh]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-col gap-2">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold flex items-center gap-2">
                        Bem-vindo, {user?.name || "Marca"} <span>👋</span>
                    </h2>
                    <p className="text-sm sm:text-base text-muted-foreground mt-1">
                        Gerencie suas campanhas e conecte-se com criadores incríveis!
                    </p>
                </div>
                <Button className="bg-pink-500 hover:bg-pink-600 text-white" asChild>
                    <Link href="/dashboard/campaigns/create">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nova Campanha
                    </Link>
                </Button>
            </div>

            <Tabs defaultValue="campaigns" className="space-y-6" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="campaigns" className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Campanhas
                    </TabsTrigger>
                    <TabsTrigger value="contracts" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Contratos
                    </TabsTrigger>
                    <TabsTrigger value="payment" className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Pagamentos
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="campaigns" className="space-y-6">
                    {isLoading ? (
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <Skeleton key={i} className="h-[200px] w-full" />
                            ))}
                         </div>
                    ) : campaigns.length === 0 ? (
                        <Card>
                            <CardContent className="p-6">
                                <div className="text-center text-muted-foreground py-10">
                                    <p className="mb-4">Você ainda não tem campanhas ativas.</p>
                                    <Button variant="outline" asChild>
                                        <Link href="/dashboard/campaigns/create">
                                            Criar primeira campanha
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {campaigns.map(campaign => (
                                <Card key={campaign.id} className="hover:shadow-lg transition-all">
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'} className="mb-2">
                                                {campaign.status === 'active' ? 'Ativa' : 'Pendente'}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(campaign.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <CardTitle className="line-clamp-1 text-lg">{campaign.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pb-4">
                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                            {campaign.description}
                                        </p>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                <Users className="h-4 w-4" />
                                                <span>0 candidatos</span>
                                            </div>
                                            <div className="font-semibold">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(campaign.budget)}
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button variant="outline" className="w-full" asChild>
                                            <Link href={`/dashboard/campaigns/${campaign.id}/manage`}>
                                                Gerenciar Candidatos
                                            </Link>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="contracts" className="space-y-6">
                    <ContractList />
                </TabsContent>

                <TabsContent value="payment" className="space-y-6">
                     <Card>
                        <CardContent className="p-6">
                            <div className="text-center text-muted-foreground">
                                Gestão de pagamentos em breve...
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
