"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/presentation/components/ui/card"
import { Badge } from "@/presentation/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/presentation/components/ui/tabs"
import { Skeleton } from "@/presentation/components/ui/skeleton"
import { Trophy, TrendingUp, DollarSign, Medal, Star, CheckCircle } from "lucide-react"
import { api } from "@/infrastructure/api/axios-adapter"
import { toast } from "sonner"

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value)
}

interface BrandRanking {
    brand_id: number
    brand_name: string
    total_campaigns: number
    total_investment: number
    active_campaigns: number
    score?: number
}

interface ComprehensiveRanking extends BrandRanking {
    engagement_rate: number
    successful_campaigns: number
    creator_rating: number
}

export default function AdminRankingsPage() {
    const [rankings, setRankings] = useState<BrandRanking[]>([])
    const [comprehensiveRankings, setComprehensiveRankings] = useState<ComprehensiveRanking[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchRankings()
    }, [])

    const fetchRankings = async () => {
        setLoading(true)
        try {
            const [simpleRes, compRes] = await Promise.all([
                api.get<{ success: boolean; data: BrandRanking[] }>("/admin/brand-rankings").catch(() => null),
                api.get<{ success: boolean; data: ComprehensiveRanking[] }>("/admin/brand-rankings/comprehensive").catch(() => null)
            ])

            if (simpleRes?.success) {
                setRankings(simpleRes.data)
            }
            if (compRes?.success) {
                setComprehensiveRankings(compRes.data)
            }
        } catch (error) {
            console.error("Failed to fetch rankings:", error)
            toast.error("Falha ao carregar rankings")
        } finally {
            setLoading(false)
        }
    }

    const getMedalColor = (index: number) => {
        switch (index) {
            case 0: return "text-yellow-500" // Gold
            case 1: return "text-gray-400"   // Silver
            case 2: return "text-amber-600"  // Bronze
            default: return "text-muted-foreground"
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <Badge variant="outline" className="mb-2">Analytics</Badge>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    Rankings das Marcas
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                    Acompanhe o desempenho das marcas com base em investimento e atividade.
                </p>
            </div>

            <Tabs defaultValue="investment" className="w-full">
                <TabsList>
                    <TabsTrigger value="investment">Por Investimento</TabsTrigger>
                    <TabsTrigger value="performance">Por Performance Global</TabsTrigger>
                </TabsList>

                <TabsContent value="investment" className="space-y-4 pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-green-600" />
                                Top Marcas por Investimento
                            </CardTitle>
                            <CardDescription>
                                Marcas com maior volume de investimento em campanhas.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="space-y-4">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="flex items-center gap-4">
                                            <Skeleton className="h-8 w-8 rounded-full" />
                                            <div className="flex-1 space-y-2">
                                                <Skeleton className="h-4 w-48" />
                                                <Skeleton className="h-3 w-32" />
                                            </div>
                                            <Skeleton className="h-6 w-24" />
                                        </div>
                                    ))}
                                </div>
                            ) : rankings.length === 0 ? (
                                <div className="py-8 text-center text-muted-foreground">
                                    Nenhum dado de ranking disponível
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {rankings.map((brand, index) => (
                                        <div key={brand.brand_id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                            <div className="flex items-center gap-4">
                                                <div className={`flex h-8 w-8 items-center justify-center font-bold ${getMedalColor(index)}`}>
                                                    {index < 3 ? <Trophy className="h-6 w-6" /> : `#${index + 1}`}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-lg">{brand.brand_name}</div>
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <TrendingUp className="h-3 w-3" />
                                                            {brand.total_campaigns} campanhas
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-lg text-green-600">
                                                    {formatCurrency(brand.total_investment)}
                                                </div>
                                                <div className="text-xs text-muted-foreground">Investimento Total</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="performance" className="space-y-4 pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Medal className="h-5 w-5 text-purple-600" />
                                Performance Global
                            </CardTitle>
                            <CardDescription>
                                Avaliação baseada em engajamento, sucesso de campanhas e avaliação de criadores.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="space-y-4">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="flex items-center gap-4">
                                            <Skeleton className="h-8 w-8 rounded-full" />
                                            <div className="flex-1 space-y-2">
                                                <Skeleton className="h-4 w-48" />
                                                <Skeleton className="h-3 w-32" />
                                            </div>
                                            <Skeleton className="h-6 w-24" />
                                        </div>
                                    ))}
                                </div>
                            ) : comprehensiveRankings.length === 0 ? (
                                <div className="py-8 text-center text-muted-foreground">
                                    Nenhum dado de performance disponível. Tente novamente mais tarde.
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {comprehensiveRankings.map((brand, index) => (
                                        <div key={brand.brand_id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                                            <div className="flex items-center gap-4">
                                                <div className={`flex h-10 w-10 items-center justify-center font-bold text-xl ${getMedalColor(index)}`}>
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-lg">{brand.brand_name}</div>
                                                    <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                                                        <Badge variant="secondary" className="flex items-center gap-1">
                                                            <Star className="h-3 w-3 text-yellow-500" />
                                                            {Number(brand.creator_rating || 0).toFixed(1)} Rating
                                                        </Badge>
                                                        <span className="flex items-center gap-1">
                                                            <CheckCircle className="h-3 w-3 text-green-500" />
                                                            {brand.successful_campaigns} sucessos
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-2xl text-purple-600">
                                                    {Number(brand.score || 0).toFixed(0)}
                                                </div>
                                                <div className="text-xs text-muted-foreground">Pontuação Global</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}


