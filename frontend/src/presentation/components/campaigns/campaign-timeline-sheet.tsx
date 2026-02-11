"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Textarea } from '@/presentation/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Badge } from '@/presentation/components/ui/badge'
import { ScrollArea } from '@/presentation/components/ui/scroll-area'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/presentation/components/ui/sheet'
import {
    Clock,
    AlertCircle,
    Upload,
    Download,
    FileText,
    ChevronRight,
    ChevronDown,
    Plus,
    FileVideo,
    Check,
    Ban,
    Package,
    UserCheck,
    DollarSign,
    Archive,
    Video,
    Truck
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useAuth } from '@/presentation/contexts/auth-provider'
import { ApiCampaignTimelineRepository } from '@/infrastructure/repositories/campaign-timeline-repository'
import { ApiContractRepository } from '@/infrastructure/repositories/contract-repository'
import { api } from '@/infrastructure/api/axios-adapter'
import { CampaignMilestone } from '@/domain/entities/milestone'
import { Contract } from '@/domain/entities/contract'

interface CampaignTimelineSheetProps {
    contractId: number
    isOpen: boolean
    onClose: () => void
    variant?: 'sheet' | 'inline'
}

const timelineRepository = new ApiCampaignTimelineRepository(api)
const contractRepository = new ApiContractRepository(api)

