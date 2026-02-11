"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
    Calendar,
    MessageCircle,
    DollarSign,
    ChevronRight,
    Search,
    Archive
} from "lucide-react"

import { ApiChatRepository } from "@/infrastructure/repositories/chat-repository"
import { api } from "@/infrastructure/api/axios-adapter"
import { ArchivedChat } from "@/domain/entities/chat"
import { useAuth } from "@/presentation/contexts/auth-provider"

import { Input } from "@/presentation/components/ui/input"
import { Card, CardContent } from "@/presentation/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/presentation/components/ui/avatar"
import { Badge } from "@/presentation/components/ui/badge"
import { Skeleton } from "@/presentation/components/ui/skeleton"

const chatRepository = new ApiChatRepository(api)

export default function ArchivedChatsPage() {
    const router = useRouter()
    const { user } = useAuth()
    const [chats, setChats] = useState<ArchivedChat[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        const fetchArchivedChats = async () => {
            try {
                const data = await chatRepository.getArchivedChats(50)
                setChats(data)
            } catch (error) {
                console.error("Failed to fetch archived chats", error)
            } finally {
                setIsLoading(false)
            }
        }

        if (user) {
            fetchArchivedChats()
        }
    }, [user])

    const filteredChats = chats.filter(chat =>
        chat.campaign_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chat.other_user.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getClosureReasonText = (reason: string) => {
        switch (reason) {
            case 'campaign_completed': return 'Campanha Concluída'
            case 'payment_completed': return 'Pagamento Finalizado'
            case 'contract_completed': return 'Contrato Finalizado'
            case 'manual_archive': return 'Arquivamento Manual'
            default: return 'Finalizado'
        }
    }

    return (
        <div className="container mx-auto py-8 max-w-5xl space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Histórico de Campanhas</h1>
                    <p className="text-muted-foreground mt-1">
                        Acesse o histórico completo de campanhas finalizadas e relatórios.
                    </p>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar por campanha ou usuário..."
                    className="pl-10 max-w-md"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Card key={i}>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-1/3" />
                                        <Skeleton className="h-4 w-1/4" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : filteredChats.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                    <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">Nenhum histórico encontrado</h3>
                    <p className="text-muted-foreground mt-1">
                        {searchTerm ? "Nenhum resultado para sua busca." : "Você ainda não possui campanhas arquivadas."}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredChats.map((chat) => (
                        <Card
                            key={chat.id}
                            className="hover:bg-accent/50 transition-colors cursor-pointer group"
                            onClick={() => router.push(`/dashboard/archived-chats/${chat.room_id}`)}
                        >
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                                    <div className="flex items-center gap-4 flex-1">
                                        <Avatar className="h-12 w-12 border">
                                            <AvatarImage src={chat.other_user.avatar || undefined} />
                                            <AvatarFallback>{chat.other_user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>

                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-lg">{chat.campaign_title}</h3>
                                                <Badge variant="secondary" className="text-xs font-normal">
                                                    {getClosureReasonText(chat.closure_reason)}
                                                </Badge>
                                            </div>
                                            <p className="text-muted-foreground text-sm flex items-center gap-1">
                                                com <span className="font-medium text-foreground">{chat.other_user.name}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 text-sm text-muted-foreground w-full md:w-auto justify-between md:justify-start">
                                        <div className="flex flex-col items-center md:items-end gap-1">
                                            <div className="flex items-center gap-1.5" title="Total Pago">
                                                <DollarSign className="h-4 w-4 text-green-600" />
                                                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(chat.summary.total_paid / 100)}</span>
                                            </div>
                                            <span className="text-xs">Pago</span>
                                        </div>

                                        <div className="bg-border w-px h-8 hidden md:block" />

                                        <div className="flex flex-col items-center md:items-end gap-1">
                                            <div className="flex items-center gap-1.5" title="Mensagens Trocadas">
                                                <MessageCircle className="h-4 w-4 text-blue-500" />
                                                <span>{chat.summary.total_messages}</span>
                                            </div>
                                            <span className="text-xs">Mensagens</span>
                                        </div>

                                        <div className="bg-border w-px h-8 hidden md:block" />

                                        <div className="flex flex-col items-center md:items-end gap-1">
                                            <div className="flex items-center gap-1.5" title="Data de Arquivamento">
                                                <Calendar className="h-4 w-4 text-orange-500" />
                                                <span>{format(new Date(chat.archived_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                                            </div>
                                            <span className="text-xs">Arquivado em</span>
                                        </div>

                                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors ml-2 hidden md:block" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
