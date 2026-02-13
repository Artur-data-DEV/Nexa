"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle, XCircle, Clock, MessageCircle, Download } from "lucide-react"
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
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/presentation/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/presentation/components/ui/tabs"
import { toast } from "sonner"
import { TermsModal } from "@/presentation/components/terms/terms-modal"
import { TERMS_CONTENT } from "@/presentation/components/terms/terms-content"
import { FaFileCsv } from "react-icons/fa6";

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
            await applicationRepository.updateStatus(applicationId, status)

            setApplications(prev => prev.map(app =>
                app.id === applicationId ? { ...app, status } : app
            ))

            if (status === 'approved') {
                toast.success("Candidato aprovado! O chat foi iniciado automaticamente.")
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
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full" />)}
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
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {pendingApplications.map(app => (
                                    <CandidateCard
                                        key={app.id}
                                        application={app}
                                        onApprove={() => handleApproveClick(app.id)}
                                        onReject={() => handleStatusUpdate(app.id, 'rejected')}
                                        isProcessing={processingId === app.id}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="approved">
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {approvedApplications.map(app => (
                                <CandidateCard key={app.id} application={app} readonly />
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="rejected">
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {rejectedApplications.map(app => (
                                <CandidateCard key={app.id} application={app} readonly />
                            ))}
                        </div>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    )
}

function CandidateCard({
    application,
    onApprove,
    onReject,
    isProcessing,
    readonly = false
}: {
    application: ExtendedApplication,
    onApprove?: () => void,
    onReject?: () => void,
    isProcessing?: boolean,
    readonly?: boolean
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center gap-4">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={application.creator?.avatar} />
                    <AvatarFallback>{application.creator?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-base">{application.creator?.name}</CardTitle>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        {application.creator?.instagram_handle && (
                            <span className="bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">
                                {application.creator.instagram_handle}
                            </span>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <h4 className="text-sm font-medium">Proposta do criador</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {application.proposal}
                    </p>
                </div>
                <div className="grid gap-2 text-sm">
                    {typeof application.proposed_budget === "number" || application.proposed_budget ? (
                        <div className="flex justify-between items-center bg-muted p-2 rounded">
                            <span>Orçamento proposto</span>
                            <span className="font-semibold">
                                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                                    Number(application.proposed_budget ?? application.budget ?? 0)
                                )}
                            </span>
                        </div>
                    ) : application.budget ? (
                        <div className="flex justify-between items-center bg-muted p-2 rounded">
                            <span>Orçamento proposto</span>
                            <span className="font-semibold">
                                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(application.budget)}
                            </span>
                        </div>
                    ) : null}
                    {(application.estimated_delivery_days || application.delivery_days) && (
                        <div className="flex justify-between items-center bg-muted p-2 rounded">
                            <span>Prazo estimado</span>
                            <span className="font-semibold">
                                {((application.estimated_delivery_days ?? application.delivery_days) ?? 0) + " dias"}
                            </span>
                        </div>
                    )}
                </div>
                {Array.isArray(application.portfolio_links) && application.portfolio_links.length > 0 && (
                    <div className="space-y-1">
                        <h4 className="text-sm font-medium">Portfólio</h4>
                        <ul className="space-y-1">
                            {application.portfolio_links.map((link: string, index: number) => (
                                <li key={index}>
                                    <a
                                        href={link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-primary underline break-all"
                                    >
                                        {link}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex gap-2">
                {readonly ? (
                    <Button variant="outline" className="w-full" asChild>
                        <Link href={`/dashboard/messages?chat=${application.creator_id}`}>
                            <MessageCircle className="mr-2 h-4 w-4" />
                            Mensagem
                        </Link>
                    </Button>
                ) : (
                    <>
                        <Button
                            variant="outline"
                            className="flex-1 border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700"
                            onClick={onReject}
                            disabled={isProcessing}
                        >
                            Rejeitar
                        </Button>
                        <Button
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            onClick={onApprove}
                            disabled={isProcessing}
                        >
                            Aprovar
                        </Button>
                    </>
                )}
            </CardFooter>
        </Card>
    )
}
