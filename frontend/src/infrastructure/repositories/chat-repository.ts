import { ChatRepository } from "@/domain/repositories/chat-repository.interface"
import { Chat, ChatMessagesResponse, ChatRoomSummary, Message } from "@/domain/entities/chat"
import { HttpClient } from "../api/axios-adapter"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

export class ApiChatRepository implements ChatRepository {
  constructor(private http: HttpClient) {}

  async getChats(): Promise<Chat[]> {
    const response = await this.http.get<unknown>("/chat/rooms")

    if (isRecord(response) && Array.isArray(response["data"])) {
      return response["data"] as Chat[]
    }

    return Array.isArray(response) ? (response as Chat[]) : []
  }

  async getMessages(roomId: string): Promise<ChatMessagesResponse> {
    const response = await this.http.get<unknown>(`/chat/rooms/${roomId}/messages`)

    if (isRecord(response) && isRecord(response["data"])) {
      const data = response["data"]
      const room = isRecord(data) ? data["room"] : undefined
      const messages = isRecord(data) ? data["messages"] : undefined
      return {
        room: room as ChatRoomSummary,
        messages: (Array.isArray(messages) ? messages : []) as Message[],
      }
    }

    return {
      room: {
        id: 0,
        room_id: roomId,
        campaign_id: null,
        campaign_title: "",
      },
      messages: Array.isArray(response) ? (response as Message[]) : [],
    }
  }

  async sendMessage(roomId: string, content: string): Promise<Message> {
    const response = await this.http.post<unknown, { room_id: string; message: string }>("/chat/messages", {
      room_id: roomId,
      message: content,
    })

    if (isRecord(response) && isRecord(response["data"])) {
      return response["data"] as unknown as Message
    }

    return response as Message
  }

  async sendFileMessage(roomId: string, file: File, message?: string): Promise<Message> {
    const formData = new FormData()
    formData.append("room_id", roomId)
    formData.append("file", file)

    if (message && message.trim()) {
      formData.append("message", message.trim())
    }

    const response = await this.http.post<unknown, FormData>("/chat/messages", formData)

    if (isRecord(response) && isRecord(response["data"])) {
      return response["data"] as unknown as Message
    }

    return response as Message
  }

  async markAsRead(roomId: string, messageIds: number[]): Promise<void> {
    await this.http.post("/chat/mark-read", {
      room_id: roomId,
      message_ids: messageIds,
    })
  }

  async sendTypingStatus(roomId: string, isTyping: boolean): Promise<void> {
    await this.http.post("/chat/typing-status", {
      room_id: roomId,
      is_typing: isTyping,
    })
  }
}
