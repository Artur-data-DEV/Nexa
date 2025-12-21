"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/presentation/contexts/auth-provider"
import { ApiCampaignRepository } from "@/infrastructure/repositories/campaign-repository"
import { api } from "@/infrastructure/api/axios-adapter"
import { Campaign } from "@/domain/entities/campaign"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/presentation/components/ui/tabs"
import { Briefcase, FileText, CreditCard, PlusCircle, Users, Shield, Info, Loader2, CheckCircle, XCircle, Clock } from "lucide-react"
import ContractList from "@/presentation/components/dashboard/contract-list"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/presentation/components/ui/card"
import { Button } from "@/presentation/components/ui/button"
import { Badge } from "@/presentation/components/ui/badge"
import { Skeleton } from "@/presentation/components/ui/skeleton"
import { AxiosResponse } from "axios"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/presentation/components/ui/dialog"
import { toast } from "sonner"

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
                                                <span>
                                                    {campaign.applications_count ?? 0} candidato
                                                    {(campaign.applications_count ?? 0) === 1 ? "" : "s"}
                                                </span>
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
                    <PaymentsTab />
                </TabsContent>
            </Tabs>
        </div>
    )
}

function PaymentsTab() {
    const [loading, setLoading] = useState(true)
    interface BrandTransaction {
        id: number
        status: string
        amount: number | string
        payment_method?: string
        contract_title?: string
        contract_id?: number
        pagarme_transaction_id?: string
        stripe_payment_intent_id?: string
        processed_at?: string
    }
    interface Pagination {
        current_page: number
        last_page: number
        total: number
        per_page: number
        from: number | null
        to: number | null
    }
    interface FundingContract {
        id: number
        title: string
        budget: number
        creator?: { name?: string }
    }
    interface ContractPaymentStatus {
        contract_id: number
        contract_status: string
        workflow_status: string
        budget: number
        payment?: {
            status: string
            total_amount: number
            platform_fee: number
            creator_amount: number
            payment_method: string
            created_at: string
            transaction?: {
                id: string
                status: string
                paid_at: string
            }
            history?: Array<{
                status: string
                timestamp: string
                message?: string
            }>
        }
    }
    const [transactions, setTransactions] = useState<BrandTransaction[]>([])
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [page, setPage] = useState(1)
    const [perPage] = useState(10)
    const [pagination, setPagination] = useState<Pagination | null>(null)
    const [contractsNeedingFunding, setContractsNeedingFunding] = useState<FundingContract[]>([])
    const [detailsOpenId, setDetailsOpenId] = useState<number | null>(null)
    const [detailsLoading, setDetailsLoading] = useState(false)
    const [detailsData, setDetailsData] = useState<ContractPaymentStatus | null>(null)
    const [detailsError, setDetailsError] = useState<string | null>(null)

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true)
                const res: AxiosResponse<{ success: boolean; transactions?: BrandTransaction[]; pagination?: Pagination }> = await api.get("/brand/transactions", { params: { page, per_page: perPage } })
                if (res.data?.success) {
                    setTransactions(res.data.transactions ?? [])
                    setPagination(res.data.pagination ?? null)
                } else {
                    setTransactions([])
                    setPagination(null)
                }
            } catch (e) {
                console.error("Failed to load brand transactions", e)
                setTransactions([])
                setPagination(null)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [page, perPage])

    useEffect(() => {
        const loadContractsNeedingFunding = async () => {
            try {
                const res: AxiosResponse = await api.get("/contracts", {
                    params: { status: "pending", workflow_status: "payment_pending" },
                })
                if (res.data?.data) {
                    setContractsNeedingFunding(res.data.data)
                } else {
                    setContractsNeedingFunding([])
                }
            } catch (e) {
                console.error("Failed to load contracts needing funding", e)
                setContractsNeedingFunding([])
            }
        }
        loadContractsNeedingFunding()
    }, [])

    const total = transactions.length
    const paid = transactions.filter((t) => String(t.status).toLowerCase() === "paid" || String(t.status).toLowerCase() === "completed").length
    const pending = transactions.filter((t) => {
        const s = String(t.status).toLowerCase()
        return s === "pending" || s === "processing"
    }).length
    const availableToRelease = transactions.filter((t) => String(t.status).toLowerCase() === "processing")

    const formatCurrency = (value: unknown): string => {
        const num = typeof value === "string" ? parseFloat(value) : typeof value === "number" ? value : 0
        if (!isFinite(num)) return "R$ 0,00"
        return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num)
    }

    const filteredTransactions = transactions.filter((t) => {
        if (statusFilter === "all") return true
        const s = String(t.status).toLowerCase()
        return s === statusFilter.toLowerCase()
    })

    const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)

    const handleRetryPayment = async (contractId?: number) => {
        if (!contractId) return
        try {
            setActionLoadingId(contractId)
            await api.post("/contract-payment/retry", { contract_id: contractId })
            const res: AxiosResponse<{ success: boolean; transactions?: BrandTransaction[]; pagination?: Pagination }> = await api.get("/brand/transactions", { params: { page, per_page: perPage } })
            if (res.data?.success) {
                setTransactions(res.data.transactions ?? [])
                setPagination(res.data.pagination ?? null)
            }
            toast.success("Reprocessamento iniciado com sucesso")
        } catch (e) {
            console.error("Retry payment failed", e)
            toast.error("Falha ao reprocessar pagamento")
        } finally {
            setActionLoadingId(null)
        }
    }

    const handleCreateCheckout = async (contractId?: number) => {
        if (!contractId) return
        try {
            setActionLoadingId(contractId)
            const res: AxiosResponse<{ success: boolean; url?: string }> = await api.post("/contract-payment/checkout-session", { contract_id: contractId })
            const url = res.data?.url
            if (typeof url === "string") {
                window.location.href = url
            }
            toast.success("Redirecionando para checkout do contrato")
        } catch (e) {
            console.error("Create checkout session failed", e)
            toast.error("Falha ao iniciar checkout do contrato")
        } finally {
            setActionLoadingId(null)
        }
    }

    const openDetailsModal = async (t: BrandTransaction) => {
        setDetailsOpenId(t.id)
        setDetailsError(null)
        setDetailsData(null)
        setDetailsLoading(true)
        try {
            if (t.contract_id) {
                const res: AxiosResponse<{ success?: boolean; data?: ContractPaymentStatus }> = await api.get("/contract-payment/status", {
                    params: { contract_id: t.contract_id },
                })
                if (res.data?.success && res.data.data) {
                    setDetailsData(res.data.data)
                } else {
                    setDetailsError("Não foi possível carregar detalhes da transação")
                }
            } else {
                setDetailsError("Transação sem vínculo de contrato")
            }
        } catch (err) {
            console.error("Failed to load details", err)
            setDetailsError("Erro ao carregar detalhes da transação")
        } finally {
            setDetailsLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        const s = String(status).toLowerCase()
        if (s === "paid" || s === "completed") {
            return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"><CheckCircle className="w-3 h-3 mr-1" />Pago</Badge>
        }
        if (s === "failed") {
            return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"><XCircle className="w-3 h-3 mr-1" />Falhou</Badge>
        }
        if (s === "pending" || s === "processing") {
            return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>
        }
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">{status}</Badge>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Gestão de Pagamentos
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-4 rounded-lg border bg-muted/40">
                    <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="text-sm text-muted-foreground">
                            <p className="font-medium text-foreground mb-1">Configure pagamentos</p>
                            <p>
                                Conecte sua conta Stripe e um método de pagamento para financiar contratos com criadores
                                e gerenciar cobranças com segurança.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 rounded-lg border">
                        <div className="text-2xl font-bold text-foreground">{loading ? "—" : total}</div>
                        <div className="text-sm text-muted-foreground">Transações</div>
                    </div>
                    <div className="text-center p-4 rounded-lg border">
                        <div className="text-2xl font-bold text-green-600">{loading ? "—" : paid}</div>
                        <div className="text-sm text-muted-foreground">Pagos</div>
                    </div>
                    <div className="text-center p-4 rounded-lg border">
                        <div className="text-2xl font-bold text-yellow-500">{loading ? "—" : pending}</div>
                        <div className="text-sm text-muted-foreground">Pendentes</div>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Filtrar status:</span>
                        <select
                            className="h-9 border rounded-md bg-background px-2 text-sm"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">Todos</option>
                            <option value="paid">Pagos</option>
                            <option value="completed">Completados</option>
                            <option value="pending">Pendentes</option>
                            <option value="processing">Processando</option>
                            <option value="failed">Falhos</option>
                        </select>
                    </div>
                    {pagination && (
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                                Página anterior
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Página {page} de {pagination.last_page}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination && page >= pagination.last_page}
                                onClick={() => setPage((p) => (pagination ? Math.min(pagination.last_page, p + 1) : p + 1))}
                            >
                                Próxima página
                            </Button>
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Pagamentos disponíveis para liberar</h3>
                    {loading ? (
                        <div className="text-sm text-muted-foreground">Carregando...</div>
                    ) : availableToRelease.length === 0 ? (
                        <div className="text-sm text-muted-foreground">Nenhum pagamento disponível no momento.</div>
                    ) : (
                        <div className="space-y-2">
                            {availableToRelease.slice(0, 5).map((t) => (
                                <div key={t.id} className="flex items-center justify-between rounded-lg border p-3">
                                    <div className="text-sm">
                                        <div className="font-medium">{t.contract_title || `Transação #${t.id}`}</div>
                                        <div className="text-muted-foreground">
                                            Método: {t.payment_method?.toUpperCase() || "—"} • Valor: {formatCurrency(t.amount)}
                                        </div>
                                    </div>
                                    <Button asChild>
                                        <Link href="/dashboard/payment-methods">Liberar agora</Link>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Transações</h3>
                    {loading ? (
                        <div className="text-sm text-muted-foreground">Carregando...</div>
                    ) : filteredTransactions.length === 0 ? (
                        <Card>
                            <CardContent className="flex items-center justify-center py-8 text-muted-foreground">
                                Nenhuma transação encontrada para o filtro selecionado.
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-2">
                            {filteredTransactions.map((t) => (
                                <div key={t.id} className="rounded-lg border p-3">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm">
                                            <div className="font-medium">{t.contract_title || `Transação #${t.id}`}</div>
                                            <div className="text-muted-foreground">
                                                Valor: {formatCurrency(t.amount)} • Método: {t.payment_method?.toUpperCase() || "—"}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {getStatusBadge(t.status)}
                                            <Button variant="outline" size="sm" onClick={() => openDetailsModal(t)}>
                                                Detalhes
                                            </Button>
                                            {String(t.status).toLowerCase() === "failed" && (
                                                <Button size="sm" onClick={() => handleRetryPayment(t.contract_id)} disabled={actionLoadingId === t.contract_id}>
                                                    {actionLoadingId === t.contract_id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                                    Reprocessar
                                                </Button>
                                            )}
                                            {String(t.status).toLowerCase() === "pending" && (
                                                <Button size="sm" onClick={() => handleCreateCheckout(t.contract_id)} disabled={actionLoadingId === t.contract_id}>
                                                    {actionLoadingId === t.contract_id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                                    Pagar contrato
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    <Dialog open={detailsOpenId === t.id} onOpenChange={(open) => setDetailsOpenId(open ? t.id : null)}>
                                        <DialogContent className="sm:max-w-lg">
                                            <DialogHeader>
                                                <DialogTitle>Detalhes da transação</DialogTitle>
                                                <DialogDescription>Informações completas do pagamento e histórico</DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4">
                                                <div className="rounded-lg border p-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="font-medium">{t.contract_title || `Transação #${t.id}`}</div>
                                                        {getStatusBadge(t.status)}
                                                    </div>
                                                    <div className="mt-2 text-sm text-muted-foreground">
                                                        <div>Valor: {formatCurrency(t.amount)}</div>
                                                        <div>Método: {t.payment_method?.toUpperCase() || "—"}</div>
                                                        <div>Processada em: {t.processed_at ? new Date(t.processed_at).toLocaleString() : "—"}</div>
                                                        <div>ID externo: {t.pagarme_transaction_id || t.stripe_payment_intent_id || "—"}</div>
                                                    </div>
                                                </div>
                                                <div className="rounded-lg border p-3">
                                                    <div className="font-semibold mb-2">Histórico de processamento</div>
                                                    {detailsLoading ? (
                                                        <div className="text-sm text-muted-foreground flex items-center"><Loader2 className="w-4 h-4 mr-2 animate-spin" />Carregando...</div>
                                                    ) : detailsError ? (
                                                        <div className="text-sm text-red-600">{detailsError}</div>
                                                    ) : detailsData?.payment?.history && detailsData.payment.history.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {detailsData.payment.history.map((h, idx) => (
                                                                <div key={idx} className="flex items-start justify-between text-sm">
                                                                    <div className="flex items-center gap-2">
                                                                        {h.status.toLowerCase() === "paid" || h.status.toLowerCase() === "completed" ? (
                                                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                                                        ) : h.status.toLowerCase() === "failed" ? (
                                                                            <XCircle className="w-4 h-4 text-red-600" />
                                                                        ) : (
                                                                            <Clock className="w-4 h-4 text-yellow-600" />
                                                                        )}
                                                                        <span className="font-medium">{h.status}</span>
                                                                    </div>
                                                                    <div className="text-muted-foreground">{new Date(h.timestamp).toLocaleString()}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-muted-foreground">Sem histórico disponível.</div>
                                                    )}
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                {String(t.status).toLowerCase() === "failed" && (
                                                    <Button onClick={() => handleRetryPayment(t.contract_id)} disabled={actionLoadingId === t.contract_id}>
                                                        {actionLoadingId === t.contract_id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                                        Reprocessar pagamento
                                                    </Button>
                                                )}
                                                <Button variant="outline" onClick={() => setDetailsOpenId(null)}>Fechar</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Contratos que precisam de financiamento</h3>
                    {contractsNeedingFunding.length === 0 ? (
                        <div className="text-sm text-muted-foreground">Nenhum contrato precisando de funding agora.</div>
                    ) : (
                        <div className="space-y-2">
                            {contractsNeedingFunding.map((c) => (
                                <div key={c.id} className="flex items-center justify-between rounded-lg border p-3">
                                    <div className="text-sm">
                                        <div className="font-medium">{c.title}</div>
                                        <div className="text-muted-foreground">
                                            Orçamento: {formatCurrency(c.budget)} • Criador: {c.creator?.name ?? "—"}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" asChild>
                                            <Link href={`/dashboard/campaigns/${c.id}/manage`}>Ver contrato</Link>
                                        </Button>
                                        <Button asChild>
                                            <Link href="/dashboard/payment-methods">Financiar</Link>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button className="w-full" asChild>
                        <Link href="/dashboard/payment-methods">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Configurar Pagamentos
                        </Link>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                        <Link href="/guides">
                            <Shield className="h-4 w-4 mr-2" />
                            Ver Guias de Pagamento
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
