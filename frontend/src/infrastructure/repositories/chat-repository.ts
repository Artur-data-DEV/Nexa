import { ChatRepository } from "@/domain/repositories/chat-repository.interface"
import {
  Chat,
  ChatMessagesResponse,
  ChatRoomSummary,
  Message,
  ArchivedChat,
  ArchivedChatDetail,
  ArchivedChatExport
} from "@/domain/entities/chat"
import { HttpClient } from "../api/axios-adapter"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

export class ApiChatRepository implements ChatRepository {
  constructor(private http: HttpClient) { }

  async getChats(includeArchived: boolean = false): Promise<Chat[]> {
    const params = includeArchived ? { include_archived: 'true' } : {}
    const response = await this.http.get<unknown>("/chat/rooms", { params })

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

  async sendGuideMessages(roomId: string): Promise<void> {
    await this.http.post(`/chat/rooms/${roomId}/send-guide-messages`)
  }

  // ============ Archived Chat Methods ============

  async getArchivedChats(limit: number = 20): Promise<ArchivedChat[]> {
    const response = await this.http.get<unknown>("/chat/archived", {
      params: { limit: limit.toString() }
    })

    if (isRecord(response) && Array.isArray(response["data"])) {
      return response["data"] as ArchivedChat[]
    }

    return Array.isArray(response) ? (response as ArchivedChat[]) : []
  }

  async getArchivedChatReport(roomId: string): Promise<ArchivedChatDetail> {
    const response = await this.http.get<unknown>(`/chat/archived/${roomId}`)

    if (isRecord(response) && isRecord(response["data"])) {
      return response["data"] as unknown as ArchivedChatDetail
    }

    throw new Error("Failed to fetch archived chat report")
  }

  async getArchivedChatMessages(
    roomId: string,
    page: number = 1,
    perPage: number = 50
  ): Promise<{
    messages: Message[]
    meta: {
      current_page: number
      last_page: number
      per_page: number
      total: number
    }
  }> {
    const response = await this.http.get<unknown>(`/chat/archived/${roomId}/messages`, {
      params: {
        page: page.toString(),
        per_page: perPage.toString()
      }
    })

    if (isRecord(response)) {
      const data = Array.isArray(response["data"]) ? response["data"] : []
      const meta = isRecord(response["meta"]) ? response["meta"] : {}

      return {
        messages: data as Message[],
        meta: {
          current_page: (meta["current_page"] as number) || 1,
          last_page: (meta["last_page"] as number) || 1,
          per_page: (meta["per_page"] as number) || perPage,
          total: (meta["total"] as number) || 0,
        }
      }
    }

    return {
      messages: [],
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: perPage,
        total: 0
      }
    }
  }

  async exportArchivedChat(roomId: string): Promise<ArchivedChatExport> {
    const response = await this.http.get<unknown>(`/chat/archived/${roomId}/export`)

    if (isRecord(response) && isRecord(response["data"])) {
      return response["data"] as unknown as ArchivedChatExport
    }

    throw new Error("Failed to export archived chat")
  }
}

