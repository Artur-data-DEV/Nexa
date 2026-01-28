"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/presentation/components/ui/card"
import { Button } from "@/presentation/components/ui/button"
import { Badge } from "@/presentation/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/presentation/components/ui/dialog"
import { Textarea } from "@/presentation/components/ui/textarea"
import { Skeleton } from "@/presentation/components/ui/skeleton"
import {
    GraduationCap,
    CheckCircle,
    XCircle,
    Eye,
    FileText,
    Calendar,
    School,
    RefreshCw
} from "lucide-react"
import { api } from "@/infrastructure/api/axios-adapter"
import { toast } from "sonner"

interface VerificationRequest {
    id: number
    user_id: number
    user_name: string
    user_email: string
    institution_name: string
    course_name: string
    document_url: string
    status: "pending" | "approved" | "rejected"
    created_at: string
}

export default function AdminStudentVerificationPage() {
    const [requests, setRequests] = useState<VerificationRequest[]>([])
    const [loading, setLoading] = useState(true)

    // Action States
    const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null)
    const [rejectReason, setRejectReason] = useState("")
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)
    const [viewDocumentOpen, setViewDocumentOpen] = useState(false)

    useEffect(() => {
        fetchRequests()
    }, [])

    const fetchRequests = async () => {
        setLoading(true)
        try {
            const response = await api.get<{ success: boolean; data: VerificationRequest[] }>("/admin/student-requests")
            if (response.success) {
                setRequests(response.data)
            }
        } catch (error) {
            console.error("Failed to fetch verification requests:", error)
            toast.error("Falha ao carregar solicitações")
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async (id: number) => {
        setActionLoading(true)
        try {
            const response = await api.patch<{ success: boolean; message?: string }>(`/admin/student-requests/${id}/approve`)
            if (response.success) {
                toast.success(response.message || "Solicitação aprovada com sucesso")
                setSelectedRequest(null)
                fetchRequests()
            }
        } catch (error) {
            console.error("Failed to approve request:", error)
            toast.error("Falha ao aprovar solicitação")
        } finally {
            setActionLoading(false)
        }
    }

    const handleReject = async () => {
        if (!selectedRequest || !rejectReason) return

        setActionLoading(true)
        try {
            const response = await api.patch<{ success: boolean; message?: string }>(
                `/admin/student-requests/${selectedRequest.id}/reject`,
                { reason: rejectReason }
            )
            if (response.success) {
                toast.success(response.message || "Solicitação rejeitada com sucesso")
                setRejectDialogOpen(false)
                setRejectReason("")
                setSelectedRequest(null)
                fetchRequests()
            }
        } catch (error) {
            console.error("Failed to reject request:", error)
            toast.error("Falha ao rejeitar solicitação")
        } finally {
            setActionLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <Badge variant="outline" className="mb-2">Verificação</Badge>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    Verificação de Alunos
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                    Analise e aprove os documentos comprobatórios de vínculo estudantil.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        Solicitações Pendentes
                    </CardTitle>
                    <CardDescription>
                        Lista de usuários aguardando verificação de estudante.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-center gap-4 border p-4 rounded-lg">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-48" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                    <Skeleton className="h-10 w-32" />
                                </div>
                            ))}
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">
                            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500/20" />
                            <h3 className="text-lg font-medium">Tudo limpo!</h3>
                            <p className="mt-1">Não há soicitações de verificação pendentes no momento.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {requests.map((request) => (
                                <div key={request.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border p-4 rounded-lg bg-card hover:bg-muted/50 transition-colors">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                                        <GraduationCap className="h-6 w-6" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold text-base">{request.user_name}</h4>
                                            <Badge variant="outline" className="text-xs font-normal">
                                                {new Date(request.created_at).toLocaleDateString("pt-BR")}
                                            </Badge>
                                        </div>
                                        <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <School className="h-3 w-3" />
                                                <span className="truncate">{request.institution_name}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <FileText className="h-3 w-3" />
                                                <span className="truncate">{request.course_name}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedRequest(request)
                                                setViewDocumentOpen(true)
                                            }}
                                        >
                                            <Eye className="mr-2 h-4 w-4" />
                                            Ver Documento
                                        </Button>
                                        <div className="flex gap-1">
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700"
                                                onClick={() => handleApprove(request.id)}
                                                disabled={actionLoading}
                                            >
                                                <CheckCircle className="h-4 w-4" />
                                                <span className="sr-only">Aprovar</span>
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedRequest(request)
                                                    setRejectDialogOpen(true)
                                                }}
                                                disabled={actionLoading}
                                            >
                                                <XCircle className="h-4 w-4" />
                                                <span className="sr-only">Rejeitar</span>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Document Viewer Dialog */}
            <Dialog open={viewDocumentOpen} onOpenChange={setViewDocumentOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>Documento de Verificação</DialogTitle>
                        <DialogDescription>
                            {selectedRequest?.user_name} - {selectedRequest?.institution_name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 bg-muted rounded-md overflow-auto min-h-[400px] flex items-center justify-center">
                        {selectedRequest?.document_url ? (
                            <iframe
                                src={selectedRequest.document_url}
                                className="w-full h-full min-h-[500px]"
                                title="Documento"
                            />
                        ) : (
                            <div className="text-muted-foreground flex flex-col items-center">
                                <FileText className="h-12 w-12 mb-2" />
                                Documento não disponível
                            </div>
                        )}
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setViewDocumentOpen(false)}>Fechar</Button>
                        {selectedRequest && (
                            <>
                                <Button
                                    variant="destructive"
                                    onClick={() => {
                                        setViewDocumentOpen(false)
                                        setRejectDialogOpen(true)
                                    }}
                                >
                                    Rejeitar
                                </Button>
                                <Button
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => {
                                        handleApprove(selectedRequest.id)
                                        setViewDocumentOpen(false)
                                    }}
                                >
                                    Aprovar
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Reason Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rejeitar Verificação</DialogTitle>
                        <DialogDescription>
                            Informe o motivo para rejeitar a solicitação de {selectedRequest?.user_name}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="Ex: Documento ilegível ou data de validade expirada..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancelar</Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={actionLoading || !rejectReason.trim()}
                        >
                            {actionLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                            Confirmar Rejeição
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
