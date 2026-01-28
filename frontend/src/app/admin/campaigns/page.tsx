"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/presentation/components/ui/card"
import { Button } from "@/presentation/components/ui/button"
import { Badge } from "@/presentation/components/ui/badge"
import { Input } from "@/presentation/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/presentation/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/presentation/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/presentation/components/ui/dialog"
import { Skeleton } from "@/presentation/components/ui/skeleton"
import { Textarea } from "@/presentation/components/ui/textarea"
import {
    Megaphone,
    Search,
    MoreHorizontal,
    CheckCircle,
    XCircle,
    Trash2,
    Eye,
    Calendar,
    DollarSign,
    Building,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Filter
} from "lucide-react"
import { api } from "@/infrastructure/api/axios-adapter"
import { toast } from "sonner"
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value)
}

interface Campaign {
    id: number
    title: string
    description: string
    status: "pending" | "approved" | "active" | "completed" | "rejected" | "cancelled"
    budget: number
    campaign_type: string
    brand: {
        id: number
        name: string
        company_name: string
        profile_image?: string
    }
    created_at: string
    start_date?: string
    end_date?: string
    cover_image?: string
}

interface PaginationInfo {
    current_page: number
    last_page: number
    per_page: number
    total: number
}

export default function AdminCampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [typeFilter, setTypeFilter] = useState("all")
    const [currentPage, setCurrentPage] = useState(1)
    const [pagination, setPagination] = useState<PaginationInfo | null>(null)

    // States for actions
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
    const [actionLoading, setActionLoading] = useState(false)
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
    const [rejectReason, setRejectReason] = useState("")

    const fetchCampaigns = useCallback(async (page = 1) => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            params.append("page", String(page))
            if (searchTerm) params.append("search", searchTerm)
            if (statusFilter !== "all") params.append("status", statusFilter)
            if (typeFilter !== "all") params.append("type", typeFilter)

            const response = await api.get<{
                success: boolean
                data: {
                    data: Campaign[]
                    current_page: number
                    last_page: number
                    per_page: number
                    total: number
                }
            }>(`/admin/campaigns?${params.toString()}`)

            if (response.success) {
                setCampaigns(response.data.data || [])
                setPagination({
                    current_page: response.data.current_page,
                    last_page: response.data.last_page,
                    per_page: response.data.per_page,
                    total: response.data.total,
                })
            }
        } catch (error) {
            console.error("Failed to fetch campaigns:", error)
            toast.error("Falha ao carregar campanhas")
        } finally {
            setLoading(false)
        }
    }, [searchTerm, statusFilter, typeFilter])

    useEffect(() => {
        fetchCampaigns(currentPage)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage])

    const handleSearch = () => {
        setCurrentPage(1)
        fetchCampaigns(1)
    }

    const handleAction = async (campaignId: number, action: "approve" | "reject" | "delete") => {
        if (action === "reject") {
            setRejectDialogOpen(true)
            return
        }

        if (action === "delete" && !confirm("Tem certeza que deseja excluir esta campanha? Esta ação não pode ser desfeita.")) {
            return
        }

        setActionLoading(true)
        try {
            let endpoint = ""
            let method = ""

            switch (action) {
                case "approve":
                    endpoint = `/admin/campaigns/${campaignId}/approve`
                    method = "patch"
                    break
                case "delete":
                    endpoint = `/admin/campaigns/${campaignId}`
                    method = "delete"
                    break
            }

            // @ts-ignore - dynamic method call
            const response = await api[method]<{
                success: boolean
                message?: string
            }>(endpoint)

            if (response.success) {
                toast.success(response.message || `Ação realizada com sucesso`)
                fetchCampaigns(currentPage)
                setSelectedCampaign(null)
            } else {
                toast.error(response.message || "Falha ao executar ação")
            }
        } catch (error: any) {
            console.error(`Failed to ${action} campaign:`, error)
            toast.error(error.response?.data?.message || `Falha ao ${action === "delete" ? "excluir" : "aprovar"} campanha`)
        } finally {
            setActionLoading(false)
        }
    }

    const handleReject = async () => {
        if (!selectedCampaign || !rejectReason) return

        setActionLoading(true)
        try {
            const response = await api.patch<{
                success: boolean
                message?: string
            }>(`/admin/campaigns/${selectedCampaign.id}/reject`, { reason: rejectReason })

            if (response.success) {
                toast.success(response.message || "Campanha rejeitada com sucesso")
                setRejectDialogOpen(false)
                setRejectReason("")
                fetchCampaigns(currentPage)
                setSelectedCampaign(null)
            } else {
                toast.error(response.message || "Falha ao rejeitar campanha")
            }
        } catch (error: any) {
            console.error("Failed to reject campaign:", error)
            toast.error(error.response?.data?.message || "Falha ao rejeitar campanha")
        } finally {
            setActionLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "pending":
                return <Badge variant="outline" className="border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/10">Pendente</Badge>
            case "approved":
            case "active":
                return <Badge variant="default" className="bg-green-600">Ativa</Badge>
            case "completed":
                return <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Concluída</Badge>
            case "rejected":
                return <Badge variant="destructive">Rejeitada</Badge>
            case "cancelled":
                return <Badge variant="outline" className="text-muted-foreground">Cancelada</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div>
                <Badge variant="outline" className="mb-2">Campanhas</Badge>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    Todas as Campanhas
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                    Gerencie todas as campanhas da plataforma, verifique status e modere conteúdo.
                </p>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filtros
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <Input
                                placeholder="Buscar por título ou marca..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            />
                        </div>
                        <div className="w-40">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os status</SelectItem>
                                    <SelectItem value="pending">Pendente</SelectItem>
                                    <SelectItem value="active">Ativa</SelectItem>
                                    <SelectItem value="completed">Concluída</SelectItem>
                                    <SelectItem value="rejected">Rejeitada</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-40">
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os tipos</SelectItem>
                                    <SelectItem value="ugc">UGC</SelectItem>
                                    <SelectItem value="affiliates">Afiliados</SelectItem>
                                    <SelectItem value="influencer">Influencer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleSearch}>
                            <Search className="mr-2 h-4 w-4" />
                            Buscar
                        </Button>
                        <Button variant="outline" onClick={() => {
                            setSearchTerm("")
                            setStatusFilter("all")
                            setTypeFilter("all")
                            setCurrentPage(1)
                            fetchCampaigns(1)
                        }}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Limpar
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Campaigns Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Megaphone className="h-5 w-5" />
                        Campanhas
                        {pagination && (
                            <span className="ml-2 text-sm font-normal text-muted-foreground">
                                ({pagination.total} total)
                            </span>
                        )}
                    </CardTitle>
                    <CardDescription>
                        Listagem completa de campanhas.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <Skeleton className="h-16 w-24 rounded-md" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-5 w-64" />
                                        <Skeleton className="h-4 w-32" />
                                    </div>
                                    <Skeleton className="h-6 w-20" />
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                </div>
                            ))}
                        </div>
                    ) : campaigns.length === 0 ? (
                        <div className="py-12 text-center">
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                <Megaphone className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium">Nenhuma campanha encontrada</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Tente ajustar os filtros ou buscar por outro termo.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-muted-foreground">
                                        <th className="px-4 py-3 text-left">Campanha</th>
                                        <th className="px-4 py-3 text-left">Marca</th>
                                        <th className="px-4 py-3 text-left">Orçamento</th>
                                        <th className="px-4 py-3 text-left">Status</th>
                                        <th className="px-4 py-3 text-left">Data</th>
                                        <th className="px-4 py-3 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {campaigns.map((campaign) => (
                                        <tr key={campaign.id} className="border-b last:border-0 hover:bg-muted/50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-16 overflow-hidden rounded-md bg-muted">
                                                        {campaign.cover_image ? (
                                                            <img src={campaign.cover_image} alt={campaign.title} className="h-full w-full object-cover" />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                                                                <Megaphone className="h-4 w-4" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium line-clamp-1">{campaign.title}</div>
                                                        <div className="text-xs text-muted-foreground">{campaign.campaign_type || 'Geral'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Building className="h-3 w-3 text-muted-foreground" />
                                                    <span className="truncate max-w-[150px]">
                                                        {campaign.brand.company_name || campaign.brand.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-medium">
                                                {formatCurrency(campaign.budget)}
                                            </td>
                                            <td className="px-4 py-3">{getStatusBadge(campaign.status)}</td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {new Date(campaign.created_at).toLocaleDateString("pt-BR")}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => setSelectedCampaign(campaign)}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            Detalhes
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        {campaign.status === "pending" && (
                                                            <>
                                                                <DropdownMenuItem
                                                                    onClick={() => {
                                                                        setSelectedCampaign(campaign)
                                                                        handleAction(campaign.id, "approve")
                                                                    }}
                                                                    className="text-green-600"
                                                                >
                                                                    <CheckCircle className="mr-2 h-4 w-4" />
                                                                    Aprovar
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => {
                                                                        setSelectedCampaign(campaign)
                                                                        handleAction(campaign.id, "reject")
                                                                    }}
                                                                    className="text-red-600"
                                                                >
                                                                    <XCircle className="mr-2 h-4 w-4" />
                                                                    Rejeitar
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedCampaign(campaign)
                                                                handleAction(campaign.id, "delete")
                                                            }}
                                                            className="text-red-600"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Excluir
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination && pagination.last_page > 1 && (
                        <div className="mt-4 flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                Página {pagination.current_page} de {pagination.last_page}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Anterior
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                    disabled={currentPage === pagination.last_page}
                                >
                                    Próximo
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Campaign Details Dialog */}
            <Dialog open={!!selectedCampaign && !rejectDialogOpen} onOpenChange={(open) => !open && setSelectedCampaign(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Detalhes da Campanha</DialogTitle>
                    </DialogHeader>
                    {selectedCampaign && (
                        <div className="space-y-6">
                            {/* Cover Image */}
                            <div className="aspect-video w-full rounded-lg bg-muted overflow-hidden">
                                {selectedCampaign.cover_image ? (
                                    <img src={selectedCampaign.cover_image} alt={selectedCampaign.title} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center">
                                        <Megaphone className="h-12 w-12 text-muted-foreground/50" />
                                    </div>
                                )}
                            </div>

                            {/* Title & Status */}
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <h2 className="text-xl font-bold">{selectedCampaign.title}</h2>
                                    <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                                        <Building className="h-4 w-4" />
                                        <span>{selectedCampaign.brand.company_name || selectedCampaign.brand.name}</span>
                                    </div>
                                </div>
                                {getStatusBadge(selectedCampaign.status)}
                            </div>

                            {/* Grid Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                        <DollarSign className="h-3 w-3" /> Orçamento
                                    </span>
                                    <p className="font-medium">{formatCurrency(selectedCampaign.budget)}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                        <Calendar className="h-3 w-3" /> Data de Criação
                                    </span>
                                    <p className="font-medium">{new Date(selectedCampaign.created_at).toLocaleDateString("pt-BR")}</p>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <h3 className="font-semibold text-sm">Descrição</h3>
                                <div className="p-4 rounded-lg bg-muted/50 text-sm whitespace-pre-wrap">
                                    {selectedCampaign.description}
                                </div>
                            </div>

                            {/* Actions Footer */}
                            <div className="flex gap-2 pt-4 border-t">
                                {selectedCampaign.status === "pending" ? (
                                    <>
                                        <Button
                                            className="flex-1 bg-green-600 hover:bg-green-700"
                                            onClick={() => handleAction(selectedCampaign.id, "approve")}
                                            disabled={actionLoading}
                                        >
                                            {actionLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                            Aprovar
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            className="flex-1"
                                            onClick={() => handleAction(selectedCampaign.id, "reject")}
                                            disabled={actionLoading}
                                        >
                                            <XCircle className="mr-2 h-4 w-4" />
                                            Rejeitar
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        variant="destructive"
                                        className="w-full"
                                        onClick={() => handleAction(selectedCampaign.id, "delete")}
                                        disabled={actionLoading}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Excluir Campanha
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Reject Reason Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rejeitar Campanha</DialogTitle>
                        <DialogDescription>
                            Por favor, informe o motivo da rejeição. Isso será enviado para a marca.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Textarea
                            placeholder="Descreva o motivo da rejeição..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleReject} disabled={actionLoading || !rejectReason.trim()}>
                            {actionLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                            Confirmar Rejeição
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
