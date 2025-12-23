"use client"

import { useState } from "react"
import { useAuth } from "@/presentation/contexts/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/presentation/components/ui/avatar"
import { Badge } from "@/presentation/components/ui/badge"
import { Button } from "@/presentation/components/ui/button"
import { Mail, MapPin, Calendar, Edit2 } from "lucide-react"
import { EditProfile } from "@/presentation/components/creator/edit-profile"
import { UpdateProfileUseCase } from "@/application/use-cases/update-profile.use-case"
import { ApiAuthRepository } from "@/infrastructure/repositories/auth-repository"
import { api } from "@/infrastructure/api/axios-adapter"
import { toast } from "sonner"
import { MdOutlineVerified } from "react-icons/md";
import { BsFacebook, BsInstagram, BsTiktok, BsTwitter, BsYoutube } from "react-icons/bs"


const authRepository = new ApiAuthRepository(api)
const updateProfileUseCase = new UpdateProfileUseCase(authRepository)

export default function ProfilePage() {
    const { user, updateUser } = useAuth()
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    if (!user) return null

    const handleSaveProfile = async (updatedProfile: Record<string, unknown>) => {
        setIsLoading(true)
        try {
            const form = new FormData()
            Object.keys(updatedProfile || {}).forEach((key) => {
                const val = updatedProfile[key]
                if (key === 'image' && val instanceof Blob) {
                    form.append('avatar', val)
                } else if (key === 'languages' && Array.isArray(val)) {
                    form.append('languages', JSON.stringify(val))
                } else if (val !== undefined && val !== null) {
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
        return (
            <EditProfile
                initialProfile={user}
                onCancel={() => setIsEditing(false)}
                onSave={handleSaveProfile}
                isLoading={isLoading}
            />
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
                                <AvatarImage src={user.avatar} />
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
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="h-4 w-4" />
                                <span className="truncate">{user.email}</span>
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
                        <CardContent className="space-y-9 flex">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground uppercase">Nome Completo</label>
                                    <div className="font-medium truncate" title={user.name}>{user.name}</div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground uppercase">Email</label>
                                    <div className="font-medium">{user.email}</div>
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
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground uppercase">Tipo de Criador</label>
                                    <div className="font-medium capitalize">{user.creator_type || "Não informado"}</div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground uppercase">Nicho</label>
                                    <div className="font-medium">{user.niche || "Não informado"}</div>
                                </div>
                            </div>

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

                                {/* Social Media Links */}
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

                                        {!user.instagram_handle && !user.tiktok_handle && !user.youtube_channel && (
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
