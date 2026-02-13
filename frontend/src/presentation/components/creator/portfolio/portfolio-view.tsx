"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/presentation/contexts/auth-provider"
import { Portfolio } from "@/domain/entities/portfolio"
import { ApiPortfolioRepository } from "@/infrastructure/repositories/portfolio-repository"
import { GetPortfolioUseCase } from "@/application/use-cases/get-portfolio.use-case"
import { UpdatePortfolioProfileUseCase } from "@/application/use-cases/update-portfolio-profile.use-case"
import { UploadPortfolioMediaUseCase } from "@/application/use-cases/upload-portfolio-media.use-case"
import { DeletePortfolioItemUseCase } from "@/application/use-cases/delete-portfolio-item.use-case"
import { api } from "@/infrastructure/api/axios-adapter"
import { Button } from "@/presentation/components/ui/button"
import { Card, CardContent } from "@/presentation/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/presentation/components/ui/dialog"
import { Input } from "@/presentation/components/ui/input"
import { Textarea } from "@/presentation/components/ui/textarea"
import { Label } from "@/presentation/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/presentation/components/ui/avatar"
import { Skeleton } from "@/presentation/components/ui/skeleton"
import { Camera, Plus, Trash2, Edit2, Link as LinkIcon, Upload, X, Eye } from "lucide-react"
import { toast } from "sonner"
import { PortfolioItem } from "@/domain/entities/portfolio"
import type { AxiosError } from "axios"

// Setup dependencies
const portfolioRepository = new ApiPortfolioRepository(api)
const getPortfolioUseCase = new GetPortfolioUseCase(portfolioRepository)
const updatePortfolioProfileUseCase = new UpdatePortfolioProfileUseCase(portfolioRepository)
const uploadPortfolioMediaUseCase = new UploadPortfolioMediaUseCase(portfolioRepository)
const deletePortfolioItemUseCase = new DeletePortfolioItemUseCase(portfolioRepository)

const MAX_TOTAL_FILES = 12
const MAX_FILE_SIZE_MB = 100
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

const ACCEPTED_TYPES = [
    "image/jpeg", "image/png", "image/jpg", "image/webp", "image/avif", "image/gif", "image/bmp", "image/svg+xml",
    "video/mp4", "video/quicktime", "video/mov", "video/avi", "video/webm", "video/ogg", "video/x-matroska", "video/x-flv", "video/3gpp", "video/x-ms-wmv", "application/octet-stream"
]

function getFileType(file: File) {
    if (file.type.startsWith("image/")) return "image"
    if (file.type.startsWith("video/")) return "video"
    return "other"
}

