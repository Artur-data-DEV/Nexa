"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/presentation/components/ui/card"
import { Button } from "@/presentation/components/ui/button"
import { Badge } from "@/presentation/components/ui/badge"
import { Input } from "@/presentation/components/ui/input"
import { Textarea } from "@/presentation/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/presentation/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/presentation/components/ui/dialog"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/presentation/components/ui/accordion"
import { Skeleton } from "@/presentation/components/ui/skeleton"
import {
    BookOpen,
    Plus,
    Pencil,
    Trash2,
    Video,
    RefreshCw
} from "lucide-react"
import { api } from "@/infrastructure/api/axios-adapter"
import { toast } from "sonner"

interface GuideStep {
    id?: number
    title: string
    description: string
    video_path?: string | null
    videoFile?: File | null
    order: number
}

interface Guide {
    id: number
    title: string
    description: string
    audience: "Brand" | "Creator"
    created_at: string
    steps: GuideStep[]
    video_path?: string | null
}

const EmptyGuide: Omit<Guide, "id" | "created_at"> = {
    title: "",
    description: "",
    audience: "Creator",
    steps: [],
    video_path: null
}

export default function AdminGuidesPage() {
    const [guides, setGuides] = useState<Guide[]>([])
    const [loading, setLoading] = useState(true)

    // Create/Edit State
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingGuide, setEditingGuide] = useState<Partial<Guide>>(EmptyGuide)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        fetchGuides()
    }, [])

    const fetchGuides = async () => {
        setLoading(true)
        try {
            const response = await api.get<{ success: boolean; data: Guide[] }>("/admin/guides")
            if (response.success) {
                setGuides(response.data)
            }
        } catch (error) {
            console.error("Failed to fetch guides:", error)
            toast.error("Falha ao carregar guias")
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = () => {
        setEditingGuide({ ...EmptyGuide, steps: [] })
        setIsDialogOpen(true)
    }

    const handleEdit = (guide: Guide) => {
        setEditingGuide({
            ...guide,
            steps: guide.steps.sort((a, b) => a.order - b.order)
        })
        setIsDialogOpen(true)
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Tem certeza que deseja excluir este guia?")) return

        try {
            const response = await api.delete<{ success: boolean }>(`/admin/guides/${id}`)
            if (response.success) {
                toast.success("Guia excluído com sucesso")
                setGuides(prev => prev.filter(g => g.id !== id))
            }
        } catch (error) {
            console.error("Failed to delete guide:", error)
            toast.error("Falha ao excluir guia")
        }
    }

    const handleSave = async () => {
        if (!editingGuide.title || !editingGuide.description) {
            toast.error("Por favor preencha os campos obrigatórios")
            return
        }

        setIsSubmitting(true)
        try {
            const formData = new FormData()
            formData.append("title", editingGuide.title)
            formData.append("description", editingGuide.description)
            formData.append("audience", editingGuide.audience || "Creator")

            // Handle steps
            if (editingGuide.steps && editingGuide.steps.length > 0) {
                editingGuide.steps.forEach((step, index) => {
                    formData.append(`steps[${index}][title]`, step.title)
                    formData.append(`steps[${index}][description]`, step.description)

                    if (step.videoFile) {
                        formData.append(`steps[${index}][videoFile]`, step.videoFile)
                    }
                })
            }

            let response
            if (editingGuide.id) {
                // Update (PUT doesn't work well with FormData in some setups, sometimes need _method=PUT)
                // Laravel traditionally handles PUT with FormData by using POST + _method=PUT
                formData.append("_method", "PUT")
                response = await api.post<{ success: boolean; data: Guide }>(`/admin/guides/${editingGuide.id}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                })
            } else {
                // Create
                response = await api.post<{ success: boolean; data: Guide }>("/admin/guides", formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                })
            }

            if (response.success) {
                toast.success(editingGuide.id ? "Guia atualizado com sucesso" : "Guia criado com sucesso")
                setIsDialogOpen(false)
                fetchGuides()
            }
        } catch (error) {
            console.error("Failed to save guide:", error)
            toast.error("Falha ao salvar guia")
        } finally {
            setIsSubmitting(false)
        }
    }

    const addStep = () => {
        const newStep: GuideStep = {
            title: "",
            description: "",
            order: (editingGuide.steps?.length || 0),
            videoFile: null
        }
        setEditingGuide(prev => ({
            ...prev,
            steps: [...(prev.steps || []), newStep]
        }))
    }

    const removeStep = (index: number) => {
        setEditingGuide(prev => ({
            ...prev,
            steps: prev.steps?.filter((_, i) => i !== index)
        }))
    }

    const updateStep = (index: number, field: keyof GuideStep, value: GuideStep[keyof GuideStep]) => {
        const newSteps = [...(editingGuide.steps || [])]
        newSteps[index] = { ...newSteps[index], [field]: value }
        setEditingGuide(prev => ({ ...prev, steps: newSteps }))
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <Badge variant="outline" className="mb-2">Educação</Badge>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                        Guias da Plataforma
                    </h1>
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                        Gerencie os guias e tutoriais para marcas e criadores.
                    </p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Guia
                </Button>
            </div>

            {loading ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-5 w-3/4 mb-2" />
                                <Skeleton className="h-4 w-1/2" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-20 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : guides.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-12 text-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Nenhum guia encontrado</h3>
                    <p className="text-muted-foreground mt-2 mb-6">Comece criando um guia para ajudar os usuários.</p>
                    <Button onClick={handleCreate}>Criar Primeiro Guia</Button>
                </Card>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {guides.map((guide) => (
                        <Card key={guide.id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <Badge variant={guide.audience === "Brand" ? "default" : "secondary"}>
                                        {guide.audience === "Brand" ? "Para Marcas" : "Para Criadores"}
                                    </Badge>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(guide)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(guide.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <CardTitle className="mt-2 line-clamp-1">{guide.title}</CardTitle>
                                <CardDescription className="line-clamp-2 min-h-10">
                                    {guide.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="mt-auto pt-0">
                                <div className="text-sm text-muted-foreground mb-4">
                                    {guide.steps.length} passos
                                </div>
                                <Button variant="outline" className="w-full" onClick={() => handleEdit(guide)}>
                                    Gerenciar Conteúdo
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingGuide.id ? "Editar Guia" : "Novo Guia"}</DialogTitle>
                        <DialogDescription>Preencha as informações do guia e adicione os passos.</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Título</label>
                                <Input
                                    value={editingGuide.title || ""}
                                    onChange={(e) => setEditingGuide(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Ex: Como criar uma campanha"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Público Alvo</label>
                                <Select
                                    value={editingGuide.audience}
                                    onValueChange={(value) => setEditingGuide(prev => ({ ...prev, audience: value as Guide["audience"] }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Creator">Criadores</SelectItem>
                                        <SelectItem value="Brand">Marcas</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Descrição</label>
                            <Textarea
                                value={editingGuide.description || ""}
                                onChange={(e) => setEditingGuide(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Uma breve descrição sobre o que este guia ensina..."
                                rows={3}
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium">Passos do Guia</h3>
                                <Button variant="outline" size="sm" onClick={addStep}>
                                    <Plus className="mr-2 h-4 w-4" /> Adicionar Passo
                                </Button>
                            </div>

                            {editingGuide.steps?.length === 0 && (
                                <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
                                    Nenhum passo adicionado. Clique em &quot;Adicionar Passo&quot; para começar.
                                </div>
                            )}

                            <Accordion type="single" collapsible className="w-full space-y-2">
                                {editingGuide.steps?.map((step, index) => (
                                    <AccordionItem key={index} value={`item-${index}`} className="border rounded-md px-4">
                                        <AccordionTrigger className="hover:no-underline">
                                            <div className="flex items-center gap-2">
                                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                                                    {index + 1}
                                                </span>
                                                <span className="font-medium">{step.title || "Novo Passo"}</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pt-4 space-y-4">
                                            <div className="grid gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Título do Passo</label>
                                                    <Input
                                                        value={step.title}
                                                        onChange={(e) => updateStep(index, "title", e.target.value)}
                                                        placeholder="Ex: Acesse o painel"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Descrição Detalhada</label>
                                                    <Textarea
                                                        value={step.description}
                                                        onChange={(e) => updateStep(index, "description", e.target.value)}
                                                        rows={4}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Vídeo (opcional)</label>
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            type="file"
                                                            accept="video/*"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0]
                                                                if (file) updateStep(index, "videoFile", file)
                                                            }}
                                                        />
                                                        {step.video_path && !step.videoFile && (
                                                            <Badge variant="outline" className="h-10 px-3">
                                                                <Video className="h-4 w-4 mr-2" />
                                                                Vídeo atual
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex justify-end pt-2">
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => removeStep(index)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Remover Passo
                                                    </Button>
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={isSubmitting}>
                            {isSubmitting && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar Guia
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
