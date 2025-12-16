"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle, XCircle, Clock, MessageCircle } from "lucide-react"
import Link from "next/link"

import { ApiApplicationRepository } from "@/infrastructure/repositories/application-repository"
import { ApiCampaignRepository } from "@/infrastructure/repositories/campaign-repository"
import { ApiContractRepository } from "@/infrastructure/repositories/contract-repository"
import { api } from "@/infrastructure/api/axios-adapter"
import { Application } from "@/domain/entities/application"
import { Campaign } from "@/domain/entities/campaign"

import { Button } from "@/presentation/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/presentation/components/ui/avatar"
import { Skeleton } from "@/presentation/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/presentation/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/presentation/components/ui/tabs"
import { toast } from "sonner"

const applicationRepository = new ApiApplicationRepository(api)
const campaignRepository = new ApiCampaignRepository(api)
const contractRepository = new ApiContractRepository(api)

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

    const handleStatusUpdate = async (applicationId: number, status: 'approved' | 'rejected') => {
        setProcessingId(applicationId)
        try {
            await applicationRepository.updateStatus(applicationId, status)
            
            // Automatic contract generation on approval
            if (status === 'approved' && campaign) {
                const application = applications.find(app => app.id === applicationId)
                if (application) {
                    try {
                        await contractRepository.create({
                            campaign_id: campaign.id,
                            creator_id: application.creator_id,
                            brand_id: campaign.brand_id,
                            amount: application.budget || campaign.budget,
                            title: `Contrato: ${campaign.title}`,
                            status: 'pending',
                            description: `Contrato gerado automaticamente para a campanha ${campaign.title}`
                        })
                        toast.success("Contrato gerado automaticamente!")
                    } catch (contractError) {
                        console.error("Failed to create contract", contractError)
                        toast.error("Candidato aprovado, mas houve erro ao gerar contrato.")
                    }
                }
            }

            setApplications(prev => prev.map(app => 
                app.id === applicationId ? { ...app, status } : app
            ))
            
            if (status !== 'approved') {
                toast.success(`Candidato ${status === 'rejected' ? 'rejeitado' : 'atualizado'} com sucesso!`)
            }
        } catch (error) {
            console.error("Failed to update status", error)
            toast.error("Erro ao atualizar status")
        } finally {
            setProcessingId(null)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col gap-6 p-6">
                <Skeleton className="h-8 w-1/3" />
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-[250px] w-full" />)}
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
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-xl font-semibold">Gerenciar Candidatos</h1>
                    <p className="text-sm text-muted-foreground">{campaign.title}</p>
                </div>
            </div>

            <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-[600px]">
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
                                        onApprove={() => handleStatusUpdate(app.id, 'approved')}
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
                <div>
                    <h4 className="text-sm font-medium mb-1">Proposta</h4>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                        {application.proposal}
                    </p>
                </div>
                {application.budget && (
                    <div className="flex justify-between items-center text-sm bg-muted p-2 rounded">
                        <span>Orçamento proposto:</span>
                        <span className="font-semibold">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(application.budget)}
                        </span>
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