export default function PortfolioView() {
    const { user, updateUser } = useAuth()
    const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
    const [loading, setLoading] = useState(true)
    const [avatarTry, setAvatarTry] = useState(0)
    const avatarSrc = (() => {
        const src = user?.avatar || ""
        if (!src) return ""
        const sep = src.includes("?") ? "&" : "?"
        return `${src}${sep}r=${avatarTry}`
    })()

    // Edit Profile State
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [editTitle, setEditTitle] = useState("")
    const [editBio, setEditBio] = useState("")
    const [editWhatsapp, setEditWhatsapp] = useState("")
    const [editLinks, setEditLinks] = useState<{ title: string, url: string }[]>([])
    const [editAvatar, setEditAvatar] = useState<File | null>(null)
    const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null)
    const [savingProfile, setSavingProfile] = useState(false)

    // Upload Media State
    const [isUploadOpen, setIsUploadOpen] = useState(false)
    const [uploadFiles, setUploadFiles] = useState<File[]>([])
    const [uploadPreviews, setUploadPreviews] = useState<{ file: File, url: string, type: string }[]>([])
    const [uploading, setUploading] = useState(false)
    const [dragActive, setDragActive] = useState(false)

    // Delete State
    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [deleting, setDeleting] = useState(false)
    
    // View Item State
    const [viewingItem, setViewingItem] = useState<PortfolioItem | null>(null)

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
            setEditWhatsapp(user?.whatsapp || "")
            setEditLinks([{ title: "", url: "" }])
            setEditAvatarPreview(user?.avatar || null)
        } else {
            setEditTitle(portfolio.title || "")
            setEditBio(portfolio.bio || "")
            setEditWhatsapp(user?.whatsapp || "") // Portfolio usually uses user's whatsapp or we might need to add it to portfolio model if it differs. Sticking to user's for now as "controle de contato".
            setEditLinks(portfolio.project_links ? [...portfolio.project_links] : [{ title: "", url: "" }])
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
            formData.append('whatsapp', editWhatsapp)

            const validLinks = editLinks.filter(l => l.url.trim() !== "")
            if (validLinks.length > 0) {
                formData.append('project_links', JSON.stringify(validLinks))
            }

            if (editAvatar) {
                formData.append('profile_picture', editAvatar)
            }

            const updated = await updatePortfolioProfileUseCase.execute(formData)
            const bust = typeof window !== "undefined" ? `?t=${Date.now()}` : ""
            const updatedAvatarUrl = updated.profile_picture_url ? `${updated.profile_picture_url}${bust}` : undefined
            
            // Merge items to avoid clearing the grid when API doesn't return them on update
            const merged: Portfolio = {
                ...updated,
                profile_picture_url: updatedAvatarUrl || updated.profile_picture_url,
                items: (updated.items && updated.items.length > 0)
                    ? updated.items
                    : (portfolio?.items || [])
            }
            setPortfolio(merged)
            
            // Update auth context user state immediately
            if (user) {
                const nextUser = { 
                    ...user, 
                    avatar: updatedAvatarUrl || user.avatar,
                    bio: updated.bio || user.bio,
                    whatsapp: editWhatsapp || user.whatsapp
                }
                updateUser(nextUser)
                if (typeof window !== "undefined" && editAvatar) {
                    window.location.reload()
                }
            }
            
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
        const validFiles = []
        let hasLargeFile = false
        let hasInvalidType = false

        for (const f of files) {
            if (f.size > MAX_FILE_SIZE_BYTES) {
                hasLargeFile = true
                continue
            }
            if (!ACCEPTED_TYPES.includes(f.type) && !f.type.startsWith("image/") && !f.type.startsWith("video/")) {
                hasInvalidType = true
                continue
            }
            validFiles.push(f)
        }

        if (hasLargeFile) {
            toast.error(`Alguns arquivos excedem o limite de ${MAX_FILE_SIZE_MB}MB.`)
        }
        if (hasInvalidType) {
            toast.error("Alguns arquivos possuem formato inválido.")
        }

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
        const loadingToast = toast.loading("Enviando mídia... Aguarde e não feche a página.")

        try {
            const formData = new FormData()
            uploadFiles.forEach(f => formData.append("files[]", f))

            await uploadPortfolioMediaUseCase.execute(formData)
            await fetchPortfolio()

            setIsUploadOpen(false)
            setUploadFiles([])
            setUploadPreviews([])
            toast.dismiss(loadingToast)
            toast.success("Mídia enviada com sucesso!")
        } catch (error: unknown) {
            toast.dismiss(loadingToast)
            console.error("Failed to upload media", error)
            const axiosError = error as AxiosError<{ message?: string; errors?: { files?: string[] } }>
            
            // Log error details for mobile debugging
            console.log("Upload Error Details:", {
                message: axiosError.message,
                response: axiosError.response?.data,
                status: axiosError.response?.status,
                headers: axiosError.response?.headers
            })

            const message =
                axiosError.response?.data?.message ||
                axiosError.response?.data?.errors?.files?.[0] ||
                `Erro ao enviar mídia: ${axiosError.message || "Erro desconhecido"}`
            
            toast.error(message, { duration: 5000 })
            
            // Temporary debug toast
            if (process.env.NODE_ENV === 'development' || typeof window !== 'undefined') {
                 toast.error(`DEBUG: ${axiosError.message} | Status: ${axiosError.response?.status}`, { duration: 8000 })
            }
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
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 w-full" />)}
            </div>
        </div>
    }

    return (
        <div className="flex flex-col gap-8 p-6">
            {/* Header / Profile Section */}
            <Card className="bg-linear-to-r from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 border-none shadow-sm">
                <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6">
                    <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-white shadow-md">
                                <AvatarImage
                                    src={avatarSrc}
                                    key={avatarSrc}
                                    onError={() => setTimeout(() => setAvatarTry((t) => (t < 3 ? t + 1 : t)), 1000)}
                                />
                        <AvatarFallback className="text-2xl">{user?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 text-center md:text-left space-y-2">
                        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold">{portfolio?.title || user?.name}</h1>
                                {user?.whatsapp && (
                                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
                                            Apenas para você
                                        </span>
                                        WhatsApp: {user.whatsapp}
                                    </p>
                                )}
                                <p className="text-muted-foreground whitespace-pre-wrap max-w-2xl mt-2">
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
                        {portfolio.items.map((item) => {
                            const isImage = item.media_type === "image" || /\.(jpg|jpeg|png|gif|webp|avif|bmp|svg)$/i.test(item.file_url || "") || /\.(jpg|jpeg|png|gif|webp|avif|bmp|svg)$/i.test(item.title || "")
                            return (
                            <div 
                                key={item.id} 
                                className="group relative aspect-square bg-muted rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
                                onClick={() => setViewingItem({ ...item, media_type: isImage ? 'image' : 'video' })}
                            >
                                {isImage ? (
                                    // eslint-disable-next-line @next/next/no-img-element
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
                                    <div className="flex items-center gap-2 pointer-events-none">
                                        <div className="bg-white/20 backdrop-blur-md p-2 rounded-full">
                                            <Eye className="h-6 w-6 text-white" />
                                        </div>
                                    </div>
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-2 right-2 pointer-events-auto"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setDeleteId(item.id)
                                        }}
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
                            )
                        })}
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
                <DialogContent className="sm:max-w-125">
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
                            <Label>WhatsApp (Apenas Interno)</Label>
                            <Input
                                value={editWhatsapp}
                                onChange={(e) => setEditWhatsapp(e.target.value)}
                                placeholder="(11) 99999-9999"
                            />
                            <p className="text-xs text-muted-foreground">Visível apenas para você e administradores.</p>
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
                <DialogContent className="sm:max-w-125">
                    <DialogHeader>
                        <DialogTitle>Adicionar Mídia</DialogTitle>
                        <DialogDescription>Carregue fotos ou vídeos para seu portfólio.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div
                            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
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
                                Arraste e solte arquivos aqui ou clique para selecionar.
                            </p>
                            <p className="text-xs text-muted-foreground mb-4">
                                Suporta Imagens (JPEG, PNG, WEBP) e Vídeos (MP4, MOV, AVI). Máx {MAX_FILE_SIZE_MB}MB.
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
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={preview.url} className="w-full h-full object-cover" alt="Preview Image" />
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

            {/* View Item Dialog */}
            <Dialog open={!!viewingItem} onOpenChange={(open) => !open && setViewingItem(null)}>
                <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-transparent border-none shadow-none">
                    <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
                        <div className="pointer-events-auto">
                            <Button 
                                variant="secondary" 
                                size="icon" 
                                className="absolute top-2 right-2 z-50 rounded-full opacity-70 hover:opacity-100"
                                onClick={() => setViewingItem(null)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                            {viewingItem?.media_type === 'image' ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img 
                                    src={viewingItem.file_url} 
                                    alt={viewingItem.title || "Portfolio Item"} 
                                    className="max-h-[90vh] max-w-full rounded-lg shadow-2xl" 
                                />
                            ) : (
                                <video 
                                    src={viewingItem?.file_url} 
                                    controls 
                                    className="max-h-[90vh] max-w-full rounded-lg shadow-2xl" 
                                />
                            )}
                        </div>
                    </div>
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
