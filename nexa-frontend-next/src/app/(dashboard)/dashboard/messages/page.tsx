"use client"

import { useState, useRef, useCallback, useLayoutEffect, useEffect } from "react"
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
import { Menu, Wifi, WifiOff, MoreVertical, Send, Check, CheckCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { useChat } from "@/presentation/contexts/chat-provider"

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

    const scrollToBottom = useCallback(
        (force = false) => {
            if (!messagesEndRef.current) return
            if (!force && !shouldAutoScroll) return
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
        },
        [shouldAutoScroll]
    )

    useLayoutEffect(() => {
        scrollToBottom()
    }, [messages, scrollToBottom])

    useEffect(() => {
        scrollToBottom(true)
    }, [selectedChat?.room_id, scrollToBottom])

    const handleScroll = () => {
        const container = messagesContainerRef.current
        if (!container) return
        const distanceFromBottom =
            container.scrollHeight - container.scrollTop - container.clientHeight
        setShouldAutoScroll(distanceFromBottom < 80)
    }

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
        if (!selectedChat || !newMessage.trim()) return

        const content = newMessage
        setNewMessage("")
        await sendMessage(selectedChat.room_id, content)

    }

    useEffect(() => {
        const roomId = searchParams.get("roomId")
        if (!roomId) {
            if (typeof window !== "undefined") {
                const lastRoomId = window.localStorage.getItem("last_selected_room_id")
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

    const handleSelectChat = (chat: Chat) => {
        if (typeof window !== "undefined") {
            window.localStorage.setItem("last_selected_room_id", chat.room_id)
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

            setMessages((prev) => {
                // Se a mensagem já existe (por ID ou ID temporário que virou real), ignora
                if (prev.some(m => m.id === incoming.id)) return prev

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
                        <div className="flex items-center justify-between">
                            <span className="font-semibold">{chat.other_user.name}</span>
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
                                            <Button variant="ghost" size="icon" className="-ml-2">
                                                <Menu className="h-5 w-5" />
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
                                        {isConnected ? (
                                            <div className="flex items-center gap-1 bg-green-800/70 text-green-400 px-1 py-0.5 rounded-full text-[10px] font-medium border ">
                                                <Wifi className="h-3 w-3" />

                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 bg-red-100 text-red-700 px-1 py-0.5 rounded-full text-[10px] font-medium border">
                                                <WifiOff className="h-3 w-3" />
                                            </div>
                                        )}
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
                                            <span className={isConnected ? "text-green-600" : "text-muted-foreground"}>
                                                {isConnected ? "Online agora" : "Aguardando conexão..."}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => selectChat(selectedChat)}
                            >
                                <MoreVertical className="h-5 w-5" />
                            </Button>
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
                                                    {msg.message}
                                                    <span className={cn("text-[10px] self-end flex items-center gap-1", isMe ? "text-primary-foreground/70" : "text-muted-foreground")}>
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                            <Button size="icon" onClick={handleSendMessage}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
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
