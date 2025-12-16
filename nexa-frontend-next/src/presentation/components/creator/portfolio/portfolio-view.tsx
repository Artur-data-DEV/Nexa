"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/presentation/contexts/auth-provider"
import { Portfolio } from "@/domain/entities/portfolio"
import { ApiPortfolioRepository } from "@/infrastructure/repositories/portfolio-repository"
import { GetPortfolioUseCase } from "@/application/use-cases/get-portfolio.use-case"
import { UpdatePortfolioProfileUseCase } from "@/application/use-cases/update-portfolio-profile.use-case"
import { UploadPortfolioMediaUseCase } from "@/application/use-cases/upload-portfolio-media.use-case"
import { DeletePortfolioItemUseCase } from "@/application/use-cases/delete-portfolio-item.use-case"
import { UpdatePortfolioItemUseCase } from "@/application/use-cases/update-portfolio-item.use-case"
import { GetPortfolioStatsUseCase } from "@/application/use-cases/get-portfolio-stats.use-case"
import { api } from "@/infrastructure/api/axios-adapter"
import { Button } from "@/presentation/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/presentation/components/ui/dialog"
import { Input } from "@/presentation/components/ui/input"
import { Textarea } from "@/presentation/components/ui/textarea"
import { Label } from "@/presentation/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/presentation/components/ui/avatar"
import { Skeleton } from "@/presentation/components/ui/skeleton"
import { Camera, Plus, Trash2, Edit2, Link as LinkIcon, Upload, X, BarChart3, Image as ImageIcon, Video } from "lucide-react"
import { toast } from "sonner"
import { PortfolioItem, PortfolioStats } from "@/domain/entities/portfolio"

// Setup dependencies
const portfolioRepository = new ApiPortfolioRepository(api)
const getPortfolioUseCase = new GetPortfolioUseCase(portfolioRepository)
const updatePortfolioProfileUseCase = new UpdatePortfolioProfileUseCase(portfolioRepository)
const uploadPortfolioMediaUseCase = new UploadPortfolioMediaUseCase(portfolioRepository)
const deletePortfolioItemUseCase = new DeletePortfolioItemUseCase(portfolioRepository)
const updatePortfolioItemUseCase = new UpdatePortfolioItemUseCase(portfolioRepository)
const getPortfolioStatsUseCase = new GetPortfolioStatsUseCase(portfolioRepository)

const MAX_TOTAL_FILES = 12
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/jpg", "video/mp4", "video/quicktime", "video/mov", "video/avi", "video/webm", "video/ogg", "video/x-matroska", "video/x-flv", "video/3gpp", "video/x-ms-wmv", "application/octet-stream"]

function getFileType(file: File) {
    if (file.type.startsWith("image/")) return "image"
    if (file.type.startsWith("video/")) return "video"
    return "other"
}