export default function CampaignTimelineSheet({ contractId, isOpen, onClose, variant = 'sheet' }: CampaignTimelineSheetProps) {
    const { user } = useAuth()

    const [milestones, setMilestones] = useState<CampaignMilestone[]>([])
    const [contract, setContract] = useState<Contract | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [selectedMilestone, setSelectedMilestone] = useState<CampaignMilestone | null>(null)
    const [showUploadDialog, setShowUploadDialog] = useState(false)
    const [showApprovalDialog, setShowApprovalDialog] = useState(false)
    const [showJustificationDialog, setShowJustificationDialog] = useState(false)
    const [showExtensionDialog, setShowExtensionDialog] = useState(false)
    const [showDelayDialog, setShowDelayDialog] = useState(false)
    const [comment, setComment] = useState('')
    const [justification, setJustification] = useState('')
    const [extensionDays, setExtensionDays] = useState(1)
    const [extensionReason, setExtensionReason] = useState('')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [expandedMilestones, setExpandedMilestones] = useState<Set<number>>(new Set())
    const [approvalMode, setApprovalMode] = useState<'approve' | 'reject'>('approve')

    const getErrorMessage = (error: unknown, fallback: string) => {
        if (error && typeof error === 'object' && 'response' in error) {
            const response = (error as { response?: { data?: { message?: string } } }).response
            if (response?.data?.message) return response.data.message
        }
        if (error instanceof Error && error.message) return error.message
        return fallback
    }
    const loadTimeline = useCallback(async () => {
        try {
            setIsLoading(true)
            const [milestonesData, contractData] = await Promise.all([
                timelineRepository.getTimeline(contractId),
                contractRepository.getContract(contractId)
            ])
            setMilestones(milestonesData)
            setContract(contractData)
        } catch (error: unknown) {
            console.error('Error loading timeline:', error)
            toast.error(getErrorMessage(error, "Erro ao carregar dados"))
        } finally {
            setIsLoading(false)
        }
    }, [contractId])

    useEffect(() => {
        if (isOpen && contractId) {
            loadTimeline()
        }
    }, [isOpen, contractId, loadTimeline])

    const createMilestones = async () => {
        try {
            setIsLoading(true)
            await timelineRepository.createMilestones(contractId)
            toast.success("Milestones criados com sucesso")
            loadTimeline()
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, "Erro ao criar milestones"))
        } finally {
            setIsLoading(false)
        }
    }

    const handleFileUpload = async (milestoneId: number) => {
        if (!selectedFile) return

        try {
            setIsUploading(true)
            const response = await timelineRepository.uploadFile(milestoneId, selectedFile)
            if (response.success) {
                toast.success("Arquivo enviado com sucesso")
                setShowUploadDialog(false)
                setSelectedFile(null)
                loadTimeline()
            }
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, "Erro ao enviar arquivo"))
        } finally {
            setIsUploading(false)
        }
    }

    const handleApproval = async (milestoneId: number, isApproved: boolean) => {
        try {
            const response = isApproved
                ? await timelineRepository.approveMilestone(milestoneId, comment)
                : await timelineRepository.rejectMilestone(milestoneId, comment)

            if (response.success) {
                toast.success(isApproved ? "Milestone aprovado com sucesso" : "Milestone rejeitado com sucesso")
                setShowApprovalDialog(false)
                setComment('')
                loadTimeline()
            }
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, "Erro ao processar milestone"))
        }
    }

    const handleJustification = async (milestoneId: number) => {
        try {
            const response = await timelineRepository.justifyDelay(milestoneId, justification)
            if (response.success) {
                toast.success("Atraso justificado com sucesso")
                setShowJustificationDialog(false)
                setJustification('')
                loadTimeline()
            }
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, "Erro ao justificar atraso"))
        }
    }

    const handleMarkDelayed = async (milestoneId: number) => {
        try {
            const response = await timelineRepository.markDelayed(milestoneId, justification || undefined)
            if (response.success) {
                toast.success("Atraso registrado com sucesso")
                setShowDelayDialog(false)
                setJustification('')
                loadTimeline()
            }
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, "Erro ao registrar atraso"))
        }
    }

    const handleExtension = async (milestoneId: number) => {
        try {
            const response = await timelineRepository.extendTimeline(milestoneId, extensionDays, extensionReason)
            if (response.success) {
                toast.success("Prazo estendido com sucesso")
                setShowExtensionDialog(false)
                setExtensionDays(1)
                setExtensionReason('')
                loadTimeline()
            }
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, "Erro ao estender prazo"))
        }
    }

    const handleFinalizeContract = async () => {
        if (!confirm("Tem certeza que deseja finalizar esta campanha e liberar o pagamento? Esta ação é irreversível.")) return

        try {
            setIsLoading(true)
            const response = await timelineRepository.completeContract(contractId)
            if (response.success) {
                toast.success("Campanha finalizada com sucesso! O pagamento está sendo processado.")
                loadTimeline()
            }
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, "Erro ao finalizar campanha"))
        } finally {
            setIsLoading(false)
        }
    }

    const handleLogisticsUpdate = async (status: string) => {
        try {
            setIsLoading(true)
            await contractRepository.updateWorkflowStatus(contractId, status)
            toast.success("Status de logística atualizado com sucesso")
            loadTimeline()
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, "Erro ao atualizar logística"))
        } finally {
            setIsLoading(false)
        }
    }

    const handleDownloadFile = async (milestoneId: number) => {
        try {
            const fileInfo = await timelineRepository.downloadFile(milestoneId)
            if (!fileInfo?.download_url) {
                toast.error("Arquivo indisponível para download")
                return
            }
            window.open(fileInfo.download_url, '_blank')
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, "Erro ao baixar arquivo"))
        }
    }

    const getMilestoneIcon = (milestoneType: string) => {
        switch (milestoneType) {
            case 'script_submission': return <FileText className="w-5 h-5 text-primary" />
            case 'script_approval': return <Check className="w-5 h-5 text-green-600" />
            case 'video_submission': return <FileVideo className="w-5 h-5 text-blue-600" />
            case 'final_approval': return <Check className="w-5 h-5 text-green-700" />
            default: return <Clock className="w-5 h-5 text-primary" />
        }
    }

    const getMilestoneStatusLabel = (status: CampaignMilestone["status"]) => {
        switch (status) {
            case 'pending': return 'Pendente'
            case 'approved': return 'Aprovado'
            case 'rejected': return 'Rejeitado'
            case 'completed': return 'Concluído'
            case 'delayed': return 'Atrasado'
            default: return 'Indefinido'
        }
    }

    const getMilestoneStatusColor = (status: CampaignMilestone["status"]) => {
        switch (status) {
            case 'pending': return 'bg-yellow-500/20 text-yellow-700'
            case 'approved': return 'bg-blue-500/20 text-blue-700'
            case 'rejected': return 'bg-red-500/20 text-red-700'
            case 'completed': return 'bg-green-500/20 text-green-700'
            case 'delayed': return 'bg-orange-500/20 text-orange-700'
            default: return 'bg-muted text-muted-foreground'
        }
    }

    const scriptMilestones = milestones.filter(m => ['script_submission', 'script_approval'].includes(m.milestone_type))
    const productionMilestones = milestones.filter(m => m.milestone_type === 'video_submission')
    const approvalMilestones = milestones.filter(m => m.milestone_type === 'final_approval')

    const renderMilestoneList = (milestonesToRender: CampaignMilestone[]) => {
        if (milestonesToRender.length === 0) return <div className="p-3 border rounded-md border-dashed text-xs text-muted-foreground text-center">Aguardando etapa anterior...</div>
        
        return (
            <div className="space-y-3 mt-3">
                {milestonesToRender.map((milestone) => {
                    const isExpanded = expandedMilestones.has(milestone.id)
                    const canUpload = milestone.can_upload_file && user?.role === 'creator'
                    const canApprove = milestone.can_be_approved && user?.role === 'brand'
                    const canExtend = milestone.can_be_extended && user?.role === 'brand'
                    const canJustify = milestone.can_justify_delay && user?.role === 'brand'
                    const canMarkDelayed = milestone.is_overdue && !milestone.is_delayed && (user?.role === 'brand' || user?.role === 'creator')

                    return (
                        <Card key={milestone.id} className={cn(
                            "transition-all duration-200 border-l-4 shadow-xs",
                            milestone.status === 'completed' || milestone.status === 'approved' ? "border-l-green-500" : "border-l-primary",
                            milestone.is_overdue && "border-destructive/30 bg-destructive/5 border-l-destructive"
                        )}>
                            <CardHeader className="p-3 flex flex-row items-center justify-between space-y-0 cursor-pointer"
                                onClick={() => {
                                    const newExpanded = new Set(expandedMilestones)
                                    if (isExpanded) newExpanded.delete(milestone.id)
                                    else newExpanded.add(milestone.id)
                                    setExpandedMilestones(newExpanded)
                                }}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    {getMilestoneIcon(milestone.milestone_type)}
                                    <div className="flex flex-col min-w-0">
                                        <CardTitle className="text-sm font-medium truncate">{milestone.title}</CardTitle>
                                        <p className="text-[10px] text-muted-foreground">{milestone.formatted_deadline}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={cn("text-[10px]", getMilestoneStatusColor(milestone.status))}>
                                        {getMilestoneStatusLabel(milestone.status)}
                                    </Badge>
                                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </div>
                            </CardHeader>

                            {isExpanded && (
                                <CardContent className="p-3 pt-0 space-y-3">
                                    {milestone.description && (
                                        <p className="text-xs text-muted-foreground">{milestone.description}</p>
                                    )}

                                    {milestone.is_overdue && (
                                        <p className="text-[10px] font-medium text-destructive">
                                            {milestone.days_overdue} dias de atraso
                                        </p>
                                    )}

                                    {milestone.formatted_completed_at && (
                                        <p className="text-[10px] text-muted-foreground">
                                            Concluído em {milestone.formatted_completed_at}
                                        </p>
                                    )}

                                    {milestone.justification && (
                                        <div className="text-[10px] text-muted-foreground">
                                            Justificativa: <span className="text-foreground">{milestone.justification}</span>
                                        </div>
                                    )}

                                    {milestone.comment && (
                                        <div className="text-[10px] text-muted-foreground">
                                            Comentário: <span className="text-foreground">{milestone.comment}</span>
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-2">
                                        {canUpload && (
                                            <Button size="sm" onClick={() => {
                                                setSelectedMilestone(milestone)
                                                setShowUploadDialog(true)
                                            }}>
                                                <Upload className="w-3 h-3 mr-2" />
                                                {milestone.milestone_type === 'script_submission' ? 'Enviar Script' : 'Enviar Arquivo'}
                                            </Button>
                                        )}

                                        {canApprove && (
                                            <div className="flex gap-2">
                                                <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => {
                                                    setSelectedMilestone(milestone)
                                                    setApprovalMode('approve')
                                                    setComment('')
                                                    setShowApprovalDialog(true)
                                                }}>
                                                    <Check className="w-3 h-3 mr-2" />
                                                    Aprovar
                                                </Button>
                                                <Button size="sm" variant="outline" className="flex-1 text-destructive hover:bg-destructive/10" onClick={() => {
                                                    setSelectedMilestone(milestone)
                                                    setApprovalMode('reject')
                                                    setComment('')
                                                    setShowApprovalDialog(true)
                                                }}>
                                                    <Ban className="w-3 h-3 mr-2" />
                                                    Rejeitar
                                                </Button>
                                            </div>
                                        )}

                                        {canMarkDelayed && (
                                            <Button size="sm" variant="outline" className="border-orange-500 text-orange-600" onClick={() => {
                                                setSelectedMilestone(milestone)
                                                setShowDelayDialog(true)
                                            }}>
                                                <AlertCircle className="w-3 h-3 mr-2" />
                                                Marcar atraso
                                            </Button>
                                        )}

                                        {canJustify && (
                                            <Button size="sm" variant="outline" className="border-orange-500 text-orange-600" onClick={() => {
                                                setSelectedMilestone(milestone)
                                                setShowJustificationDialog(true)
                                            }}>
                                                <AlertCircle className="w-3 h-3 mr-2" />
                                                Justificar atraso
                                            </Button>
                                        )}

                                        {canExtend && (
                                            <Button size="sm" variant="outline" onClick={() => {
                                                setSelectedMilestone(milestone)
                                                setShowExtensionDialog(true)
                                            }}>
                                                <Clock className="w-3 h-3 mr-2" />
                                                Estender prazo
                                            </Button>
                                        )}
                                    </div>

                                    {milestone.file_path && (
                                        <div className="flex items-center justify-between p-2 bg-muted rounded-md text-xs">
                                            <span className="truncate flex-1 mr-2">{milestone.file_name}</span>
                                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleDownloadFile(milestone.id)}>
                                                <Download className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    )}

                                    {milestone.delivery_materials && milestone.delivery_materials.length > 0 && (
                                        <div className="space-y-2">
                                            <div className="text-[10px] font-medium text-muted-foreground">Materiais enviados</div>
                                            {milestone.delivery_materials.map((material) => (
                                                <div key={material.id} className="flex items-center justify-between p-2 bg-muted rounded-md text-xs">
                                                    <span className="truncate flex-1 mr-2">{material.file_name}</span>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-6 w-6"
                                                        onClick={() => window.open(`/delivery-materials/${material.id}/download`, '_blank')}
                                                    >
                                                        <Download className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            )}
                        </Card>
                    )
                })}
            </div>
        )
    }

    const paymentWorkflowStatus = contract?.workflow_status
    const isPaymentCompleted = paymentWorkflowStatus === 'payment_available' || paymentWorkflowStatus === 'payment_withdrawn'
    const isPaymentActive = paymentWorkflowStatus === 'payment_pending' || paymentWorkflowStatus === 'waiting_review'
    const paymentStatusLabel = isPaymentCompleted
        ? "Pagamento liberado"
        : paymentWorkflowStatus === 'payment_pending'
          ? "Pagamento pendente"
          : paymentWorkflowStatus === 'waiting_review'
            ? "Aguardando review"
            : "Aguardando conclusão"

    const steps = [
        {
            id: 1,
            title: "Contratação do Criador",
            icon: UserCheck,
            status: 'completed',
            description: "Contrato aprovado e ativo",
            content: null
        },
        {
            id: 2,
            title: "Alinhamento e Logística",
            icon: Package,
            status: ['material_sent', 'product_sent', 'product_received', 'production_started'].includes(contract?.workflow_status || '') ? 'completed' : 'current',
            description: "Envio e recebimento de produtos",
            content: (
                <div className="mt-3 p-3 bg-muted/30 rounded-lg border space-y-3">
                    {contract?.workflow_status === 'active' && (
                        <div className="flex flex-col gap-2">
                            <p className="text-xs text-muted-foreground">Aguardando envio de material pela marca.</p>
                            {user?.role === 'brand' ? (
                                <Button size="sm" onClick={() => handleLogisticsUpdate('material_sent')} disabled={isLoading}>
                                    <Truck className="w-3 h-3 mr-2" />
                                    Marcar Material Enviado
                                </Button>
                            ) : (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted p-2 rounded">
                                    <Clock className="w-3 h-3" />
                                    Aguardando a marca enviar o material
                                </div>
                            )}
                        </div>
                    )}
                    {['material_sent', 'product_sent'].includes(contract?.workflow_status || '') && (
                        <div className="flex flex-col gap-2">
                            <p className="text-xs text-muted-foreground">Material enviado. Aguardando confirmação do criador.</p>
                            {user?.role === 'creator' ? (
                                <Button size="sm" onClick={() => handleLogisticsUpdate('product_received')} disabled={isLoading}>
                                    <Package className="w-3 h-3 mr-2" />
                                    Confirmar Recebimento
                                </Button>
                            ) : (
                                <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                                    <Truck className="w-3 h-3" />
                                    Material enviado. Aguardando criador confirmar.
                                </div>
                            )}
                        </div>
                    )}
                    {['product_received', 'production_started'].includes(contract?.workflow_status || '') && (
                        <div className="flex items-center gap-2 text-green-600 text-xs bg-green-50 p-2 rounded border border-green-100">
                            <Check className="w-3 h-3" />
                            <span>Produto recebido. Produção liberada.</span>
                        </div>
                    )}
                </div>
            )
        },
        {
            id: 3,
            title: "Roteiro e Planejamento",
            icon: FileText,
            status: scriptMilestones.some(m => m.status === 'completed' || m.status === 'approved') ? 'completed' : (scriptMilestones.length > 0 ? 'current' : 'pending'),
            description: "Criação e aprovação do roteiro",
            content: renderMilestoneList(scriptMilestones)
        },
        {
            id: 4,
            title: "Produção de Conteúdo",
            icon: Video,
            status: productionMilestones.some(m => m.status === 'completed' || m.status === 'approved') ? 'completed' : (productionMilestones.length > 0 && scriptMilestones.every(m => m.status === 'approved') ? 'current' : 'pending'),
            description: "Gravação e envio do material",
            content: renderMilestoneList(productionMilestones)
        },
        {
            id: 5,
            title: "Aprovação Final",
            icon: Check,
            status: approvalMilestones.some(m => m.status === 'completed' || m.status === 'approved') ? 'completed' : (approvalMilestones.length > 0 && productionMilestones.every(m => m.status === 'approved') ? 'current' : 'pending'),
            description: "Aprovação final pela marca",
            content: renderMilestoneList(approvalMilestones)
        },
        {
            id: 6,
            title: "Pagamento",
            icon: DollarSign,
            status: isPaymentCompleted ? 'completed' : isPaymentActive ? 'current' : 'pending',
            description: paymentStatusLabel,
            content: null
        },
        {
            id: 7,
            title: "Encerramento",
            icon: Archive,
            status: contract?.status === 'completed' ? 'completed' : 'pending',
            description: "Conclusão do contrato",
            content: user?.role === 'brand' && contract?.status === 'active' && approvalMilestones.some(m => m.status === 'approved') ? (
                 <Button onClick={handleFinalizeContract} className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white" size="sm">
                    <Check className="w-4 h-4 mr-2" />
                    Finalizar Campanha e Liberar Pagamento
                 </Button>
            ) : null
        }
    ]

    const content = (
        <>
            <SheetHeader className="p-4 border-b bg-background sticky top-0 z-10">
                <SheetTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Fluxo da Campanha
                </SheetTitle>
            </SheetHeader>

            <ScrollArea className="flex-1 bg-muted/5">
                <div className="p-4 space-y-0 relative">
                    {/* Vertical Line */}
                    <div className="absolute left-7.75 top-8 bottom-8 w-0.5 bg-border -z-10" />

                    {steps.map((step) => (
                        <div key={step.id} className="relative pb-8 last:pb-0">
                            <div className="flex items-start gap-4">
                                <div className={cn(
                                    "flex items-center justify-center w-8 h-8 rounded-full border-2 bg-background z-10 transition-colors shrink-0",
                                    step.status === 'completed' ? "border-green-500 text-green-600" :
                                    step.status === 'current' ? "border-primary text-primary" : "border-muted-foreground/30 text-muted-foreground"
                                )}>
                                    <step.icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0 pt-1">
                                    <div className="flex items-center justify-between">
                                        <h3 className={cn("text-sm font-semibold", step.status === 'pending' && "text-muted-foreground")}>
                                            {step.title}
                                        </h3>
                                        {step.status === 'completed' && <Check className="w-4 h-4 text-green-500" />}
                                    </div>
                                    <p className="text-xs text-muted-foreground">{step.description}</p>
                                    
                                    {step.content}
                                </div>
                            </div>
                        </div>
                    ))}

                    {milestones.length === 0 && !isLoading && (
                         <div className="text-center py-12 space-y-4">
                            <p className="text-muted-foreground text-xs">Nenhum dado encontrado. Crie milestones para iniciar.</p>
                            {user?.role === 'brand' && (
                                <Button onClick={createMilestones} size="sm" variant="outline">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Criar Milestones
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </ScrollArea>

            {showUploadDialog && (
                <div className="p-4 border-t bg-card space-y-4">
                    <h4 className="text-sm font-semibold">Enviar material</h4>
                    <Input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                    {selectedFile && (
                        <div className="text-[10px] text-muted-foreground">
                            {selectedFile.name}
                        </div>
                    )}
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowUploadDialog(false)}>Cancelar</Button>
                        <Button size="sm" className="flex-1" disabled={!selectedFile || isUploading} onClick={() => handleFileUpload(selectedMilestone!.id)}>
                            {isUploading ? "Enviando..." : "Enviar"}
                        </Button>
                    </div>
                </div>
            )}

            {showApprovalDialog && (
                <div className="p-4 border-t bg-card space-y-4">
                    <h4 className="text-sm font-semibold">{approvalMode === 'approve' ? "Aprovar milestone" : "Rejeitar milestone"}</h4>
                    <Textarea placeholder="Comentário (opcional)" value={comment} onChange={(e) => setComment(e.target.value)} />
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowApprovalDialog(false)}>Voltar</Button>
                        <Button
                            size="sm"
                            className={cn("flex-1", approvalMode === 'approve' ? "bg-green-600 hover:bg-green-700" : "bg-destructive hover:bg-destructive/90")}
                            onClick={() => handleApproval(selectedMilestone!.id, approvalMode === 'approve')}
                        >
                            {approvalMode === 'approve' ? "Confirmar" : "Rejeitar"}
                        </Button>
                    </div>
                </div>
            )}

            {showJustificationDialog && (
                <div className="p-4 border-t bg-card space-y-4">
                    <h4 className="text-sm font-semibold">Justificar atraso</h4>
                    <Textarea placeholder="Descreva o motivo..." value={justification} onChange={(e) => setJustification(e.target.value)} />
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowJustificationDialog(false)}>Cancelar</Button>
                        <Button size="sm" className="flex-1 bg-orange-600" disabled={!justification.trim()} onClick={() => handleJustification(selectedMilestone!.id)}>Enviar</Button>
                    </div>
                </div>
            )}

            {showDelayDialog && (
                <div className="p-4 border-t bg-card space-y-4">
                    <h4 className="text-sm font-semibold">Marcar atraso</h4>
                    <Textarea placeholder="Descreva o motivo (opcional)..." value={justification} onChange={(e) => setJustification(e.target.value)} />
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowDelayDialog(false)}>Cancelar</Button>
                        <Button size="sm" className="flex-1 bg-orange-600" onClick={() => handleMarkDelayed(selectedMilestone!.id)}>Enviar</Button>
                    </div>
                </div>
            )}

            {showExtensionDialog && (
                <div className="p-4 border-t bg-card space-y-4">
                    <h4 className="text-sm font-semibold">Estender prazo</h4>
                    <div className="space-y-2">
                        <Input
                            type="number"
                            min="1"
                            value={extensionDays}
                            onChange={(e) => setExtensionDays(Number(e.target.value))}
                        />
                        <Textarea
                            placeholder="Motivo da extensão"
                            value={extensionReason}
                            onChange={(e) => setExtensionReason(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowExtensionDialog(false)}>Cancelar</Button>
                        <Button size="sm" className="flex-1" disabled={!extensionReason.trim() || extensionDays < 1} onClick={() => handleExtension(selectedMilestone!.id)}>
                            Confirmar
                        </Button>
                    </div>
                </div>
            )}
        </>
    )

    if (variant === 'inline') {
        if (!isOpen) return null
        return (
            <div className="flex h-full flex-col rounded-lg border bg-background overflow-hidden">
                {content}
            </div>
        )
    }

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-hidden flex flex-col">
                {content}
            </SheetContent>
        </Sheet>
    )
}
