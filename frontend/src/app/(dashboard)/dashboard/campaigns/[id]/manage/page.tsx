"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle, XCircle, Clock, MessageCircle, ExternalLink } from "lucide-react"
import Link from "next/link"
import type { AxiosError } from "axios"

import { ApiApplicationRepository } from "@/infrastructure/repositories/application-repository"
import { ApiCampaignRepository } from "@/infrastructure/repositories/campaign-repository"
import { ApiTermsRepository } from "@/infrastructure/repositories/terms-repository"
import { api } from "@/infrastructure/api/axios-adapter"
import { Application } from "@/domain/entities/application"
import { Campaign } from "@/domain/entities/campaign"

import { Button } from "@/presentation/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/presentation/components/ui/avatar"
import { Skeleton } from "@/presentation/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/presentation/components/ui/tabs"
import { toast } from "sonner"
import { TermsModal } from "@/presentation/components/terms/terms-modal"
import { TERMS_CONTENT } from "@/presentation/components/terms/terms-content"
import { FaFileCsv } from "react-icons/fa6";
import { Badge } from "@/presentation/components/ui/badge"
import { ScrollArea } from "@/presentation/components/ui/scroll-area"

const applicationRepository = new ApiApplicationRepository(api)
const campaignRepository = new ApiCampaignRepository(api)
const termsRepository = new ApiTermsRepository(api)

interface ExtendedApplication extends Application {
    creator?: {
        id: number
        name: string
        avatar?: string
        instagram_handle?: string
        tiktok_handle?: string
    }
}

