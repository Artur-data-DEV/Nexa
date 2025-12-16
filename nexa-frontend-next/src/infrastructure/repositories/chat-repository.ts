import { ChatRepository } from "@/domain/repositories/chat-repository.interface"
import { Chat, ChatMessagesResponse, ChatRoomSummary, Message } from "@/domain/entities/chat"
import { HttpClient } from "../api/axios-adapter"

export class ApiChatRepository implements ChatRepository {
  constructor(private http: HttpClient) {}

  async getChats(): Promise<Chat[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: any = await this.http.get<any>("/chat/rooms")

    if (response && Array.isArray(response.data)) {
      return response.data as Chat[]
    }

    return Array.isArray(response) ? (response as Chat[]) : []
  }

  async getMessages(roomId: string): Promise<ChatMessagesResponse> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: any = await this.http.get<any>(`/chat/rooms/${roomId}/messages`)

    if (response && response.data) {
      const { room, messages } = response.data
      return {
        room: room as ChatRoomSummary,
        messages: messages as Message[],
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: any = await this.http.post<any>("/chat/messages", {
      room_id: roomId,
      message: content,
    })

    if (response && response.data) {
      return response.data as Message
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
