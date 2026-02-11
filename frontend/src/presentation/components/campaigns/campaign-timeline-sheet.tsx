"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Textarea } from '@/presentation/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Alert, AlertDescription } from '@/presentation/components/ui/alert'
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
    AlertTriangle,
    FileVideo,
    Check,
    Ban
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useAuth } from '@/presentation/contexts/auth-provider'
import { ApiCampaignTimelineRepository } from '@/infrastructure/repositories/campaign-timeline-repository'
import { ApiContractRepository } from '@/infrastructure/repositories/contract-repository'
import { api } from '@/infrastructure/api/axios-adapter'
import { CampaignMilestone } from '@/domain/entities/milestone'
import { Contract } from '@/domain/entities/contract'
import type { AxiosError } from 'axios'

interface CampaignTimelineSheetProps {
    contractId: number
    isOpen: boolean
    onClose: () => void
}

const timelineRepository = new ApiCampaignTimelineRepository(api)
const contractRepository = new ApiContractRepository(api)

export default function CampaignTimelineSheet({ contractId, isOpen, onClose }: CampaignTimelineSheetProps) {
    const { user } = useAuth()

    const [milestones, setMilestones] = useState<CampaignMilestone[]>([])
    const [contract, setContract] = useState<Contract | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [selectedMilestone, setSelectedMilestone] = useState<CampaignMilestone | null>(null)
    const [showUploadDialog, setShowUploadDialog] = useState(false)
    const [showApprovalDialog, setShowApprovalDialog] = useState(false)
    const [showJustificationDialog, setShowJustificationDialog] = useState(false)
    const [showExtensionDialog, setShowExtensionDialog] = useState(false)
    const [comment, setComment] = useState('')
    const [justification, setJustification] = useState('')
    const [extensionDays, setExtensionDays] = useState(1)
    const [extensionReason, setExtensionReason] = useState('')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [expandedMilestones, setExpandedMilestones] = useState<Set<number>>(new Set())
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
            const axiosError = error as AxiosError<{ message?: string }>
            console.error('Error loading timeline:', axiosError)
            toast.error(axiosError.response?.data?.message || axiosError.message || "Erro ao carregar dados")
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
            const axiosError = error as AxiosError<{ message?: string }>
            toast.error(axiosError.response?.data?.message || axiosError.message || "Erro ao criar milestones")
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
            const axiosError = error as AxiosError<{ message?: string }>
            toast.error(axiosError.response?.data?.message || axiosError.message || "Erro ao enviar arquivo")
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
            const axiosError = error as AxiosError<{ message?: string }>
            toast.error(axiosError.response?.data?.message || axiosError.message || "Erro ao processar milestone")
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
            const axiosError = error as AxiosError<{ message?: string }>
            toast.error(axiosError.response?.data?.message || axiosError.message || "Erro ao justificar atraso")
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
            const axiosError = error as AxiosError<{ message?: string }>
            toast.error(axiosError.response?.data?.message || axiosError.message || "Erro ao estender prazo")
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
            const axiosError = error as AxiosError<{ message?: string }>
            toast.error(axiosError.response?.data?.message || axiosError.message || "Erro ao finalizar campanha")
        } finally {
            setIsLoading(false)
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

    const hasOverdueMilestones = milestones.some(m => m.is_overdue)
    const hasDelayedMilestones = milestones.some(m => m.is_delayed)

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-hidden flex flex-col">
                <SheetHeader className="p-4 border-b">
                    <SheetTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
                        Linha do Tempo
                    </SheetTitle>
                </SheetHeader>

                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-4">
                        {(hasOverdueMilestones || hasDelayedMilestones) && (
                            <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    {hasOverdueMilestones ? "Existem milestones atrasados." : "Existem milestones com atraso justificado."}
                                </AlertDescription>
                            </Alert>
                        )}

                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                            </div>
                        ) : milestones.length === 0 ? (
                            <div className="text-center py-12 space-y-4">
                                <Clock className="w-12 h-12 text-muted-foreground mx-auto opacity-20" />
                                <p className="text-muted-foreground">Nenhum milestone encontrado</p>
                                {user?.role === 'brand' && (
                                    <Button onClick={createMilestones}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Criar Milestones
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {milestones.map((milestone) => {
                                    const isExpanded = expandedMilestones.has(milestone.id)
                                    const canUpload = milestone.can_upload_file && user?.role === 'creator'
                                    const canApprove = milestone.can_be_approved && user?.role === 'brand'
                                    const canJustify = milestone.can_justify_delay && user?.role === 'creator'
                                    const canExtend = milestone.can_be_extended && user?.role === 'brand'

                                    return (
                                        <Card key={milestone.id} className={cn(
                                            "transition-all duration-200",
                                            milestone.is_overdue && "border-destructive/30 bg-destructive/5"
                                        )}>
                                            <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 cursor-pointer"
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
                                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                            </CardHeader>

                                            {isExpanded && (
                                                <CardContent className="p-4 pt-0 space-y-4">
                                                    <p className="text-xs text-muted-foreground">{milestone.description}</p>

                                                    {milestone.is_overdue && (
                                                        <p className="text-[10px] font-medium text-destructive">
                                                            {milestone.days_overdue} dias de atraso
                                                        </p>
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
                                                                    setComment('')
                                                                    setShowApprovalDialog(true)
                                                                }}>
                                                                    <Check className="w-3 h-3 mr-2" />
                                                                    Aprovar
                                                                </Button>
                                                                <Button size="sm" variant="outline" className="flex-1 text-destructive hover:bg-destructive/10" onClick={() => {
                                                                    setSelectedMilestone(milestone)
                                                                    setComment('')
                                                                    setShowApprovalDialog(true)
                                                                }}>
                                                                    <Ban className="w-3 h-3 mr-2" />
                                                                    Rejeitar
                                                                </Button>
                                                            </div>
                                                        )}

                                                        {canJustify && milestone.is_overdue && (
                                                            <Button size="sm" variant="outline" className="border-orange-500 text-orange-600" onClick={() => {
                                                                setSelectedMilestone(milestone)
                                                                setShowJustificationDialog(true)
                                                            }}>
                                                                <AlertCircle className="w-3 h-3 mr-2" />
                                                                Justificar Atraso
                                                            </Button>
                                                        )}

                                                        {canExtend && (
                                                            <Button size="sm" variant="outline" onClick={() => {
                                                                setSelectedMilestone(milestone)
                                                                setShowExtensionDialog(true)
                                                            }}>
                                                                <Clock className="w-3 h-3 mr-2" />
                                                                Estender Prazo
                                                            </Button>
                                                        )}
                                                    </div>

                                                    {milestone.file_path && (
                                                        <div className="flex items-center justify-between p-2 bg-muted rounded-md text-xs">
                                                            <span className="truncate flex-1 mr-2">{milestone.file_name}</span>
                                                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => window.open(`/api/download/${milestone.file_path}`, '_blank')}>
                                                                <Download className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            )}
                                        </Card>
                                    )
                                })}

                                {user?.role === 'brand' && contract?.status === 'active' && (
                                    <div className="pt-4 border-t">
                                        <Button
                                            className="w-full h-12 bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold"
                                            onClick={handleFinalizeContract}
                                        >
                                            <Check className="w-5 h-5 mr-2" />
                                            Finalizar Campanha
                                        </Button>
                                        <p className="text-[10px] text-muted-foreground text-center mt-2 px-4 italic">
                                            Ao finalizar, você confirma que recebeu o material e libera o pagamento para o criador.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </ScrollArea>

                { }
                {showUploadDialog && (
                    <div className="p-4 border-t bg-card space-y-4">
                        <h4 className="text-sm font-semibold">Enviar material</h4>
                        <Input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
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
                        <h4 className="text-sm font-semibold">Avaliar milestone</h4>
                        <Textarea placeholder="Comentário (opcional)" value={comment} onChange={(e) => setComment(e.target.value)} />
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowApprovalDialog(false)}>Voltar</Button>
                            <Button size="sm" className="flex-1 bg-green-600" onClick={() => handleApproval(selectedMilestone!.id, true)}>Confirmar</Button>
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
                {showExtensionDialog && (
                    <div className="p-4 border-t bg-card space-y-4">
                        <h4 className="text-sm font-semibold">Estender prazo</h4>
                        <div className="space-y-3">
                            <Input
                                type="number"
                                min={1}
                                value={extensionDays}
                                onChange={(e) => setExtensionDays(Number(e.target.value))}
                            />
                            <Textarea
                                placeholder="Descreva o motivo..."
                                value={extensionReason}
                                onChange={(e) => setExtensionReason(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowExtensionDialog(false)}>Cancelar</Button>
                            <Button size="sm" className="flex-1" disabled={!extensionReason.trim()} onClick={() => handleExtension(selectedMilestone!.id)}>Enviar</Button>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    )
}
