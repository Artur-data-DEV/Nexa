"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/presentation/contexts/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/presentation/components/ui/avatar"
import { Badge } from "@/presentation/components/ui/badge"
import { Button } from "@/presentation/components/ui/button"
import { Mail, MapPin, Calendar, Edit2, Globe } from "lucide-react"
import { EditProfile } from "@/presentation/components/creator/edit-profile"
import { EditBrandProfile } from "@/presentation/components/brand/edit-brand-profile"
import { UpdateProfileUseCase } from "@/application/use-cases/update-profile.use-case"
import { ApiAuthRepository } from "@/infrastructure/repositories/auth-repository"
import { ApiBrandProfileRepository, BrandProfile } from "@/infrastructure/repositories/brand-profile-repository"
import { api } from "@/infrastructure/api/axios-adapter"
import { toast } from "sonner"
import { MdOutlineVerified } from "react-icons/md";
import { BsFacebook, BsInstagram, BsTiktok, BsTwitter, BsYoutube } from "react-icons/bs"
import { User } from "@/domain/entities/user"

type PortfolioLink = {
    title?: string
    url?: string
}

type Portfolio = {
    project_links?: PortfolioLink[]
}


const authRepository = new ApiAuthRepository(api)
const brandProfileRepository = new ApiBrandProfileRepository(api)
const updateProfileUseCase = new UpdateProfileUseCase(authRepository)

