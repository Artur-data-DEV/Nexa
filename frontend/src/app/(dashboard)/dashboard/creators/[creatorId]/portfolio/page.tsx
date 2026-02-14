"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, ExternalLink, Instagram, Music2 } from "lucide-react"

import { api } from "@/infrastructure/api/axios-adapter"
import { Avatar, AvatarFallback, AvatarImage } from "@/presentation/components/ui/avatar"
import { Badge } from "@/presentation/components/ui/badge"
import { Button } from "@/presentation/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card"
import { Skeleton } from "@/presentation/components/ui/skeleton"
import { toast } from "sonner"

type CreatorData = {
    id: number
    name: string
    avatar?: string | null
    bio?: string | null
    instagram_handle?: string | null
    tiktok_handle?: string | null
}

type PortfolioItemData = {
    id: number
    title?: string | null
    description?: string | null
    media_type: "image" | "video" | string
    file_url?: string | null
}

type ProjectLink = {
    title?: string
    url: string
}

type PortfolioData = {
    id: number
    title?: string | null
    bio?: string | null
    profile_picture_url?: string | null
    project_links?: Array<ProjectLink | string>
    items: PortfolioItemData[]
}

type CreatorPortfolioPayload = {
    creator: CreatorData
    portfolio: PortfolioData | null
    stats: {
        total_items: number
        images_count: number
        videos_count: number
    }
}

export default function CreatorPortfolioPage() {
    const params = useParams()
    const router = useRouter()
    const [payload, setPayload] = useState<CreatorPortfolioPayload | null>(null)
    const [loading, setLoading] = useState(true)

    const creatorId = useMemo(() => {
        const raw = params.creatorId
        const normalized = Array.isArray(raw) ? raw[0] : raw
        const id = Number(normalized)
        return Number.isFinite(id) ? id : null
    }, [params.creatorId])

    useEffect(() => {
        const load = async () => {
            if (!creatorId) {
                toast.error("Criador inválido")
                setLoading(false)
                return
            }

            try {
                setLoading(true)
                const response = await api.get<{
                    success: boolean
                    data: CreatorPortfolioPayload
                    message?: string
                }>(`/creators/${creatorId}/profile`)

                if (!response.success || !response.data) {
                    throw new Error(response.message || "Não foi possível carregar o portfólio")
                }

                setPayload(response.data)
            } catch (error) {
                console.error("Failed to load creator portfolio", error)
                toast.error("Erro ao carregar portfólio do criador")
            } finally {
                setLoading(false)
            }
        }

        void load()
    }, [creatorId])

    if (loading) {
        return (
            <div className="space-y-6 p-6">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        )
    }

    if (!payload) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
                <p className="text-sm text-muted-foreground">Não foi possível carregar este portfólio.</p>
                <Button variant="outline" onClick={() => router.back()}>
                    Voltar
                </Button>
            </div>
        )
    }

    const creator = payload.creator
    const portfolio = payload.portfolio
    const items = Array.isArray(portfolio?.items) ? portfolio.items : []
    const projectLinks = (portfolio?.project_links ?? [])
        .map((entry, index) => {
            if (typeof entry === "string") {
                return { title: `Link ${index + 1}`, url: entry }
            }
            if (entry && typeof entry === "object" && typeof entry.url === "string") {
                return { title: entry.title || `Link ${index + 1}`, url: entry.url }
            }
            return null
        })
        .filter((entry): entry is { title: string; url: string } => !!entry && !!entry.url)

    return (
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="w-fit">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
            </Button>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-4">
                            <Avatar className="h-14 w-14">
                                <AvatarImage src={creator.avatar || undefined} />
                                <AvatarFallback>{creator.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-2">
                                <h1 className="text-xl font-semibold">{creator.name}</h1>
                                <p className="text-sm text-muted-foreground">
                                    {portfolio?.title || "Portfólio do criador"}
                                </p>
                                {creator.bio && (
                                    <p className="max-w-2xl text-sm text-muted-foreground">{creator.bio}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {creator.instagram_handle && (
                                <Badge variant="outline" className="gap-1">
                                    <Instagram className="h-3 w-3" />
                                    {creator.instagram_handle}
                                </Badge>
                            )}
                            {creator.tiktok_handle && (
                                <Badge variant="outline" className="gap-1">
                                    <Music2 className="h-3 w-3" />
                                    {creator.tiktok_handle}
                                </Badge>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Links do Portfólio</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {projectLinks.length > 0 ? (
                        projectLinks.map((link, index) => (
                            <a
                                key={`${link.url}-${index}`}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                                {link.title}
                            </a>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground">Nenhum link externo cadastrado.</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Mídias ({items.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {items.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Este criador ainda não publicou mídias no portfólio.</p>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {items.map((item) => (
                                <div key={item.id} className="rounded-lg border p-3">
                                    <div className="mb-2 text-sm font-medium">{item.title || "Item de portfólio"}</div>
                                    {item.description && (
                                        <p className="mb-2 text-xs text-muted-foreground">{item.description}</p>
                                    )}
                                    {item.file_url && item.media_type === "video" ? (
                                        <video controls className="h-44 w-full rounded-md bg-black/10 object-cover">
                                            <source src={item.file_url} />
                                        </video>
                                    ) : item.file_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={item.file_url}
                                            alt={item.title || "Mídia do portfólio"}
                                            className="h-44 w-full rounded-md object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-44 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                                            Arquivo indisponível
                                        </div>
                                    )}
                                    {item.file_url && (
                                        <a
                                            href={item.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                        >
                                            <ExternalLink className="h-3 w-3" />
                                            Abrir original
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

