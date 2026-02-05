"use client"

import { useState, useRef, useCallback, useLayoutEffect, useEffect, FormEvent, ChangeEvent } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/presentation/contexts/auth-provider"
import { useEcho } from "@/presentation/contexts/echo-provider"
import { ApiChatRepository } from "@/infrastructure/repositories/chat-repository"
import { api } from "@/infrastructure/api/axios-adapter"
import { Chat, Message } from "@/domain/entities/chat"
import type { AxiosError } from "axios"
import { Avatar, AvatarFallback, AvatarImage } from "@/presentation/components/ui/avatar"
import { Button } from "@/presentation/components/ui/button"
import { Input } from "@/presentation/components/ui/input"
import { ScrollArea } from "@/presentation/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/presentation/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/presentation/components/ui/dialog"
import { Textarea } from "@/presentation/components/ui/textarea"
import { Badge } from "@/presentation/components/ui/badge"
import { Label } from "@/presentation/components/ui/label"
import { MessageCircle, Wifi, WifiOff, MoreVertical, Send, Check, CheckCheck, Briefcase, DollarSign, Calendar, Clock, X, Paperclip, FileText, Info, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { useChat } from "@/presentation/contexts/chat-provider"
import { toast } from "sonner"
import CampaignTimelineSheet from "@/presentation/components/campaigns/campaign-timeline-sheet"
import ReviewModal from "@/presentation/components/campaigns/review-modal"
import { ApiContractRepository } from "@/infrastructure/repositories/contract-repository"
import { Contract } from "@/domain/entities/contract"

const chatRepository = new ApiChatRepository(api)

type OfferData = {
    id?: number
    status?: string
    title?: string
    description?: string
    formatted_budget?: string
    budget?: number
    estimated_days?: number
    days_until_expiry?: number
}

type NewMessageEvent = {
    messageId?: number
    message?: string
    messageType?: string
    senderId: number
    senderName: string
    senderAvatar: string | null
    timestamp?: string
    fileData?: {
        file_path?: string | null
        file_name?: string | null
        file_size?: number | null
        file_type?: string | null
        file_url?: string | null
    }
    offerData?: Record<string, unknown> | null
}

type MessagesReadEvent = {
    messageIds: number[]
}

const toOfferData = (data: Record<string, unknown>): OfferData => {
    const rawId = data.id
    const id =
        typeof rawId === "number" ? rawId : typeof rawId === "string" ? Number(rawId) : undefined

    const rawBudget = data.budget
    const budget =
        typeof rawBudget === "number"
            ? rawBudget
            : typeof rawBudget === "string"
                ? Number(rawBudget)
                : undefined

    const rawEstimated = data.estimated_days
    const estimated_days =
        typeof rawEstimated === "number"
            ? rawEstimated
            : typeof rawEstimated === "string"
                ? Number(rawEstimated)
                : undefined

    const rawDaysUntilExpiry = data.days_until_expiry
    const days_until_expiry =
        typeof rawDaysUntilExpiry === "number"
            ? rawDaysUntilExpiry
            : typeof rawDaysUntilExpiry === "string"
                ? Number(rawDaysUntilExpiry)
                : undefined

    return {
        id: Number.isFinite(id) ? id : undefined,
        status: typeof data.status === "string" ? data.status : undefined,
        title: typeof data.title === "string" ? data.title : undefined,
        description: typeof data.description === "string" ? data.description : undefined,
        formatted_budget: typeof data.formatted_budget === "string" ? data.formatted_budget : undefined,
        budget: Number.isFinite(budget) ? budget : undefined,
        estimated_days: Number.isFinite(estimated_days) ? estimated_days : undefined,
        days_until_expiry: Number.isFinite(days_until_expiry) ? days_until_expiry : undefined,
    }
}

export default function MessagesPage() {
    const { user } = useAuth()
    const { echo } = useEcho()
    const searchParams = useSearchParams()
    const router = useRouter()
    const {
        chats,
        selectedChat,
        messages,
        setMessages,
        updateChatList,
        isInitialLoading,
        selectChat,
        sendMessage,
        sendGuideMessages,
        isChatLoading,
        setChats,
    } = useChat()
    const [newMessage, setNewMessage] = useState("")
    const [isListOpen, setIsListOpen] = useState(false)
    const [isTyping, setIsTyping] = useState(false)
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const [remoteTyping, setRemoteTyping] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const messagesContainerRef = useRef<HTMLDivElement | null>(null)
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
    const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false)
    const [offerBudget, setOfferBudget] = useState("")
    const [offerEstimatedDays, setOfferEstimatedDays] = useState("")
    const [isSubmittingOffer, setIsSubmittingOffer] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const [isTimelineOpen, setIsTimelineOpen] = useState(false)
    const [contractId, setContractId] = useState<number | null>(null)
    const [offerTitle, setOfferTitle] = useState("")
    const [offerDescription, setOfferDescription] = useState("")
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
    const [contractForReview, setContractForReview] = useState<Contract | null>(null)

    const contractRepository = new ApiContractRepository(api)

    const scrollToBottom = useCallback(
        (force = false) => {
            if (!messagesEndRef.current) return
            if (!force && !shouldAutoScroll) return

            // Usamos um pequeno timeout para garantir que o DOM foi atualizado
            // e as dimensões calculadas corretamente
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
            }, 50)
        },
        [shouldAutoScroll]
    )

    useLayoutEffect(() => {
        scrollToBottom()
    }, [messages, scrollToBottom])

    useEffect(() => {
        if (!messagesEndRef.current) return
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }, [selectedChat?.room_id])

    const handleScroll = () => {
        const container = messagesContainerRef.current
        if (!container) return
        const distanceFromBottom =
            container.scrollHeight - container.scrollTop - container.clientHeight
        setShouldAutoScroll(distanceFromBottom < 100)
    }

    // ResizeObserver para detectar mudanças de tamanho (como imagens carregando)
    useEffect(() => {
        const container = messagesContainerRef.current
        if (!container) return

        const resizeObserver = new ResizeObserver(() => {
            if (shouldAutoScroll) {
                scrollToBottom(true)
            }
        })

        resizeObserver.observe(container)
        return () => resizeObserver.disconnect()
    }, [shouldAutoScroll, scrollToBottom])

    const handleTyping = () => {
        if (!selectedChat) return

        if (!isTyping) {
            setIsTyping(true)
            chatRepository.sendTypingStatus(selectedChat.room_id, true)
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
        }

        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false)
            chatRepository.sendTypingStatus(selectedChat.room_id, false)
        }, 2000)
    }

    const handleSendMessage = async () => {
        if (!selectedChat) return

        const hasText = newMessage.trim().length > 0
        const hasFile = !!selectedFile

        if (!hasText && !hasFile) return

        const content = newMessage
        const fileToSend = selectedFile

        setNewMessage("")
        setSelectedFile(null)

        await sendMessage(selectedChat.room_id, content, fileToSend || undefined)
    }

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            setSelectedFile(file)
        }
    }

    useEffect(() => {
        const roomId = searchParams.get("roomId")
        if (!roomId) {
            if (typeof window !== "undefined") {
                const userId = user?.id ? String(user.id) : "anon"
                const lastRoomId = window.localStorage.getItem(`last_selected_room_id_user_${userId}`)
                if (lastRoomId) {
                    router.replace(`/dashboard/messages?roomId=${lastRoomId}`)
                }
            }
            return
        }

        if (selectedChat?.room_id === roomId) return
        const targetChat = chats.find(chat => chat.room_id === roomId)
        if (!targetChat) return
        selectChat(targetChat)

        // Trigger guide messages (backend will check if already sent)
        sendGuideMessages(roomId).catch(console.error)

        // Fetch contract for this room
        const fetchContract = async () => {
            try {
                const response = await api.get<{ data: any[] }>(`/contracts/chat-room/${roomId}`)
                if (response.data && response.data.length > 0) {
                    setContractId(response.data[0].id)
                } else {
                    setContractId(null)
                }
            } catch (err) {
                console.error("Error fetching contract for room:", err)
            }
        }
        fetchContract()
    }, [searchParams, chats, selectedChat, selectChat, router, user?.id])

    const handleAcceptOffer = async (offerId: number) => {
        if (!offerId || offerId <= 0 || Number.isNaN(offerId)) {
            toast.error("ID da oferta inválido")
            return
        }

        try {
            const response = await api.post<{ success: boolean; message?: string }>(`/offers/${offerId}/accept`)
            if (response.success) {
                toast.success("Oferta aceita com sucesso! Contrato criado.")
            } else {
                throw new Error(response.message || "Erro ao aceitar oferta")
            }
        } catch (error: unknown) {
            const axiosError = error as AxiosError<{ message?: string }>
            toast.error(axiosError.response?.data?.message || "Erro ao aceitar oferta")
        }
    }

    const handleRejectOffer = async (offerId: number) => {
        if (!offerId || offerId <= 0 || Number.isNaN(offerId)) {
            toast.error("ID da oferta inválido")
            return
        }

        try {
            const response = await api.post<{ success: boolean; message?: string }>(`/offers/${offerId}/reject`)
            if (response.success) {
                toast.success("Oferta rejeitada com sucesso")
            } else {
                throw new Error(response.message || "Erro ao rejeitar oferta")
            }
        } catch (error: unknown) {
            const axiosError = error as AxiosError<{ message?: string }>
            toast.error(axiosError.response?.data?.message || "Erro ao rejeitar oferta")
        }
    }

    const handleCancelOffer = async (offerId: number) => {
        if (!offerId || offerId <= 0 || Number.isNaN(offerId)) {
            toast.error("ID da oferta inválido")
            return
        }

        try {
            const response = await api.delete<{ success: boolean; message?: string }>(`/offers/${offerId}`)
            if (response.success) {
                toast.success("Oferta cancelada com sucesso")
            } else {
                throw new Error(response.message || "Erro ao cancelar oferta")
            }
        } catch (error: unknown) {
            const axiosError = error as AxiosError<{ message?: string }>
            toast.error(axiosError.response?.data?.message || "Erro ao cancelar oferta")
        }
    }

    const handleOpenReview = async () => {
        if (!selectedChat) return
        try {
            const response = await api.get<{ data: Contract[] }>(`/contracts/chat-room/${selectedChat.room_id}`)
            if (response.data && response.data.length > 0) {
                // Find completed contract that hasn't been reviewed by me yet
                setContractForReview(response.data[0])
                setIsReviewModalOpen(true)
            } else {
                toast.error("Nenhum contrato encontrado para avaliação")
            }
        } catch (error) {
            console.error("Error fetching contract for review:", error)
            toast.error("Erro ao carregar contrato")
        }
    }

    const handleSubmitOffer = async (event: FormEvent) => {
        event.preventDefault()
        if (!selectedChat || user?.role !== "brand") return

        const budgetValue = parseFloat(offerBudget)
        const daysValue = parseInt(offerEstimatedDays, 10)

        if (!budgetValue || Number.isNaN(budgetValue) || budgetValue < 10) {
            toast.error("Orçamento deve ser pelo menos R$ 10,00")
            return
        }

        if (!daysValue || Number.isNaN(daysValue) || daysValue < 1) {
            toast.error("Prazo estimado deve ser pelo menos 1 dia")
            return
        }

        try {
            setIsSubmittingOffer(true)
            const payload = {
                creator_id: selectedChat.other_user.id,
                chat_room_id: selectedChat.room_id,
                title: offerTitle,
                description: offerDescription,
                budget: budgetValue,
                estimated_days: daysValue,
            }
            const response = await api.post<{ success: boolean; message?: string }, typeof payload>("/offers", payload)

            if (response.success) {
                toast.success("Oferta enviada com sucesso!")
                setIsOfferDialogOpen(false)
                setOfferTitle("")
                setOfferDescription("")
                setOfferBudget("")
                setOfferEstimatedDays("")
            } else {
                throw new Error(response.message || "Erro ao enviar oferta")
            }
        } catch (error: unknown) {
            const axiosError = error as AxiosError<{ message?: string; requires_funding?: boolean; redirect_url?: string }>
            if (axiosError.response?.status === 402 && axiosError.response?.data?.requires_funding) {
                const redirectUrl = axiosError.response?.data?.redirect_url
                const message =
                    axiosError.response?.data?.message ||
                    "Você precisa configurar um método de pagamento antes de enviar ofertas."

                if (typeof window !== "undefined") {
                    const pendingOffer = {
                        creator_id: selectedChat.other_user.id,
                        creator_name: selectedChat.other_user.name,
                        chat_room_id: selectedChat.room_id,
                        budget: budgetValue,
                        estimated_days: daysValue,
                    }
                    window.sessionStorage.setItem("pending_offer", JSON.stringify(pendingOffer))
                }

                toast(message)

                if (typeof window !== "undefined" && redirectUrl) {
                    window.location.href = redirectUrl
                }
            } else {
                const responseData = axiosError.response?.data as { errors?: Record<string, string[]>, message?: string };

                if (responseData?.errors) {
                    Object.values(responseData.errors).flat().forEach((msg) => {
                        toast.error(String(msg));
                    });
                } else {
                    const message =
                        axiosError.response?.data?.message ||
                        (error instanceof Error ? error.message : undefined) ||
                        "Erro ao enviar oferta"
                    toast.error(message)
                }
            }
        } finally {
            setIsSubmittingOffer(false)
        }
    }

    const handleSelectChat = (chat: Chat) => {
        if (typeof window !== "undefined") {
            const userId = user?.id ? String(user.id) : "anon"
            window.localStorage.setItem(`last_selected_room_id_user_${userId}`, chat.room_id)
        }
        router.push(`/dashboard/messages?roomId=${chat.room_id}`)
        setIsListOpen(false)
    }

    useEffect(() => {
        if (!selectedChat || !echo) {
            return
        }

        const channel = echo.private(`chat.${selectedChat.room_id}`)

        // Bind all events similar to useSocket.ts
        channel.listen('.new_message', (e: NewMessageEvent) => {
            const incoming: Message = {
                id: e.messageId || Date.now(),
                message: e.message || "",
                message_type: e.messageType || "text",
                sender_id: e.senderId,
                sender_name: e.senderName,
                sender_avatar: e.senderAvatar,
                is_sender: e.senderId === user?.id,
                is_read: e.senderId === user?.id,
                created_at: e.timestamp || new Date().toISOString(),
                file_path: e.fileData?.file_path,
                file_name: e.fileData?.file_name,
                file_size: e.fileData?.file_size,
                file_type: e.fileData?.file_type,
                file_url: e.fileData?.file_url,
                offer_data: e.offerData,
            }

            setMessages((prev) => {

                // Se a mensagem já existe (por ID ou ID temporário que virou real), ignora
                const alreadyExists = prev.some(m => m.id === incoming.id)
                if (alreadyExists) return prev

                // Se a mensagem é minha e chegou via socket, preciso remover a otimista se ela ainda estiver lá (embora o fluxo de envio já deva ter tratado)
                // Mas como estamos recebendo via socket, o socket pode chegar antes ou depois da resposta da API.
                // Se for minha mensagem, vamos garantir que não duplique verificando se já tem uma mensagem igual recente (otimista)
                if (incoming.is_sender) {
                    // Procura mensagem otimista (id gerado por Date.now() é grande, id do banco é incremental e menor)
                    // Ou verifica por conteúdo e timestamp próximo
                    const isDuplicateOptimistic = prev.some(m =>
                        (m.id > 1000000000000 && m.message === incoming.message) || // ID grande = otimista
                        m.id === incoming.id
                    )
                    if (isDuplicateOptimistic) {
                        // Se achou otimista, substitui pela real
                        return prev.map(m => (m.id > 1000000000000 && m.message === incoming.message) ? incoming : m)
                    }
                }

                return [...prev, incoming]
            })
            updateChatList(selectedChat.room_id, incoming)
            scrollToBottom()

            // Mark as read if it's not my message
            if (incoming.sender_id !== user?.id) {
                chatRepository.markAsRead(selectedChat.room_id, [incoming.id])
            }
        })

        // Handle typing events
        channel.listen('.user_typing', (e: {
            roomId: string
            userId: number
            userName: string
            isTyping: boolean
        }) => {
            if (e.userId !== user?.id) {
                setRemoteTyping(e.isTyping)
                // Auto-clear typing status after 3 seconds just in case we miss the false event
                if (e.isTyping) {
                    setTimeout(() => setRemoteTyping(false), 3000)
                }
            }
        })

        // Handle read receipts
        channel.listen('.messages_read', (e: MessagesReadEvent) => {
            const ids = Array.isArray(e.messageIds) ? e.messageIds : []
            setMessages(prev => prev.map(msg => (ids.includes(msg.id) ? { ...msg, is_read: true } : msg)))
        })

        // Status updates channel (Global)
        const statusChannel = echo.channel('user-status')
        statusChannel.listen('.user_status_updated', (e: { userId: number, isOnline: boolean }) => {
            setChats(prev => prev.map(chat => {
                if (chat.other_user.id === e.userId) {
                    return {
                        ...chat,
                        other_user: {
                            ...chat.other_user,
                            online: e.isOnline
                        }
                    }
                }
                return chat
            }))
        })

        return () => {
            channel.stopListening('.new_message')
            channel.stopListening('.user_typing')
            channel.stopListening('.messages_read')
            statusChannel.stopListening('.user_status_updated')
        }
    }, [selectedChat, echo, scrollToBottom, user?.id, setChats, setMessages, updateChatList])

    const renderChatList = () => (
        <div className="flex flex-col gap-1 p-2" data-testid="chat-room-list">
            {chats.map((chat) => (
                <button
                    key={chat.room_id}
                    onClick={() => handleSelectChat(chat)}
                    data-testid="chat-room"
                    className={cn(
                        "flex items-start gap-3 rounded-lg p-3 text-left text-sm transition-all hover:bg-accent",
                        selectedChat?.room_id === chat.room_id && "bg-accent"
                    )}
                >
                    <Avatar>
                        <AvatarImage src={chat.other_user.avatar || undefined} />
                        <AvatarFallback>
                            {chat.other_user.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col w-full overflow-hidden">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold">{chat.other_user.name}</span>
                                <span
                                    className={cn(
                                        "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
                                        chat.other_user.online
                                            ? "bg-green-500/10 text-green-500 border-green-500/40"
                                            : "bg-muted text-muted-foreground border-transparent"
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "h-1.5 w-1.5 rounded-full",
                                            chat.other_user.online ? "bg-green-500" : "bg-muted-foreground/50"
                                        )}
                                    />
                                    {chat.other_user.online ? "Online" : "Offline"}
                                </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {chat.last_message?.created_at
                                    ? new Date(chat.last_message.created_at).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })
                                    : ""}
                            </span>
                        </div>
                        {chat.campaign_title && (
                            <span className="text-xs font-medium text-primary truncate">
                                {chat.campaign_title}
                            </span>
                        )}
                        <span className="truncate text-muted-foreground">
                            {chat.last_message?.message}
                        </span>
                    </div>
                </button>
            ))}
            {chats.length === 0 && (
                <span className="px-3 py-2 text-sm text-muted-foreground">
                    {isInitialLoading ? "Carregando conversas..." : "Nenhuma conversa encontrada."}
                </span>
            )}
        </div>
    )

    return (
        <div className="flex flex-col md:flex-row h-[calc(100dvh-130px)] md:h-[calc(100vh-9rem)] rounded-lg border bg-background overflow-hidden">
            <div className="hidden md:flex md:w-80 border-r flex-col flex-none">
                <div className="p-4 border-b font-semibold">Mensagens</div>
                <ScrollArea className="flex-1">{renderChatList()}</ScrollArea>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
                {selectedChat ? (
                    <>
                        <div className="p-4 border-b flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="md:hidden">
                                    <Sheet open={isListOpen} onOpenChange={setIsListOpen}>
                                        <SheetTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="-ml-2"
                                                aria-label="Abrir conversas"
                                            >
                                                <MessageCircle className="h-5 w-5" />
                                            </Button>
                                        </SheetTrigger>
                                        <SheetContent side="left" className="w-80 p-0">
                                            <SheetHeader className="p-4 border-b">
                                                <SheetTitle>Mensagens</SheetTitle>
                                            </SheetHeader>
                                            <ScrollArea className="h-full">
                                                <SheetClose asChild>
                                                    <div>{renderChatList()}</div>
                                                </SheetClose>
                                            </ScrollArea>
                                        </SheetContent>
                                    </Sheet>
                                </div>

                                <Avatar>
                                    <AvatarImage src={selectedChat.other_user.avatar || undefined} />
                                    <AvatarFallback>
                                        {selectedChat.other_user.name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-semibold flex items-center gap-2">
                                        {selectedChat.other_user.name}
                                        {(() => {
                                            const chatInList = chats.find(c => c.room_id === selectedChat.room_id);
                                            const isOnline = chatInList ? chatInList.other_user.online : selectedChat.other_user.online;

                                            return isOnline ? (
                                                <div className="flex items-center gap-1 bg-green-800/70 text-green-400 px-1 py-0.5 rounded-full text-[10px] font-medium border">
                                                    <Wifi className="h-3 w-3" />
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 bg-muted text-muted-foreground px-1 py-0.5 rounded-full text-[10px] font-medium border">
                                                    <WifiOff className="h-3 w-3" />
                                                </div>
                                            );
                                        })()}
                                    </div>
                                    <div className="text-xs text-muted-foreground h-4">
                                        {remoteTyping ? (
                                            <div className="flex items-center gap-1">
                                                <span className="text-primary font-medium">Digitando</span>
                                                <div className="flex gap-0.5 pt-1">
                                                    <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                    <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                    <div className="w-1 h-1 bg-primary rounded-full animate-bounce" />
                                                </div>
                                            </div>
                                        ) : (
                                            <span
                                                className={(() => {
                                                    const chatInList = chats.find(c => c.room_id === selectedChat.room_id);
                                                    const isOnline = chatInList ? chatInList.other_user.online : selectedChat.other_user.online;
                                                    return isOnline ? "text-green-600" : "text-muted-foreground";
                                                })()}
                                            >
                                                {(() => {
                                                    const chatInList = chats.find(c => c.room_id === selectedChat.room_id);
                                                    const isOnline = chatInList ? chatInList.other_user.online : selectedChat.other_user.online;
                                                    return isOnline ? "Online agora" : "Offline";
                                                })()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {contractId && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsTimelineOpen(true)}
                                        className="hidden sm:flex"
                                    >
                                        <Clock className="h-4 w-4 mr-2" />
                                        Timeline
                                    </Button>
                                )}
                                {user?.role === "brand" && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setIsOfferDialogOpen(true)}
                                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                                    >
                                        <Briefcase className="h-4 w-4 mr-2" />
                                        Nova oferta
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => selectChat(selectedChat)}
                                >
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                        <div
                            ref={messagesContainerRef}
                            className="flex-1 overflow-y-auto px-4 py-0 mb-1"
                            id="messages-container"
                            onScroll={handleScroll}
                        >
                            <div className="flex flex-col gap-1 h-full">
                                {isChatLoading && messages.length === 0 ? (
                                    <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                                        Carregando mensagens...
                                    </div>
                                ) : (
                                    <>
                                        {messages.map((msg, index) => {
                                            const isMe = msg.sender_id === user?.id
                                            const isOffer =
                                                msg.message_type === "offer" &&
                                                msg.offer_data

                                            if (isOffer) {
                                                const offer =
                                                    msg.offer_data && typeof msg.offer_data === "object"
                                                        ? toOfferData(msg.offer_data)
                                                        : {}
                                                const status = offer.status || "pending"
                                                const isCreatorUser = user?.role === "creator"
                                                const canAccept =
                                                    status === "pending" &&
                                                    isCreatorUser &&
                                                    offer.id &&
                                                    !Number.isNaN(offer.id)
                                                const canReject =
                                                    status === "pending" &&
                                                    isCreatorUser &&
                                                    offer.id &&
                                                    !Number.isNaN(offer.id)
                                                const canCancel =
                                                    status === "pending" &&
                                                    user?.role === "brand" &&
                                                    offer.id &&
                                                    !Number.isNaN(offer.id)

                                                return (
                                                    <div
                                                        key={index}
                                                        className={cn(
                                                            "flex w-max max-w-[75%] flex-col gap-1",
                                                            isMe ? "ml-auto items-end" : "items-start"
                                                        )}
                                                    >
                                                        <div
                                                            className={cn(
                                                                "w-full rounded-lg border px-3 py-2 text-sm",
                                                                isMe
                                                                    ? "bg-linear-to-r from-blue-50 to-indigo-50"
                                                                    : "bg-muted"
                                                            )}
                                                        >
                                                            <div className="flex items-center justify-between mb-1">
                                                                <div className="flex items-center gap-2">
                                                                    <Briefcase className="h-4 w-4 text-primary" />
                                                                    <span className="font-semibold text-xs">
                                                                        {offer.title || "Oferta"}
                                                                    </span>
                                                                </div>
                                                                <Badge
                                                                    variant="outline"
                                                                    className="text-[10px] capitalize"
                                                                >
                                                                    {status}
                                                                </Badge>
                                                            </div>
                                                            {offer.description && (
                                                                <p className="text-xs text-muted-foreground mb-2">
                                                                    {offer.description}
                                                                </p>
                                                            )}
                                                            <div className="flex flex-wrap items-center gap-3 text-[11px] mb-2">
                                                                {(offer.formatted_budget ||
                                                                    offer.budget) && (
                                                                        <div className="flex items-center gap-1">
                                                                            <DollarSign className="h-3 w-3 text-green-600" />
                                                                            <span>
                                                                                {offer.formatted_budget ||
                                                                                    offer.budget}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                {typeof offer.estimated_days ===
                                                                    "number" && (
                                                                        <div className="flex items-center gap-1">
                                                                            <Calendar className="h-3 w-3 text-purple-600" />
                                                                            <span>
                                                                                {offer.estimated_days}{" "}
                                                                                {offer.estimated_days === 1
                                                                                    ? "dia"
                                                                                    : "dias"}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                {typeof offer.days_until_expiry ===
                                                                    "number" && (
                                                                        <div className="flex items-center gap-1">
                                                                            <Clock className="h-3 w-3 text-amber-600" />
                                                                            <span>
                                                                                expira em{" "}
                                                                                {offer.days_until_expiry}{" "}
                                                                                {offer.days_until_expiry === 1
                                                                                    ? "dia"
                                                                                    : "dias"}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                            </div>
                                                            {(canAccept ||
                                                                canReject ||
                                                                canCancel) && (
                                                                    <div className="flex gap-2 justify-end">
                                                                        {canAccept && (
                                                                            <Button
                                                                                size="sm"
                                                                                onClick={() => {
                                                                                    if (typeof offer.id === "number") {
                                                                                        handleAcceptOffer(offer.id)
                                                                                    }
                                                                                }}
                                                                            >
                                                                                Aceitar
                                                                            </Button>
                                                                        )}
                                                                        {canReject && (
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                onClick={() => {
                                                                                    if (typeof offer.id === "number") {
                                                                                        handleRejectOffer(offer.id)
                                                                                    }
                                                                                }}
                                                                            >
                                                                                Rejeitar
                                                                            </Button>
                                                                        )}
                                                                        {canCancel && (
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                onClick={() => {
                                                                                    if (typeof offer.id === "number") {
                                                                                        handleCancelOffer(offer.id)
                                                                                    }
                                                                                }}
                                                                            >
                                                                                Cancelar
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                )}
                                                        </div>
                                                        <span
                                                            className={cn(
                                                                "text-[10px] flex items-center gap-1",
                                                                isMe
                                                                    ? "text-primary-foreground/70"
                                                                    : "text-muted-foreground"
                                                            )}
                                                        >
                                                            {new Date(
                                                                msg.created_at
                                                            ).toLocaleTimeString([], {
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            })}
                                                            {isMe && (
                                                                msg.is_read ? (
                                                                    <CheckCheck className="h-3 w-3" />
                                                                ) : (
                                                                    <Check className="h-3 w-3" />
                                                                )
                                                            )}
                                                        </span>
                                                    </div>
                                                )
                                            }

                                            const isFileMessage = msg.message_type === "file"
                                            const isImageMessage = msg.message_type === "image"

                                            const isSystem = msg.message_type === "system"

                                            if (isSystem) {
                                                return (
                                                    <div
                                                        key={index}
                                                        className="flex w-full flex-col items-center justify-center py-6 px-4"
                                                    >
                                                        <div className="bg-muted/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 max-w-[85%] shadow-sm relative overflow-hidden group">
                                                            <div className="absolute top-0 left-0 w-1 h-full bg-primary/40" />
                                                            <div className="flex items-start gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                                                    <Info className="h-5 w-5 text-primary" />
                                                                </div>
                                                                <div className="flex-1 space-y-2">
                                                                    <div className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                                                                        {(() => {
                                                                            // Simple formatter for bold text (**text**)
                                                                            const parts = (msg.message || "").split(/(\*\*.*?\*\*)/g);
                                                                            return parts.map((part: string, i: number) => {
                                                                                if (part.startsWith('**') && part.endsWith('**')) {
                                                                                    return <strong key={i} className="text-primary">{part.slice(2, -2)}</strong>;
                                                                                }
                                                                                return part;
                                                                            });
                                                                        })()}
                                                                    </div>
                                                                    {msg.message?.toLowerCase().includes('finalizado com sucesso') && (
                                                                        <Button
                                                                            size="sm"
                                                                            className="mt-2"
                                                                            onClick={handleOpenReview}
                                                                        >
                                                                            <Star className="w-4 h-4 mr-2" />
                                                                            Avaliar Parceria
                                                                        </Button>
                                                                    )}
                                                                    <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                                                        Mensagem do Sistema • {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            }

                                            return (
                                                <div
                                                    key={index}
                                                    className={cn(
                                                        "flex w-fit max-w-[85%] flex-col gap-1 rounded-lg px-3 py-2 text-sm shadow-sm",
                                                        isMe
                                                            ? "ml-auto bg-primary text-primary-foreground rounded-br-none"
                                                            : "bg-muted rounded-bl-none"
                                                    )}
                                                >
                                                    {isImageMessage && msg.file_url ? (
                                                        <div className="space-y-1 w-full">
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img
                                                                src={msg.file_url}
                                                                alt={msg.file_name || "Imagem"}
                                                                className="w-full h-auto rounded-md object-cover"
                                                                style={{ maxHeight: '200px' }}
                                                                loading="lazy"
                                                            />
                                                            {msg.message && msg.message !== msg.file_name && (
                                                                <p className="text-xs wrap-break-word">
                                                                    {msg.message}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ) : isFileMessage ? (
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <FileText className="h-4 w-4" />
                                                                <span className="text-sm font-medium truncate inline-block max-w-37.5">
                                                                    {msg.file_name || "Arquivo"}
                                                                </span>
                                                                {msg.formatted_file_size && (
                                                                    <span className="text-[11px] opacity-70">
                                                                        {msg.formatted_file_size}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {msg.file_url && (
                                                                <a
                                                                    href={msg.file_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-[11px] underline"
                                                                >
                                                                    Baixar arquivo
                                                                </a>
                                                            )}
                                                            {msg.message && msg.message !== msg.file_name && (
                                                                <p className="text-xs">
                                                                    {msg.message}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="whitespace-pre-wrap wrap-break-word leading-relaxed">
                                                            {(() => {
                                                                // Simple formatter for bold text (**text**)
                                                                const parts = (msg.message || "").split(/(\*\*.*?\*\*)/g);
                                                                return parts.map((part: string, i: number) => {
                                                                    if (part.startsWith('**') && part.endsWith('**')) {
                                                                        return <strong key={i}>{part.slice(2, -2)}</strong>;
                                                                    }
                                                                    return part;
                                                                });
                                                            })()}
                                                        </div>
                                                    )}
                                                    <span className={cn("text-[10px] self-end flex items-center gap-1 opacity-70 select-none", isMe ? "text-primary-foreground" : "text-muted-foreground")}>
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                        {isMe && (
                                                            msg.is_read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />
                                                        )}
                                                    </span>
                                                </div>
                                            )
                                        })}
                                        {remoteTyping && (
                                            <div className="flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-4 py-3 text-sm bg-muted self-start" data-testid="typing-indicator">
                                                <div className="flex gap-1 items-center">
                                                    <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                    <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                    <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" />
                                                </div>
                                            </div>
                                        )}
                                        <div ref={messagesEndRef} />
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="p-4 border-t flex gap-2 flex-none bg-background z-10">
                            <div className="flex items-center gap-2 flex-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Paperclip className="h-4 w-4" />
                                </Button>
                                <Input
                                    placeholder="Digite sua mensagem..."
                                    value={newMessage}
                                    data-testid="message-input"
                                    onChange={(e) => {
                                        setNewMessage(e.target.value)
                                        handleTyping()
                                    }}
                                    onFocus={() => {
                                        setTimeout(() => scrollToBottom(true), 100)
                                    }}
                                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                                />
                            </div>
                            <Button size="icon" onClick={handleSendMessage} data-testid="send-message-button">
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                        {selectedFile && (
                            <div className="px-4 pb-4 flex items-center justify-between text-xs text-muted-foreground gap-2">
                                <div className="inline-flex items-center gap-2">
                                    <FileText className="h-3 w-3" />
                                    <span className="truncate inline-block w-52">
                                        {selectedFile.name}
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => setSelectedFile(null)}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        <Dialog open={isOfferDialogOpen} onOpenChange={setIsOfferDialogOpen}>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Enviar Proposta</DialogTitle>
                                    <DialogDescription>
                                        Defina os detalhes da sua proposta de parceria.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleSubmitOffer} className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="offer-title">Título da Proposta</Label>
                                        <Input
                                            id="offer-title"
                                            placeholder="Ex: Produção de 3 Reels"
                                            value={offerTitle}
                                            onChange={(e) => setOfferTitle(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="offer-description">Descrição/Detalhes</Label>
                                        <Textarea
                                            id="offer-description"
                                            placeholder="Descreva o que está incluído nesta proposta..."
                                            value={offerDescription}
                                            onChange={(e) => setOfferDescription(e.target.value)}
                                            rows={3}
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="offer_budget">Orçamento (R$)</Label>
                                            <Input
                                                id="offer_budget"
                                                type="number"
                                                step="0.01"
                                                min="10"
                                                placeholder="0,00"
                                                value={offerBudget}
                                                onChange={(e) => setOfferBudget(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="offer_days">Prazo (Dias)</Label>
                                            <Input
                                                id="offer_days"
                                                type="number"
                                                min="1"
                                                placeholder="Ex: 7"
                                                value={offerEstimatedDays}
                                                onChange={(e) => setOfferEstimatedDays(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter className="mt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsOfferDialogOpen(false)}
                                            disabled={isSubmittingOffer}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={isSubmittingOffer}
                                        >
                                            {isSubmittingOffer
                                                ? "Enviando..."
                                                : "Enviar oferta"}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>

                        {contractId && (
                            <CampaignTimelineSheet
                                contractId={contractId}
                                isOpen={isTimelineOpen}
                                onClose={() => setIsTimelineOpen(false)}
                            />
                        )}

                        {contractForReview && (
                            <ReviewModal
                                isOpen={isReviewModalOpen}
                                contract={contractForReview}
                                onReviewSubmitted={() => {
                                    setIsReviewModalOpen(false)
                                    // Refresh messages to show the review status if needed
                                }}
                                onClose={() => setIsReviewModalOpen(false)}
                            />
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
                        <p>Selecione uma conversa para começar</p>
                        <div className="md:hidden">
                            <Sheet open={isListOpen} onOpenChange={setIsListOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="outline">
                                        Abrir lista de mensagens
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-80 p-0">
                                    <SheetHeader className="p-4 border-b">
                                        <SheetTitle>Mensagens</SheetTitle>
                                    </SheetHeader>
                                    <ScrollArea className="h-full">
                                        <SheetClose asChild>
                                            <div>{renderChatList()}</div>
                                        </SheetClose>
                                    </ScrollArea>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