export default function ProfilePage() {
    const { user, updateUser } = useAuth()
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null)
    const [avatarTry, setAvatarTry] = useState(0)
    const avatarSrc = (() => {
        const src = user?.avatar || ""
        if (!src) return ""
        const sep = src.includes("?") ? "&" : "?"
        return `${src}${sep}r=${avatarTry}`
    })()

    useEffect(() => {
        if (user?.role === 'brand') {
            brandProfileRepository.getProfile()
                .then(setBrandProfile)
                .catch(console.error)
        }
    }, [user?.role])

    if (!user) return null

    const handleSaveBrandProfile = async (updatedProfile: BrandProfile & { image?: File | null }) => {
        setIsLoading(true)
        try {
            // Update brand profile data
            const { image, ...data } = updatedProfile
            const savedProfile = await brandProfileRepository.updateProfile(data)
            setBrandProfile(savedProfile)

            // If there's an image, we might need to upload it via a separate endpoint or user update
            // For now, let's assume image update is handled via user profile update for avatar
            // or we need to implement image upload for brand profile specifically if backend supports it.
            // As a fallback/hybrid, if image is provided, we update the user avatar too.
            if (image) {
                const form = new FormData()
                form.append('avatar', image)
                const newUser = await updateProfileUseCase.execute(form)
                const bust = typeof window !== "undefined" ? `?t=${Date.now()}` : ""
                updateUser({
                    ...newUser,
                    avatar: newUser.avatar ? `${newUser.avatar}${bust}` : newUser.avatar
                })
                if (typeof window !== "undefined") {
                    window.location.reload()
                }
            }
             
            // Also update user name if company name changed
            if (updatedProfile.company_name !== user.name) {
                 // We could trigger a user update here if needed, but let's rely on backend syncing or manual update if separate.
                 // For now, just update local user state to reflect change immediately if we want consistency
                 // But strictly speaking, User Name and Brand Company Name might be distinct in some systems.
                 // Assuming they should match:
                 const form = new FormData()
                 form.append('name', updatedProfile.company_name || '')
                 const newUser = await updateProfileUseCase.execute(form)
                 updateUser(newUser)
            }

            setIsEditing(false)
            toast.success("Perfil da marca atualizado com sucesso!")
        } catch (error) {
            console.error("Failed to update brand profile", error)
            toast.error("Falha ao atualizar perfil da marca")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSaveProfile = async (updatedProfile: User & { image?: File | null }) => {
        setIsLoading(true)
        try {
            const form = new FormData()

            // Handle avatar image separately
            if (updatedProfile.image instanceof Blob) {
                form.append('avatar', updatedProfile.image)
            }

            // Exclude fields that should not be sent or are handled separately
            const excludedFields = ['id', 'created_at', 'updated_at', 'email_verified_at', 'avatar', 'avatar_url', 'image', 'balance', 'role', 'has_premium']

            const profileRecord = updatedProfile as unknown as Record<string, unknown>
            Object.keys(updatedProfile || {}).forEach((key) => {
                if (excludedFields.includes(key)) return

                const val = profileRecord[key]

                if (key === 'languages' && Array.isArray(val)) {
                    form.append('languages', JSON.stringify(val))
                } else if (key === 'portfolio') {
                    const portfolio = val as Portfolio | null | undefined
                    portfolio?.project_links?.forEach((link, index) => {
                        if (link.url) {
                            form.append(`project_links[${index}][title]`, link.title || '')
                            form.append(`project_links[${index}][url]`, link.url)
                        }
                    })
                } else if (val !== undefined && val !== null) {
                    if (typeof val === 'string' && val.trim() === '') {
                        return
                    }
                    form.append(key, String(val as unknown as string))
                }
            })

            const newUser = await updateProfileUseCase.execute(form)
            const bust = typeof window !== "undefined" ? `?t=${Date.now()}` : ""
            const nextUser = {
                ...newUser,
                avatar: newUser.avatar ? `${newUser.avatar}${bust}` : newUser.avatar
            }
            updateUser(nextUser)
            if (typeof window !== "undefined" && updatedProfile.image instanceof Blob) {
                window.location.reload()
            }
            setIsEditing(false)
            toast.success("Perfil atualizado com sucesso!")
        } catch (error) {
            console.error("Failed to update profile", error)
            toast.error("Falha ao atualizar perfil")
        } finally {
            setIsLoading(false)
        }
    }

    if (isEditing) {
        if (user.role === 'brand' && brandProfile) {
            return (
                <EditBrandProfile
                    initialProfile={brandProfile}
                    onCancel={() => setIsEditing(false)}
                    onSave={handleSaveBrandProfile}
                    isLoading={isLoading}
                />
            )
        }
        return (
            <EditProfile
                initialProfile={user}
                onCancel={() => setIsEditing(false)}
                onSave={handleSaveProfile}
                isLoading={isLoading}
            />
        )
    }

    if (user.role === 'brand' && brandProfile) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Perfil da Marca</h1>
                    <p className="text-muted-foreground">
                        Gerencie as informações da sua empresa.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-[300px_1fr]">
                    <div className="space-y-6">
                        <Card className="h-fit">
                            <CardHeader className="items-center text-center">
                                <Avatar className="h-32 w-32">
                                    <AvatarImage
                                        src={user.avatar ? avatarSrc : (brandProfile.logo_url || "")}
                                        key={user.avatar ? avatarSrc : brandProfile.logo_url}
                                        onError={() => setTimeout(() => setAvatarTry((t) => (t < 3 ? t + 1 : t)), 1000)}
                                    />
                                    <AvatarFallback className="text-4xl">{brandProfile.company_name?.substring(0, 2).toUpperCase() || user.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <CardTitle className="mt-4">{brandProfile.company_name}</CardTitle>
                                <Badge variant="secondary" className="mt-2 capitalize">Marca</Badge>
                                
                                {user.has_premium && (
                                    <Badge className="mt-1 bg-linear-to-r from-yellow-400 to-orange-500">PRO</Badge>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                                    <Mail className="h-4 w-4 shrink-0" />
                                    <span className="truncate" title={user.email}>{user.email}</span>
                                </div>
                                {(brandProfile.city || brandProfile.state) && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <MapPin className="h-4 w-4" />
                                        <span>{brandProfile.city ? `${brandProfile.city}, ` : ''}{brandProfile.state}</span>
                                    </div>
                                )}
                                {brandProfile.website && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Globe className="h-4 w-4" />
                                        <a href={brandProfile.website} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">{brandProfile.website}</a>
                                    </div>
                                )}
                                <Button className="w-full" variant="outline" onClick={() => setIsEditing(true)}>
                                    <Edit2 className="mr-2 h-4 w-4" />
                                    Editar Perfil
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Detalhes da Empresa</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-xs font-medium text-muted-foreground uppercase">Sobre</label>
                                        <div className="whitespace-pre-wrap">{brandProfile.description || "Não informado"}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground uppercase">Nome da Empresa</label>
                                        <div className="font-medium">{brandProfile.company_name}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground uppercase">CNPJ</label>
                                        <div className="font-medium">{brandProfile.cnpj || "Não informado"}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground uppercase">Nicho</label>
                                        <div className="font-medium">{brandProfile.niche || "Não informado"}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground uppercase">Endereço</label>
                                        <div className="font-medium">{brandProfile.address || "Não informado"}</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
                <p className="text-muted-foreground">
                    Gerencie suas informações pessoais e configurações.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-[300px_1fr]">
                <div className="space-y-6">
                    <Card className="h-fit">
                        <CardHeader className="items-center text-center">
                            <Avatar className="h-32 w-32">
                                    <AvatarImage
                                        src={avatarSrc}
                                        key={avatarSrc}
                                        onError={() => setTimeout(() => setAvatarTry((t) => (t < 3 ? t + 1 : t)), 1000)}
                                    />
                                <AvatarFallback className="text-4xl">{user.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <CardTitle className="mt-4">{user.name}</CardTitle>
                            <Badge variant="secondary" className="mt-2 capitalize">
                                {user.role === 'brand' ? 'Marca' : 'Criador'}
                            </Badge>
                            {user.has_premium && (
                                <Badge className="mt-1 bg-linear-to-r from-yellow-400 to-orange-500">PRO</Badge>
                            )}
                            {!user.has_premium && (
                                <div className="mt-3 w-full px-4">
                                    <div className="flex items-center justify-center rounded-md border px-3 py-2">
                                        <div className="flex items-center gap-2">
                                            <MdOutlineVerified className="h-4 w-4 text-purple-500" />
                                            <span className="text-xs font-semibold text-foreground">Plano gratuito</span>
                                        </div>

                                    </div>
                                </div>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                                <Mail className="h-4 w-4 shrink-0" />
                                <span className="truncate" title={user.email}>{user.email}</span>
                            </div>
                            {user.location || user.state && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <MapPin className="h-4 w-4" />
                                    <span>{user.location || user.state}</span>
                                </div>
                            )}
                            {user.created_at && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span>Membro desde {new Date(user.created_at).getFullYear()}</span>
                                </div>
                            )}

                            <Button className="w-full" variant="outline" onClick={() => setIsEditing(true)}>
                                <Edit2 className="mr-2 h-4 w-4" />
                                Editar Perfil
                            </Button>
                        </CardContent>
                    </Card>

                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Detalhes Pessoais</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                <div className="space-y-1 md:col-span-2 lg:col-span-3">
                                    <label className="text-xs font-medium text-muted-foreground uppercase">Nome Completo</label>
                                    <div className="font-medium truncate" title={user.name}>{user.name}</div>
                                </div>
                                <div className="space-y-1 min-w-0">
                                    <label className="text-xs font-medium text-muted-foreground uppercase">Email</label>
                                    <div className="font-medium truncate" title={user.email}>{user.email}</div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground uppercase">WhatsApp</label>
                                    <div className="font-medium">{user.whatsapp || "Não informado"}</div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground uppercase">Estado</label>
                                    <div className="font-medium">{user.state || "Não informado"}</div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground uppercase">Profissão</label>
                                    <div className="font-medium">{user.profession || "Não informado"}</div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground uppercase">Nicho</label>
                                    <div className="font-medium">{user.niche || "Não informado"}</div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground uppercase">Tipo de Criador</label>
                                    <div className="font-medium capitalize">{user.creator_type || "Não informado"}</div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground uppercase">Gênero</label>
                                    <div className="font-medium capitalize">
                                        {user.gender === 'male' ? 'Masculino' : user.gender === 'female' ? 'Feminino' : user.gender || 'Não informado'}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground uppercase">Data de Nascimento</label>
                                    <div className="font-medium">
                                        {user.birth_date ? new Date(user.birth_date).toLocaleDateString('pt-BR') : "Não informado"}
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)]">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground uppercase">Idiomas</label>
                                    <div className="flex flex-wrap gap-2">
                                        {user.languages && user.languages.length > 0 ? (
                                            user.languages.map(lang => (
                                                <Badge key={lang} variant="outline">{lang}</Badge>
                                            ))
                                        ) : (
                                            <span className="text-sm">Não informado</span>
                                        )}
                                    </div>
                                </div>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Redes Sociais</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {user.instagram_handle && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <BsInstagram className="h-4 w-4 text-pink-500" />
                                                <span>{user.instagram_handle}</span>
                                            </div>
                                        )}
                                        {user.tiktok_handle && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <BsTiktok className="h-4 w-4 text-black dark:text-white" />
                                                <span>{user.tiktok_handle}</span>
                                            </div>
                                        )}
                                        {user.youtube_channel && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <BsYoutube className="h-4 w-4 text-red-500" />
                                                <span>{user.youtube_channel}</span>
                                            </div>
                                        )}
                                        {user.twitter_handle && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <BsTwitter className="h-4 w-4 text-blue-400" />
                                                <span>{user.twitter_handle}</span>
                                            </div>
                                        )}
                                        {user.facebook_page && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <BsFacebook className="h-4 w-4 text-blue-600" />
                                                <span>{user.facebook_page}</span>
                                            </div>
                                        )}
                                        {!user.instagram_handle && !user.tiktok_handle && !user.youtube_channel && !user.twitter_handle && !user.facebook_page && (
                                            <span className="text-sm text-muted-foreground">Nenhuma rede social vinculada.</span>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
