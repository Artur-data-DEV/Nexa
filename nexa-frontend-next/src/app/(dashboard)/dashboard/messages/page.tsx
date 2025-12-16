"use client"

import { useEffect, useState, useRef } from "react"
import { Send } from "lucide-react"
import { useAuth } from "@/presentation/contexts/auth-provider"
import { useEcho } from "@/presentation/contexts/echo-provider"
import { ApiChatRepository } from "@/infrastructure/repositories/chat-repository"
import { api } from "@/infrastructure/api/axios-adapter"
import { Chat, Message } from "@/domain/entities/chat"
import { Avatar, AvatarFallback, AvatarImage } from "@/presentation/components/ui/avatar"
import { Button } from "@/presentation/components/ui/button"
import { Input } from "@/presentation/components/ui/input"
import { ScrollArea } from "@/presentation/components/ui/scroll-area"
import { cn } from "@/lib/utils"

const chatRepository = new ApiChatRepository(api)

export default function MessagesPage() {
  const { user } = useAuth()
  const { echo } = useEcho()
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchChats()
  }, [])

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id)
      
      // Subscribe to real-time channel
      const channel = echo.private(`chat.${selectedChat.id}`)
      channel.listen('MessageSent', (e: { message: Message }) => {
        setMessages((prev) => [...prev, e.message])
        scrollToBottom()
      })

      return () => {
        channel.stopListening('MessageSent')
      }
    }
  }, [selectedChat, echo])

  const fetchChats = async () => {
    try {
        const data = await chatRepository.getChats()
        setChats(data)
    } catch (error) {
        console.error("Failed to fetch chats", error)
        // Mock data
        setChats([
            {
                id: 1,
                campaign_id: 1,
                brand_id: 1,
                creator_id: user?.id || 0,
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                brand: { id: 1, name: "Moda Fashion", avatar: "" },
                last_message: { id: 1, chat_id: 1, user_id: 1, content: "Olá! Vimos sua proposta e gostamos muito.", is_read: false, created_at: new Date().toISOString() }
            }
        ])
    }
  }

  const fetchMessages = async (chatId: number) => {
    try {
        const data = await chatRepository.getMessages(chatId)
        setMessages(data)
        scrollToBottom()
    } catch (error) {
        console.error("Failed to fetch messages", error)
        // Mock messages
         setMessages([
            { id: 1, chat_id: 1, user_id: 1, content: "Olá! Vimos sua proposta e gostamos muito.", is_read: true, created_at: new Date(Date.now() - 3600000).toISOString() },
            { id: 2, chat_id: 1, user_id: user?.id || 0, content: "Oi! Que ótima notícia. Estou muito animado para começar.", is_read: true, created_at: new Date(Date.now() - 1800000).toISOString() },
        ])
    }
  }

  const sendMessage = async () => {
    if (!selectedChat || !newMessage.trim()) return

    try {
        // Optimistic update
        const tempMessage: Message = {
            id: Date.now(),
            chat_id: selectedChat.id,
            user_id: user?.id || 0,
            content: newMessage,
            is_read: false,
            created_at: new Date().toISOString()
        }
        setMessages(prev => [...prev, tempMessage])
        setNewMessage("")
        scrollToBottom()

        await chatRepository.sendMessage(selectedChat.id, newMessage)
        // Real message will come via websocket or refresh
    } catch (error) {
        console.error("Failed to send message", error)
    }
  }

  const scrollToBottom = () => {
    if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <div className="flex h-[calc(100vh-120px)] rounded-lg border bg-background overflow-hidden">
      {/* Chat List */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b font-semibold">Mensagens</div>
        <ScrollArea className="flex-1">
            <div className="flex flex-col gap-1 p-2">
                {chats.map(chat => (
                    <button
                        key={chat.id}
                        onClick={() => setSelectedChat(chat)}
                        className={cn(
                            "flex items-start gap-3 rounded-lg p-3 text-left text-sm transition-all hover:bg-accent",
                            selectedChat?.id === chat.id && "bg-accent"
                        )}
                    >
                        <Avatar>
                            <AvatarImage src={chat.brand?.avatar} />
                            <AvatarFallback>{chat.brand?.name.substring(0,2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col w-full overflow-hidden">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold">{chat.brand?.name}</span>
                                <span className="text-xs text-muted-foreground">
                                    {new Date(chat.last_message?.created_at || "").toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            </div>
                            <span className="truncate text-muted-foreground">
                                {chat.last_message?.content}
                            </span>
                        </div>
                    </button>
                ))}
            </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
            <>
                <div className="p-4 border-b flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src={selectedChat.brand?.avatar} />
                        <AvatarFallback>{selectedChat.brand?.name.substring(0,2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="font-semibold">{selectedChat.brand?.name}</div>
                        <div className="text-xs text-muted-foreground">Online agora</div>
                    </div>
                </div>
                
                <ScrollArea className="flex-1 p-4">
                    <div className="flex flex-col gap-4">
                        {messages.map((msg, index) => {
                            const isMe = msg.user_id === user?.id
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
                                    {msg.content}
                                    <span className={cn("text-[10px] self-end", isMe ? "text-primary-foreground/70" : "text-muted-foreground")}>
                                        {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                            )
                        })}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>

                <div className="p-4 border-t flex gap-2">
                    <Input 
                        placeholder="Digite sua mensagem..." 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    />
                    <Button size="icon" onClick={sendMessage}>
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </>
        ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Selecione uma conversa para começar
            </div>
        )}
      </div>
    </div>
  )
}
