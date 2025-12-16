"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/presentation/contexts/auth-provider"
import { ApiCampaignRepository } from "@/infrastructure/repositories/campaign-repository"
import { api } from "@/infrastructure/api/axios-adapter"
import { Campaign } from "@/domain/entities/campaign"
import { CampaignCard } from "@/presentation/components/campaigns/campaign-card"
import { CampaignStats } from "@/presentation/components/dashboard/campaign-stats"
import ContractList from "@/presentation/components/dashboard/contract-list"
import MyApplicationsList from "@/presentation/components/dashboard/my-applications-list"
import { Button } from "@/presentation/components/ui/button"
import { Input } from "@/presentation/components/ui/input"
import { Label } from "@/presentation/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/presentation/components/ui/select"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/presentation/components/ui/tabs"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from "@/presentation/components/ui/card"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/presentation/components/ui/popover"
import { Calendar } from "@/presentation/components/ui/calendar"
import { Skeleton } from "@/presentation/components/ui/skeleton"
import {
    CalendarIcon,
    Filter,
    X,
    Search,
    Briefcase,
    FileText,
    Send
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

const campaignRepository = new ApiCampaignRepository(api)

const categories = [
    "Todas as categorias",
    "Vídeo",
    "Foto",
    "Review",
    "Unboxing",
    "Tutorial",
    "Story",
    "Reels",
    "Post",
    "Live",
    "Podcast",
    "Blog",
]

const brazilianStates = [
    "Acre", "Alagoas", "Amapá", "Amazonas", "Bahia", "Ceará", "Distrito Federal",
    "Espírito Santo", "Goiás", "Maranhão", "Mato Grosso", "Mato Grosso do Sul",
    "Minas Gerais", "Pará", "Paraíba", "Paraná", "Pernambuco", "Piauí",
    "Rio de Janeiro", "Rio Grande do Norte", "Rio Grande do Sul", "Rondônia",
    "Roraima", "Santa Catarina", "São Paulo", "Sergipe", "Tocantins",
]

interface FilterState {
    category: string
    region: string
    dateFrom: Date | undefined
    dateTo: Date | undefined
    sort: string
    search: string
    budgetMin: string
    budgetMax: string
}

export default function CreatorDashboard() {
    const { user } = useAuth()
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showFilters, setShowFilters] = useState(false)
    
    const [filters, setFilters] = useState<FilterState>({
        category: "all",
        region: "all",
        dateFrom: undefined,
        dateTo: undefined,
        sort: "newest-first",
        search: "",
        budgetMin: "",
        budgetMax: "",
    })

    useEffect(() => {
        fetchCampaigns()
    }, [])

    const fetchCampaigns = async () => {
        setIsLoading(true)
        try {
            const data = await campaignRepository.findAll()
            setCampaigns(data)
        } catch (error) {
            console.error("Failed to fetch campaigns", error)
        } finally {
            setIsLoading(false)
        }
    }

    const clearFilters = () => {
        setFilters({
            category: "all",
            region: "all",
            dateFrom: undefined,
            dateTo: undefined,
            sort: "newest-first",
            search: "",
            budgetMin: "",
            budgetMax: "",
        })
    }

    const hasActiveFilters =
        filters.category !== "all" ||
        filters.region !== "all" ||
        filters.dateFrom ||
        filters.dateTo ||
        filters.search ||
        filters.budgetMin ||
        filters.budgetMax

    const filteredAndSortedCampaigns = useMemo(() => {
        return campaigns.filter((campaign) => {
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase()
                const title = campaign.title?.toLowerCase() || ""
                const description = campaign.description?.toLowerCase() || ""
                const brandName = campaign.brand?.name?.toLowerCase() || ""
                const category = campaign.category?.toLowerCase() || campaign.type?.toLowerCase() || ""

                if (
                    !title.includes(searchTerm) &&
                    !description.includes(searchTerm) &&
                    !brandName.includes(searchTerm) &&
                    !category.includes(searchTerm)
                ) {
                    return false
                }
            }

            if (filters.category !== "all") {
                const campaignCategory = campaign.category?.toLowerCase() || campaign.type?.toLowerCase() || ""
                if (!campaignCategory.includes(filters.category.toLowerCase())) {
                    return false
                }
            }

            if (filters.region !== "all") {
                const campaignLocations = campaign.target_states || []
                if (
                    !campaignLocations.some(
                        (loc) => loc.toUpperCase() === filters.region.toUpperCase()
                    )
                ) {
                    return false
                }
            }

            if (filters.budgetMin && campaign.budget < parseFloat(filters.budgetMin)) {
                return false
            }
            if (filters.budgetMax && campaign.budget > parseFloat(filters.budgetMax)) {
                return false
            }

            if (filters.dateFrom) {
                const campaignDate = new Date(campaign.deadline)
                const fromDate = new Date(filters.dateFrom)
                if (campaignDate < fromDate) return false
            }

            if (filters.dateTo) {
                const campaignDate = new Date(campaign.deadline)
                const toDate = new Date(filters.dateTo)
                if (campaignDate > toDate) return false
            }

            return true
        }).sort((a, b) => {
            switch (filters.sort) {
                case "newest-first":
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                case "oldest-first":
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                case "price-high-to-low":
                    return b.budget - a.budget
                case "price-low-to-high":
                    return a.budget - b.budget
                case "deadline-soonest":
                    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
                case "deadline-latest":
                    return new Date(b.deadline).getTime() - new Date(a.deadline).getTime()
                default:
                    return 0
            }
        })
    }, [campaigns, filters])

    const activeOpportunities = campaigns.filter(c => new Date(c.deadline) > new Date()).length
    const averageBudget = campaigns.length > 0 ? campaigns.reduce((sum, c) => sum + c.budget, 0) / campaigns.length : 0

    return (
        <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8 p-4 sm:p-6 lg:p-8 min-h-[92vh]">
            <div className="flex flex-col gap-2">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold flex items-center gap-2">
                    Bem-vindo(a), {user?.name?.split(" ")[0] || "Criador"} <span>👋</span>
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                    Descubra novas campanhas e comece a criar conteúdo incrível!
                </p>
            </div>

            <CampaignStats
                totalCampaigns={activeOpportunities}
                myApplications={0} // Connected to MyApplicationsList but stats need separate endpoint
                completedCampaigns={0} 
                reviewsCount={0} 
                reviewsAverage={0} 
                totalEarnings={0} 
                averageBudget={averageBudget}
            />

            <Tabs defaultValue="campaigns" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="campaigns" className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Campanhas
                    </TabsTrigger>
                    <TabsTrigger value="applications" className="flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        Aplicações
                    </TabsTrigger>
                    <TabsTrigger value="contracts" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Contratos
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="campaigns" className="space-y-6">
                     <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                placeholder="Buscar campanhas por título, descrição, marca ou categoria..."
                                value={filters.search}
                                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                                className="pl-10 h-12"
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="flex items-center gap-2 w-full sm:w-auto"
                                >
                                    <Filter className="h-4 w-4" />
                                    <span className="hidden sm:inline">Filtros Avançados</span>
                                    <span className="sm:hidden">Filtros</span>
                                    {hasActiveFilters && (
                                        <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                                            Active
                                        </span>
                                    )}
                                </Button>
                                {hasActiveFilters && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearFilters}
                                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground w-full sm:w-auto"
                                    >
                                        <X className="h-4 w-4" />
                                        <span className="hidden sm:inline">Limpar Filtros</span>
                                        <span className="sm:hidden">Limpar</span>
                                    </Button>
                                )}
                                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto ml-auto">
                                    <Select
                                        value={filters.sort}
                                        onValueChange={(value) => setFilters((prev) => ({ ...prev, sort: value }))}
                                    >
                                        <SelectTrigger className="w-full sm:w-[180px] h-9">
                                            <SelectValue placeholder="Ordenar por" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="newest-first">Mais recentes</SelectItem>
                                            <SelectItem value="oldest-first">Mais antigas</SelectItem>
                                            <SelectItem value="price-high-to-low">Maior orçamento</SelectItem>
                                            <SelectItem value="price-low-to-high">Menor orçamento</SelectItem>
                                            <SelectItem value="deadline-soonest">Prazo próximo</SelectItem>
                                            <SelectItem value="deadline-latest">Prazo distante</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {showFilters && (
                            <Card className="border-2">
                                <CardHeader>
                                    <CardTitle className="text-lg">Filtros Avançados</CardTitle>
                                    <CardDescription>Refine sua busca para encontrar as campanhas ideais</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-medium">Categoria</Label>
                                            <Select
                                                value={filters.category}
                                                onValueChange={(value) => setFilters((prev) => ({ ...prev, category: value }))}
                                            >
                                                <SelectTrigger className="h-9">
                                                    <SelectValue placeholder="Todas as categorias" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categories.map((category) => (
                                                        <SelectItem
                                                            key={category}
                                                            value={category.toLowerCase().replace(/\s+/g, "-")}
                                                        >
                                                            {category}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs font-medium">Estado</Label>
                                            <Select
                                                value={filters.region}
                                                onValueChange={(value) => setFilters((prev) => ({ ...prev, region: value }))}
                                            >
                                                <SelectTrigger className="h-9">
                                                    <SelectValue placeholder="Todos os estados" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Todos os estados</SelectItem>
                                                    {brazilianStates.map((state) => (
                                                        <SelectItem key={state} value={state}>
                                                            {state}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs font-medium">Orçamento Mínimo</Label>
                                            <Input
                                                type="number"
                                                placeholder="R$ 0"
                                                value={filters.budgetMin}
                                                onChange={(e) => setFilters((prev) => ({ ...prev, budgetMin: e.target.value }))}
                                                className="h-9"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs font-medium">Orçamento Máximo</Label>
                                            <Input
                                                type="number"
                                                placeholder="R$ 10.000"
                                                value={filters.budgetMax}
                                                onChange={(e) => setFilters((prev) => ({ ...prev, budgetMax: e.target.value }))}
                                                className="h-9"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs font-medium">Data Inicial</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" className="w-full justify-start text-left font-normal h-9">
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {filters.dateFrom ? format(filters.dateFrom, "PPP", { locale: ptBR }) : <span className="text-muted-foreground">Escolha uma data</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={filters.dateFrom}
                                                        onSelect={(date) => setFilters((prev) => ({ ...prev, dateFrom: date }))}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <Label className="text-xs font-medium">Data Final</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" className="w-full justify-start text-left font-normal h-9">
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {filters.dateTo ? format(filters.dateTo, "PPP", { locale: ptBR }) : <span className="text-muted-foreground">Escolha uma data</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={filters.dateTo}
                                                        onSelect={(date) => setFilters((prev) => ({ ...prev, dateTo: date }))}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <div>
                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                                <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold">
                                    Campanhas Disponíveis
                                </h3>
                                {filteredAndSortedCampaigns.length > 0 && (
                                    <span className="text-sm text-muted-foreground">
                                        {filteredAndSortedCampaigns.length} de {campaigns.length} campanhas
                                    </span>
                                )}
                            </div>

                            {isLoading ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                                    {[...Array(8)].map((_, i) => (
                                        <Card key={i} className="overflow-hidden">
                                            <CardHeader className="pb-3">
                                                <Skeleton className="h-4 w-3/4" />
                                                <Skeleton className="h-3 w-1/2" />
                                            </CardHeader>
                                            <CardContent className="pb-3">
                                                <div className="flex gap-2 mb-3">
                                                    <Skeleton className="h-6 w-20" />
                                                    <Skeleton className="h-6 w-24" />
                                                </div>
                                                <Skeleton className="h-16 w-full" />
                                            </CardContent>
                                            <CardFooter>
                                                <div className="flex justify-between items-center w-full">
                                                    <Skeleton className="h-6 w-16" />
                                                    <Skeleton className="h-9 w-24" />
                                                </div>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            ) : filteredAndSortedCampaigns.length === 0 ? (
                                <Card className="text-center py-12">
                                    <CardContent>
                                        <div className="mb-4">
                                            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                            <h3 className="text-lg font-semibold mb-2">
                                                Nenhuma campanha encontrada
                                            </h3>
                                            <p className="text-muted-foreground text-sm mb-4">
                                                Nenhuma campanha corresponde aos filtros atuais.
                                            </p>
                                            <Button variant="outline" onClick={clearFilters} className="mx-auto">
                                                Limpar Filtros
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                                    {filteredAndSortedCampaigns.map((campaign) => (
                                        <CampaignCard key={campaign.id} campaign={campaign} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="applications" className="space-y-6">
                    <MyApplicationsList />
                </TabsContent>

                <TabsContent value="contracts" className="space-y-6">
                    <ContractList />
                </TabsContent>
            </Tabs>
        </div>
    )
}