export default function PortfolioView() {
    const { user } = useAuth()
    const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
    const [stats, setStats] = useState<PortfolioStats | null>(null)
    const [loading, setLoading] = useState(true)
    
    // Edit Profile State
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [editTitle, setEditTitle] = useState("")
    const [editBio, setEditBio] = useState("")
    const [editLinks, setEditLinks] = useState<{title: string, url: string}[]>([])
    const [editAvatar, setEditAvatar] = useState<File | null>(null)
    const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null)
    const [savingProfile, setSavingProfile] = useState(false)

    // Edit Item State
    const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null)
    const [editItemTitle, setEditItemTitle] = useState("")
    const [editItemDescription, setEditItemDescription] = useState("")
    const [editItemOrder, setEditItemOrder] = useState(0)
    const [savingItem, setSavingItem] = useState(false)

    // Upload Media State
    const [isUploadOpen, setIsUploadOpen] = useState(false)
    const [uploadFiles, setUploadFiles] = useState<File[]>([])
    const [uploadPreviews, setUploadPreviews] = useState<{file: File, url: string, type: string}[]>([])
    const [uploading, setUploading] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    
    // Delete State
    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        fetchPortfolio()
    }, [])

    const fetchPortfolio = async () => {
        setLoading(true)
        try {
            const data = await getPortfolioUseCase.execute()
            setPortfolio(data)
        } catch (error) {
            console.error("Failed to fetch portfolio", error)
            // toast.error("Erro ao carregar portfólio")
        } finally {
            setLoading(false)
        }
    }

    const openEdit = () => {
        if (!portfolio) {
            setEditTitle(user?.name || "")
            setEditBio("")
            setEditLinks([{title: "", url: ""}])
            setEditAvatarPreview(user?.avatar || null)
        } else {
            setEditTitle(portfolio.title || "")
            setEditBio(portfolio.bio || "")
            setEditLinks(portfolio.project_links ? [...portfolio.project_links] : [{title: "", url: ""}])
            setEditAvatarPreview(portfolio.profile_picture_url || null)
        }
        setEditAvatar(null)
        setIsEditOpen(true)
    }

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setEditAvatar(file)
            setEditAvatarPreview(URL.createObjectURL(file))
        }
    }

    const handleLinkChange = (index: number, field: 'title' | 'url', value: string) => {
        const newLinks = [...editLinks]
        newLinks[index] = { ...newLinks[index], [field]: value }
        setEditLinks(newLinks)
    }

    const addLink = () => {
        setEditLinks([...editLinks, { title: "", url: "" }])
    }

    const removeLink = (index: number) => {
        const newLinks = editLinks.filter((_, i) => i !== index)
        setEditLinks(newLinks)
    }

    const saveProfile = async () => {
        setSavingProfile(true)
        try {
            const formData = new FormData()
            formData.append('title', editTitle)
            formData.append('bio', editBio)
            
            const validLinks = editLinks.filter(l => l.url.trim() !== "")
            if (validLinks.length > 0) {
                formData.append('project_links', JSON.stringify(validLinks))
            }

            if (editAvatar) {
                formData.append('profile_picture', editAvatar)
            }

            const updated = await updatePortfolioProfileUseCase.execute(formData)
            setPortfolio(updated)
            setIsEditOpen(false)
            toast.success("Perfil atualizado!")
        } catch (error) {
            console.error("Failed to update profile", error)
            toast.error("Erro ao atualizar perfil")
        } finally {
            setSavingProfile(false)
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            addFiles(Array.from(e.target.files))
        }
    }

    const addFiles = (files: File[]) => {
        const validFiles = files.filter(f => ACCEPTED_TYPES.includes(f.type))
        
        const currentCount = (portfolio?.items?.length || 0) + uploadFiles.length
        if (currentCount + validFiles.length > MAX_TOTAL_FILES) {
            toast.error(`Limite de ${MAX_TOTAL_FILES} itens excedido`)
            return
        }

        const newPreviews = validFiles.map(f => ({
            file: f,
            url: URL.createObjectURL(f),
            type: getFileType(f)
        }))

        setUploadFiles([...uploadFiles, ...validFiles])
        setUploadPreviews([...uploadPreviews, ...newPreviews])
    }

    const removeUploadFile = (index: number) => {
        const newFiles = uploadFiles.filter((_, i) => i !== index)
        const newPreviews = uploadPreviews.filter((_, i) => i !== index)
        setUploadFiles(newFiles)
        setUploadPreviews(newPreviews)
    }

    const uploadMedia = async () => {
        if (uploadFiles.length === 0) return
        setUploading(true)
        try {
            const formData = new FormData()
            uploadFiles.forEach(f => formData.append('files[]', f))

            const updated = await uploadPortfolioMediaUseCase.execute(formData)
            setPortfolio(updated)
            setIsUploadOpen(false)
            setUploadFiles([])
            setUploadPreviews([])
            toast.success("Mídia enviada!")
        } catch (error) {
            console.error("Failed to upload media", error)
            toast.error("Erro ao enviar mídia")
        } finally {
            setUploading(false)
        }
    }

    const deleteItem = async () => {
        if (!deleteId) return
        setDeleting(true)
        try {
            await deletePortfolioItemUseCase.execute(deleteId)
            if (portfolio) {
                setPortfolio({
                    ...portfolio,
                    items: portfolio.items.filter(i => i.id !== deleteId)
                })
            }
            setDeleteId(null)
            toast.success("Item removido")
        } catch (error) {
            console.error("Failed to delete item", error)
            toast.error("Erro ao remover item")
        } finally {
            setDeleting(false)
        }
    }

    if (loading) {
        return <div className="p-8 space-y-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-48 w-full" />)}
            </div>
        </div>
    }

    return (
        <div className="flex flex-col gap-8 p-6">
            {/* Header / Profile Section */}
            <Card className="bg-linear-to-r from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 border-none shadow-sm">
                <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6">
                    <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-white shadow-md">
                        <AvatarImage src={portfolio?.profile_picture_url || user?.avatar} />
                        <AvatarFallback className="text-2xl">{user?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 text-center md:text-left space-y-2">
                        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold">{portfolio?.title || user?.name}</h1>
                                <p className="text-muted-foreground whitespace-pre-wrap max-w-2xl">
                                    {portfolio?.bio || "Adicione uma bio para contar sua história..."}
                                </p>
                            </div>
                            <Button onClick={openEdit} variant="outline" className="shrink-0 gap-2">
                                <Edit2 className="h-4 w-4" />
                                Editar Perfil
                            </Button>
                        </div>

                        {portfolio?.project_links && portfolio.project_links.length > 0 && (
                            <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-4">
                                {portfolio.project_links.map((link, i) => (
                                    <a 
                                        key={i} 
                                        href={link.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-sm text-pink-600 hover:text-pink-700 hover:underline bg-white/50 px-3 py-1 rounded-full border border-pink-100 transition-colors"
                                    >
                                        <LinkIcon className="h-3 w-3" />
                                        {link.title || link.url}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Portfolio Items Grid */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Meu Portfólio</h2>
                    <Button onClick={() => setIsUploadOpen(true)} className="gap-2 bg-pink-600 hover:bg-pink-700">
                        <Plus className="h-4 w-4" />
                        Adicionar Mídia
                    </Button>
                </div>

                {portfolio?.items && portfolio.items.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {portfolio.items.map((item) => (
                            <div key={item.id} className="group relative aspect-square bg-muted rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                                {item.file_type === 'image' ? (
                                    <img 
                                        src={item.file_url} 
                                        alt={item.title || ""} 
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                ) : (
                                    <video 
                                        src={item.file_url} 
                                        className="w-full h-full object-cover"
                                    />
                                )}
                                
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <Button 
                                        variant="secondary" 
                                        size="icon" 
                                        onClick={() => {
                                            setEditingItem(item)
                                            setEditItemTitle(item.title || "")
                                            setEditItemDescription(item.description || "")
                                            setEditItemOrder(item.order || 0)
                                        }}
                                        title="Editar"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                        variant="destructive" 
                                        size="icon" 
                                        onClick={() => setDeleteId(item.id)}
                                        title="Excluir"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                {item.title && (
                                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-linear-to-t from-black/80 to-transparent text-white text-xs truncate">
                                        {item.title}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 border-2 border-dashed rounded-xl bg-muted/30">
                        <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium">Seu portfólio está vazio</h3>
                        <p className="text-muted-foreground mb-6">Adicione fotos e vídeos dos seus melhores trabalhos.</p>
                        <Button onClick={() => setIsUploadOpen(true)} variant="outline">
                            Começar Agora
                        </Button>
                    </div>
                )}
            </div>

            {/* Edit Profile Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Editar Perfil</DialogTitle>
                        <DialogDescription>Atualize suas informações públicas do portfólio.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="flex justify-center">
                            <div className="relative">
                                <Avatar className="h-24 w-24">
                                    <AvatarImage src={editAvatarPreview || undefined} />
                                    <AvatarFallback>{user?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <label 
                                    htmlFor="avatar-upload" 
                                    className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
                                >
                                    <Camera className="h-4 w-4" />
                                </label>
                                <input 
                                    id="avatar-upload" 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={handleAvatarChange}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Título Profissional</Label>
                            <Input 
                                value={editTitle} 
                                onChange={(e) => setEditTitle(e.target.value)} 
                                placeholder="Ex: Criador de Conteúdo Lifestyle"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Bio</Label>
                            <Textarea 
                                value={editBio} 
                                onChange={(e) => setEditBio(e.target.value)} 
                                placeholder="Conte um pouco sobre você..."
                                className="resize-none h-24"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Links de Projetos</Label>
                            {editLinks.map((link, index) => (
                                <div key={index} className="flex gap-2">
                                    <Input 
                                        placeholder="Título (Opcional)" 
                                        value={link.title} 
                                        onChange={(e) => handleLinkChange(index, 'title', e.target.value)}
                                        className="flex-1"
                                    />
                                    <Input 
                                        placeholder="URL" 
                                        value={link.url} 
                                        onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
                                        className="flex-2"
                                    />
                                    <Button variant="ghost" size="icon" onClick={() => removeLink(index)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={addLink} className="w-full mt-2">
                                <Plus className="h-4 w-4 mr-2" /> Adicionar Link
                            </Button>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
                        <Button onClick={saveProfile} disabled={savingProfile}>
                            {savingProfile ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Upload Dialog */}
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Adicionar Mídia</DialogTitle>
                        <DialogDescription>Carregue fotos ou vídeos para seu portfólio.</DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <div 
                            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                                dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                            }`}
                            onDragEnter={() => setDragActive(true)}
                            onDragLeave={() => setDragActive(false)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault()
                                setDragActive(false)
                                if (e.dataTransfer.files) {
                                    addFiles(Array.from(e.dataTransfer.files))
                                }
                            }}
                        >
                            <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                            <p className="text-sm text-muted-foreground mb-2">
                                Arraste e solte arquivos aqui ou clique para selecionar
                            </p>
                            <input 
                                type="file" 
                                id="media-upload" 
                                className="hidden" 
                                multiple 
                                accept={ACCEPTED_TYPES.join(',')}
                                onChange={handleFileSelect}
                            />
                            <Button variant="secondary" onClick={() => document.getElementById('media-upload')?.click()}>
                                Selecionar Arquivos
                            </Button>
                        </div>

                        {uploadPreviews.length > 0 && (
                            <div className="grid grid-cols-4 gap-2">
                                {uploadPreviews.map((preview, i) => (
                                    <div key={i} className="relative aspect-square bg-muted rounded-md overflow-hidden group">
                                        {preview.type === 'image' ? (
                                            <img src={preview.url} className="w-full h-full object-cover" />
                                        ) : (
                                            <video src={preview.url} className="w-full h-full object-cover" />
                                        )}
                                        <button 
                                            onClick={() => removeUploadFile(i)}
                                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUploadOpen(false)}>Cancelar</Button>
                        <Button onClick={uploadMedia} disabled={uploading || uploadFiles.length === 0}>
                            {uploading ? "Enviando..." : `Enviar ${uploadFiles.length > 0 ? `(${uploadFiles.length})` : ''}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Excluir item?</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja remover este item do seu portfólio? Esta ação não pode ser desfeita.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
                        <Button variant="destructive" onClick={deleteItem} disabled={deleting}>
                            {deleting ? "Excluindo..." : "Excluir"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
