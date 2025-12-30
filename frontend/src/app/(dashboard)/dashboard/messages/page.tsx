"use client"

import { useState, useRef, useCallback, useLayoutEffect, useEffect, FormEvent, ChangeEvent } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/presentation/contexts/auth-provider"
import { useEcho } from "@/presentation/contexts/echo-provider"
import { ApiChatRepository } from "@/infrastructure/repositories/chat-repository"
import { api } from "@/infrastructure/api/axios-adapter"
import { Chat, Message } from "@/domain/entities/chat"
import { Avatar, AvatarFallback, AvatarImage } from "@/presentation/components/ui/avatar"
import { Button } from "@/presentation/components/ui/button"
import { Input } from "@/presentation/components/ui/input"
import { ScrollArea } from "@/presentation/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/presentation/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/presentation/components/ui/dialog"
import { Badge } from "@/presentation/components/ui/badge"
import { Label } from "@/presentation/components/ui/label"
import { MessageCircle, Wifi, WifiOff, MoreVertical, Send, Check, CheckCheck, Briefcase, DollarSign, Calendar, Clock, X, AlertCircle, Paperclip, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { useChat } from "@/presentation/contexts/chat-provider"
import { toast } from "sonner"

const chatRepository = new ApiChatRepository(api)

export default function MessagesPage() {
    const { user } = useAuth()
    const { echo, isConnected } = useEcho()
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
        isChatLoading,
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
    }, [searchParams, chats, selectedChat, selectChat, router])

    const handleAcceptOffer = async (offerId: number) => {
        if (!offerId || offerId <= 0 || Number.isNaN(offerId)) {
            toast.error("ID da oferta inválido")
            return
        }

        try {
            const response: any = await api.post(`/offers/${offerId}/accept`)
            if (response.success) {
                toast.success("Oferta aceita com sucesso! Contrato criado.")
            } else {
                throw new Error(response.message || "Erro ao aceitar oferta")
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Erro ao aceitar oferta")
        }
    }

    const handleRejectOffer = async (offerId: number) => {
        if (!offerId || offerId <= 0 || Number.isNaN(offerId)) {
            toast.error("ID da oferta inválido")
            return
        }

        try {
            const response: any = await api.post(`/offers/${offerId}/reject`)
            if (response.success) {
                toast.success("Oferta rejeitada com sucesso")
            } else {
                throw new Error(response.message || "Erro ao rejeitar oferta")
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Erro ao rejeitar oferta")
        }
    }

    const handleCancelOffer = async (offerId: number) => {
        if (!offerId || offerId <= 0 || Number.isNaN(offerId)) {
            toast.error("ID da oferta inválido")
            return
        }

        try {
            const response: any = await api.delete(`/offers/${offerId}`)
            if (response.success) {
                toast.success("Oferta cancelada com sucesso")
            } else {
                throw new Error(response.message || "Erro ao cancelar oferta")
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Erro ao cancelar oferta")
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
                budget: budgetValue,
                estimated_days: daysValue,
            }

            const response: any = await api.post("/offers", payload)

            if (response.success) {
                toast.success("Oferta enviada com sucesso!")
                setIsOfferDialogOpen(false)
                setOfferBudget("")
                setOfferEstimatedDays("")
            } else {
                throw new Error(response.message || "Erro ao enviar oferta")
            }
        } catch (error: any) {
            if (error?.response?.status === 402 && error?.response?.data?.requires_funding) {
                const redirectUrl = error.response?.data?.redirect_url
                const message =
                    error.response?.data?.message ||
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
                const message =
                    error?.response?.data?.message ||
                    error?.message ||
                    "Erro ao enviar oferta"
                toast.error(message)
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
        console.log(`Subscribing to channel: chat.${selectedChat.room_id}`)

        channel.listen('.new_message', (e: any) => {
            console.log('EVENT RECEIVED: .new_message', e)
            const incoming: Message = {
                id: e.messageId || Date.now(),
                message: e.message,
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

            console.log('INCOMING MESSAGE:', incoming)
            console.log('is_sender:', incoming.is_sender, 'user?.id:', user?.id, 'senderId:', e.senderId)

            setMessages((prev) => {
                console.log('PREV MESSAGES COUNT:', prev.length)

                // Se a mensagem já existe (por ID ou ID temporário que virou real), ignora
                const alreadyExists = prev.some(m => m.id === incoming.id)
                console.log('Already exists by ID?', alreadyExists)
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
                    console.log('Is duplicate optimistic?', isDuplicateOptimistic)
                    if (isDuplicateOptimistic) {
                        // Se achou otimista, substitui pela real
                        console.log('Replacing optimistic message')
                        return prev.map(m => (m.id > 1000000000000 && m.message === incoming.message) ? incoming : m)
                    }
                }

                console.log('ADDING NEW MESSAGE TO LIST')
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
            console.log('EVENT RECEIVED: .user_typing', e)
            if (e.userId !== user?.id) {
                setRemoteTyping(e.isTyping)
                // Auto-clear typing status after 3 seconds just in case we miss the false event
                if (e.isTyping) {
                    setTimeout(() => setRemoteTyping(false), 3000)
                }
            }
        })

        // Handle read receipts
        channel.listen('.messages_read', (e: any) => {
            setMessages(prev => prev.map(msg =>
                e.messageIds.includes(msg.id) ? { ...msg, is_read: true } : msg
            ))
        })

        return () => {
            channel.stopListening('.new_message')
            channel.stopListening('.user_typing')
            channel.stopListening('.messages_read')
        }
    }, [selectedChat, echo, scrollToBottom, user?.id])

    const renderChatList = () => (
        <div className="flex flex-col gap-1 p-2">
            {chats.map((chat) => (
                <button
                    key={chat.room_id}
                    onClick={() => handleSelectChat(chat)}
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
                                {user?.role === "brand" && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setIsOfferDialogOpen(true)}
                                    >
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
                                                const offer: any = msg.offer_data
                                                const status: string = offer.status || "pending"
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
                                                                    ? "bg-gradient-to-r from-blue-50 to-indigo-50"
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
                                                                                onClick={() =>
                                                                                    handleAcceptOffer(
                                                                                        offer.id
                                                                                    )
                                                                                }
                                                                            >
                                                                                Aceitar
                                                                            </Button>
                                                                        )}
                                                                        {canReject && (
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                onClick={() =>
                                                                                    handleRejectOffer(
                                                                                        offer.id
                                                                                    )
                                                                                }
                                                                            >
                                                                                Rejeitar
                                                                            </Button>
                                                                        )}
                                                                        {canCancel && (
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                onClick={() =>
                                                                                    handleCancelOffer(
                                                                                        offer.id
                                                                                    )
                                                                                }
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

                                            return (
                                                <div
                                                    key={index}
                                                    className={cn(
                                                        "flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm",
                                                        isMe
                                                            ? "ml-auto bg-primary text-primary-foreground"
                                                            : "bg-muted"
                                                    )}
                                                >
                                                    {isImageMessage && msg.file_url ? (
                                                        <div className="space-y-1 max-w-[200px] sm:max-w-[280px]">
                                                            <img
                                                                src={msg.file_url}
                                                                alt={msg.file_name || "Imagem"}
                                                                className="w-full h-auto rounded-md object-cover"
                                                                style={{ maxHeight: '200px' }}
                                                                loading="lazy"
                                                            />
                                                            {msg.message && msg.message !== msg.file_name && (
                                                                <p className="text-xs break-words">
                                                                    {msg.message}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ) : isFileMessage ? (
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <FileText className="h-4 w-4" />
                                                                <span className="text-sm font-medium truncate max-w-[180px]">
                                                                    {msg.file_name || "Arquivo"}
                                                                </span>
                                                                {msg.formatted_file_size && (
                                                                    <span className="text-[11px] text-muted-foreground">
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
                                                        <>{msg.message}</>
                                                    )}
                                                    <span className={cn("text-[10px] self-end flex items-center gap-1", isMe ? "text-primary-foreground/70" : "text-muted-foreground")}>
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                        {isMe && (
                                                            msg.is_read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />
                                                        )}
                                                    </span>
                                                </div>
                                            )
                                        })}
                                        {remoteTyping && (
                                            <div className="flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-4 py-3 text-sm bg-muted self-start">
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
                            <Button size="icon" onClick={handleSendMessage}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                        {selectedFile && (
                            <div className="px-4 pb-4 flex items-center justify-between text-xs text-muted-foreground gap-2">
                                <div className="inline-flex items-center gap-2">
                                    <FileText className="h-3 w-3" />
                                    <span className="max-w-[200px] truncate">
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
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Nova oferta</DialogTitle>
                                    <DialogDescription>
                                        Defina o orçamento e prazo estimado para esta oferta.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleSubmitOffer} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="offer_budget">
                                                Orçamento (R$)
                                            </Label>
                                            <Input
                                                id="offer_budget"
                                                type="number"
                                                min={10}
                                                step="0.01"
                                                value={offerBudget}
                                                onChange={(e) =>
                                                    setOfferBudget(e.target.value)
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="offer_days">
                                                Prazo estimado (dias)
                                            </Label>
                                            <Input
                                                id="offer_days"
                                                type="number"
                                                min={1}
                                                max={365}
                                                value={offerEstimatedDays}
                                                onChange={(e) =>
                                                    setOfferEstimatedDays(
                                                        e.target.value
                                                    )
                                                }
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
