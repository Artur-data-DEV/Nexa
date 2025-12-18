"use client"

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react"
import { Chat, Message } from "@/domain/entities/chat"
import { useAuth } from "@/presentation/contexts/auth-provider"
import { ApiChatRepository } from "@/infrastructure/repositories/chat-repository"
import { api } from "@/infrastructure/api/axios-adapter"
import { toast } from "sonner"

interface ChatContextType {
  chats: Chat[]
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>
  selectedChat: Chat | null
  setSelectedChat: React.Dispatch<React.SetStateAction<Chat | null>>
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  updateChatList: (roomId: string, message: Message) => void
  isInitialLoading: boolean
  isChatLoading: boolean
  selectChat: (chat: Chat) => Promise<void>
  sendMessage: (roomId: string, content: string, file?: File | null) => Promise<void>
  deleteMessage: (messageId: number) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

const chatRepository = new ApiChatRepository(api)

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isChatLoading, setIsChatLoading] = useState(false)

  const currentRequestIdRef = useRef(0)

  const updateChatList = useCallback(
    (roomId: string, message: Message) => {
      setChats(prevChats => {
        const chatIndex = prevChats.findIndex(c => c.room_id === roomId)
        if (chatIndex === -1) return prevChats

        const baseChat = prevChats[chatIndex]

        const updatedChat: Chat = {
          ...baseChat,
          last_message: {
            id: message.id,
            message: message.message,
            message_type: message.message_type,
            sender_id: message.sender_id,
            is_sender: message.is_sender,
            created_at: message.created_at,
          },
          last_message_at: message.created_at,
          unread_count:
            message.sender_id !== user?.id && selectedChat?.room_id !== roomId
              ? baseChat.unread_count + 1
              : baseChat.unread_count,
        }

        const newChats = [...prevChats]
        newChats.splice(chatIndex, 1)
        newChats.unshift(updatedChat)
        return newChats
      })
    },
    [selectedChat?.room_id, user?.id]
  )

  const selectChat = useCallback(
    async (chat: Chat) => {
      if (selectedChat?.room_id === chat.room_id) return

      setSelectedChat(chat)

      const requestId = ++currentRequestIdRef.current

      setIsChatLoading(true)
      setMessages([])

      if (typeof window !== "undefined") {
        const cachedMessages = localStorage.getItem(
          `chat_messages_cache_v1_${chat.room_id}`
        )

        if (cachedMessages) {
          try {
            const parsedMessages: Message[] = JSON.parse(cachedMessages)
            setMessages(parsedMessages)
          } catch {
          }
        }
      }

      try {
        const { messages: msgs } = await chatRepository.getMessages(chat.room_id)

        if (requestId !== currentRequestIdRef.current) {
          return
        }

        setMessages(msgs)

        if (typeof window !== "undefined") {
          localStorage.setItem(
            `chat_messages_cache_v1_${chat.room_id}`,
            JSON.stringify(msgs)
          )
        }
      } catch (error) {
        if (requestId === currentRequestIdRef.current) {
          console.error("Failed to fetch messages", error)
          toast.error("Erro ao carregar mensagens")
        }
      } finally {
        if (requestId === currentRequestIdRef.current) {
          setIsChatLoading(false)
        }
      }
    },
    [selectedChat?.room_id]
  )

  const sendMessage = useCallback(
    async (roomId: string, content: string, file?: File | null) => {
      if (!user?.id) return

      const trimmed = content.trim()
      if (!trimmed && !file) return

      const tempId = Date.now()

      let tempMessage: Message

      if (file) {
        tempMessage = {
          id: tempId,
          message: trimmed || file.name,
          message_type: "file",
          sender_id: user.id,
          sender_name: user.name,
          sender_avatar: user.avatar ?? null,
          is_sender: true,
          is_read: true,
          created_at: new Date().toISOString(),
          file_name: file.name,
        }
      } else {
        tempMessage = {
          id: tempId,
          message: trimmed,
          message_type: "text",
          sender_id: user.id,
          sender_name: user.name,
          sender_avatar: user.avatar ?? null,
          is_sender: true,
          is_read: true,
          created_at: new Date().toISOString(),
        }
      }

      setMessages(prev => [...prev, tempMessage])
      updateChatList(roomId, tempMessage)

      try {
        let sentMessage: Message

        if (file) {
          sentMessage = await chatRepository.sendFileMessage(
            roomId,
            file,
            trimmed || undefined
          )
        } else {
          sentMessage = await chatRepository.sendMessage(roomId, trimmed)
        }

        setMessages(prev => prev.map(msg => (msg.id === tempId ? sentMessage : msg)))
        updateChatList(roomId, sentMessage)
      } catch (error) {
        setMessages(prev => prev.filter(msg => msg.id !== tempId))

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyError = error as any
        const errorMessage =
          anyError?.response?.data?.message || "Erro desconhecido ao enviar mensagem"
        toast.error(`Erro ao enviar: ${errorMessage}`)
      }
    },
    [user, updateChatList]
  )

  const deleteMessage = useCallback(
    (messageId: number) => {
      setMessages(prevMessages => {
        const newMessages = prevMessages.filter(message => message.id !== messageId)

        if (selectedChat) {
          setChats(prevChats => {
            const chatIndex = prevChats.findIndex(
              chat => chat.room_id === selectedChat.room_id
            )

            if (chatIndex === -1) return prevChats

            const baseChat = prevChats[chatIndex]
            const last = newMessages[newMessages.length - 1] ?? null

            const updatedChat: Chat = {
              ...baseChat,
              last_message:
                last
                  ? {
                      id: last.id,
                      message: last.message,
                      message_type: last.message_type,
                      sender_id: last.sender_id,
                      is_sender: last.is_sender,
                      created_at: last.created_at,
                    }
                  : null,
              last_message_at: last ? last.created_at : null,
            }

            const newChats = [...prevChats]
            newChats[chatIndex] = updatedChat
            return newChats
          })
        }

        return newMessages
      })
    },
    [selectedChat, setChats]
  )

  useEffect(() => {
    if (!user?.id) return

    if (typeof window !== "undefined") {
      const cachedChats = localStorage.getItem("chat_list_cache_v1")
      if (cachedChats) {
        try {
          const parsedChats: Chat[] = JSON.parse(cachedChats)
          if (parsedChats.length > 0) {
            setChats(parsedChats)
          }
        } catch {
        }
      }
    }

    const loadInitialData = async () => {
      try {
        const chatsData = await chatRepository.getChats()
        setChats(chatsData)
      } catch (error) {
        console.error("Failed to load initial chat data", error)
        toast.error("Erro ao carregar conversas")
      } finally {
        setIsInitialLoading(false)
      }
    }

    loadInitialData()
  }, [user?.id])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (chats.length === 0) return
    localStorage.setItem("chat_list_cache_v1", JSON.stringify(chats))
  }, [chats])

  useEffect(() => {
    if (!selectedChat) return
    if (typeof window === "undefined") return
    if (messages.length === 0) return
    localStorage.setItem(
      `chat_messages_cache_v1_${selectedChat.room_id}`,
      JSON.stringify(messages)
    )
  }, [messages, selectedChat])

  return (
    <ChatContext.Provider
      value={{
        chats,
        setChats,
        selectedChat,
        setSelectedChat,
        messages,
        setMessages,
        updateChatList,
        isInitialLoading,
        isChatLoading,
        selectChat,
        sendMessage,
        deleteMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export const useChat = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider")
  }
  return context
}