export default function ManageCandidatesPage() {
    const params = useParams()
    const router = useRouter()
    const campaignId = Number(params.id)

    const [campaign, setCampaign] = useState<Campaign | null>(null)
    const [applications, setApplications] = useState<ExtendedApplication[]>([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState<number | null>(null)
    const [showTerms, setShowTerms] = useState(false)
    const [pendingApprovalId, setPendingApprovalId] = useState<number | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const [campaignData, applicationsData] = await Promise.all([
                    campaignRepository.findById(campaignId),
                    applicationRepository.getCampaignApplications(campaignId)
                ])
                setCampaign(campaignData)
                setApplications(applicationsData as ExtendedApplication[])
            } catch (error) {
                console.error("Failed to fetch data", error)
                toast.error("Erro ao carregar dados")
            } finally {
                setLoading(false)
            }
        }

        if (campaignId) {
            fetchData()
        }
    }, [campaignId])

    const handleApproveClick = async (applicationId: number) => {
        try {
            const status = await termsRepository.check(['brand_approval'])
            if (!status.brand_approval) {
                setPendingApprovalId(applicationId)
                setShowTerms(true)
            } else {
                handleStatusUpdate(applicationId, 'approved')
            }
        } catch (error) {
            console.error("Error checking terms", error)
            // Fallback to direct approval if check fails, or show error
            handleStatusUpdate(applicationId, 'approved')
        }
    }

    const handleTermsAccept = async () => {
        await termsRepository.accept('brand_approval')
        setShowTerms(false)
        if (pendingApprovalId) {
            handleStatusUpdate(pendingApprovalId, 'approved')
            setPendingApprovalId(null)
        }
    }

    const handleExportXLS = () => {
        if (!applications || applications.length === 0) {
            toast.error("Nenhum candidato para exportar.")
            return
        }

        // CSV Header
        const headers = [
            "ID Candidatura",
            "ID Criador",
            "Nome do Criador",
            "Instagram",
            "TikTok",
            "Status",
            "Proposta",
            "Orçamento Proposto",
            "Prazo Estimado (dias)",
            "Data da Candidatura"
        ]

        // CSV Rows
        const rows = applications.map(app => {
            const creator = app.creator || { id: 0, name: "Desconhecido", instagram_handle: "", tiktok_handle: "" }
            
            // Format fields to avoid CSV breakages (wrap in quotes if contains delimiter)
            const cleanText = (text: string | undefined | null) => {
                if (!text) return ""
                return `"${text.toString().replace(/"/g, '""')}"` // Escape double quotes
            }

            return [
                app.id,
                creator.id,
                cleanText(creator.name),
                cleanText(creator.instagram_handle),
                cleanText(creator.tiktok_handle),
                cleanText(app.status === 'pending' ? 'Pendente' : app.status === 'approved' ? 'Aprovado' : 'Rejeitado'),
                cleanText(app.proposal),
                app.proposed_budget || app.budget || 0,
                app.estimated_delivery_days || app.delivery_days || 0,
                cleanText(new Date(app.created_at).toLocaleDateString('pt-BR'))
            ].join(";") // Using semicolon for better Excel compatibility in some regions, or comma
        })

        const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\n") // Add BOM for UTF-8 support in Excel
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `candidatos_campanha_${campaignId}_${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const handleStatusUpdate = async (applicationId: number, status: 'approved' | 'rejected') => {
        setProcessingId(applicationId)
        try {
            const result = await applicationRepository.updateStatus(applicationId, status)

            setApplications(prev => prev.map(app =>
                app.id === applicationId ? { ...app, ...(result.application || {}), status } : app
            ))

            if (status === 'approved') {
                toast.success(
                    result.contract_id
                        ? "Candidato aprovado! Contrato criado e pronto para financiamento."
                        : "Candidato aprovado! O chat foi iniciado automaticamente."
                )

                if (result.chat_room_id) {
                    router.push(`/dashboard/messages?roomId=${result.chat_room_id}`)
                }
            } else {
                toast.success(`Candidato ${status === 'rejected' ? 'rejeitado' : 'atualizado'} com sucesso!`)
            }
        } catch (error) {
            console.error("Failed to update status", error)
            const axiosError = error as AxiosError<{
                message?: string
                requires_stripe_account?: boolean
                requires_funding?: boolean
                redirect_url?: string
            }>
            const statusCode = axiosError.response?.status
            const data = axiosError.response?.data

            if (statusCode === 402 && data) {
                const message =
                    data.message ||
                    (data.requires_stripe_account
                        ? "Você precisa configurar sua conta Stripe antes de aprovar propostas."
                        : data.requires_funding
                            ? "Você precisa configurar um método de pagamento antes de aprovar propostas."
                            : "Não foi possível aprovar a candidatura. Verifique suas configurações de pagamento.")

                toast.error(message)

                if (data.requires_stripe_account) {
                    router.push("/dashboard/payment-methods")
                } else if (data.requires_funding && typeof data.redirect_url === "string" && typeof window !== "undefined") {
                    window.location.href = data.redirect_url
                }
            } else {
                toast.error("Erro ao atualizar status")
            }
        } finally {
            setProcessingId(null)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col gap-6 p-6">
                <Skeleton className="h-8 w-1/3" />
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
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

    const pendingApplications = applications.filter(app => app.status === 'pending')
    const approvedApplications = applications.filter(app => app.status === 'approved')
    const rejectedApplications = applications.filter(app => app.status === 'rejected')

    return (
        <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 min-h-[92vh]">
            <TermsModal
                open={showTerms}
                onOpenChange={setShowTerms}
                title={TERMS_CONTENT.brand_approval.title}
                content={TERMS_CONTENT.brand_approval.content}
                onAccept={handleTermsAccept}
            />

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold">Gerenciar Candidatos</h1>
                        <p className="text-sm text-muted-foreground">{campaign.title}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportXLS}
                        className="gap-2 bg-chart-2 text-white hover:bg-chart-2/90"
                    >
                        <FaFileCsv  className="h-4 w-4" />
                        Exportar XLS
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-xl">
                    <TabsTrigger value="pending" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Pendentes ({pendingApplications.length})
                    </TabsTrigger>
                    <TabsTrigger value="approved" className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Aprovados ({approvedApplications.length})
                    </TabsTrigger>
                    <TabsTrigger value="rejected" className="flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        Rejeitados ({rejectedApplications.length})
                    </TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    <TabsContent value="pending">
                        {pendingApplications.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                Nenhuma candidatura pendente no momento.
                            </div>
                        ) : (
                            <CandidatesTable
                                applications={pendingApplications}
                                onApprove={handleApproveClick}
                                onReject={(id) => handleStatusUpdate(id, 'rejected')}
                                processingId={processingId}
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="approved">
                        {approvedApplications.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                Nenhum candidato aprovado.
                            </div>
                        ) : (
                            <CandidatesTable
                                applications={approvedApplications}
                                readonly
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="rejected">
                        {rejectedApplications.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                Nenhum candidato rejeitado.
                            </div>
                        ) : (
                            <CandidatesTable
                                applications={rejectedApplications}
                                readonly
                            />
                        )}
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    )
}

function CandidatesTable({
    applications,
    onApprove,
    onReject,
    processingId,
    readonly = false
}: {
    applications: ExtendedApplication[],
    onApprove?: (id: number) => void,
    onReject?: (id: number) => void,
    processingId?: number | null,
    readonly?: boolean
}) {
    return (
        <div className="rounded-md border">
            <div className="w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Criador</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Proposta</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Orçamento/Prazo</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Portfólio</th>
                            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                        {applications.map((app) => (
                            <tr key={app.id} className="border-b transition-colors hover:bg-muted/50">
                                <td className="p-4 align-top">
                                    <div className="flex flex-row items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={app.creator?.avatar} />
                                            <AvatarFallback>{app.creator?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-medium">{app.creator?.name}</div>
                                            <div className="flex gap-2 mt-1">
                                                {app.creator?.instagram_handle && (
                                                    <Badge variant="outline" className="text-[10px] bg-pink-50 text-pink-700 border-pink-200">
                                                        {app.creator.instagram_handle}
                                                    </Badge>
                                                )}
                                                {app.creator?.tiktok_handle && (
                                                    <Badge variant="outline" className="text-[10px] bg-black text-white border-black">
                                                        {app.creator.tiktok_handle}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 align-top max-w-75">
                                    <ScrollArea className="h-20">
                                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                                            {app.proposal}
                                        </p>
                                    </ScrollArea>
                                </td>
                                <td className="p-4 align-top">
                                    <div className="space-y-1">
                                        <div className="text-sm font-medium">
                                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                                                Number(app.proposed_budget ?? app.budget ?? 0)
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {((app.estimated_delivery_days ?? app.delivery_days) ?? 0) + " dias"}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 align-top">
                                    <div className="flex flex-col gap-2">
                                        {Array.isArray(app.portfolio_links) && app.portfolio_links.length > 0 ? (
                                            <div className="flex flex-col gap-1">
                                                {app.portfolio_links.map((link, i) => (
                                                    <a
                                                        key={i}
                                                        href={link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1 text-xs text-primary hover:underline truncate max-w-37.5"
                                                    >
                                                        <ExternalLink className="h-3 w-3" />
                                                        Link {i + 1}
                                                    </a>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">Sem links externos</span>
                                        )}

                                        {typeof app.creator?.id === "number" ? (
                                            <Button variant="outline" size="sm" asChild className="w-fit h-7 px-2 text-xs">
                                                <Link href={`/dashboard/creators/${app.creator.id}/portfolio`}>
                                                    <ExternalLink className="mr-1 h-3 w-3" />
                                                    Ver portfólio
                                                </Link>
                                            </Button>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">Criador sem perfil público</span>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4 align-top text-right">
                                    {readonly ? (
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/dashboard/messages?chat=${app.creator_id}`}>
                                                <MessageCircle className="mr-2 h-3 w-3" />
                                                Mensagem
                                            </Link>
                                        </Button>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                                onClick={() => onApprove?.(app.id)}
                                                disabled={processingId === app.id}
                                            >
                                                Aprovar
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                                                onClick={() => onReject?.(app.id)}
                                                disabled={processingId === app.id}
                                            >
                                                Rejeitar
                                            </Button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
