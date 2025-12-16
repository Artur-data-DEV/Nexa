import { ChatRepository } from "@/domain/repositories/chat-repository.interface"
import { Chat, Message } from "@/domain/entities/chat"
import { HttpClient } from "../api/axios-adapter"

export class ApiChatRepository implements ChatRepository {
  constructor(private http: HttpClient) {}

  async getChats(): Promise<Chat[]> {
    return this.http.get<Chat[]>("/chats")
  }

  async getMessages(chatId: number): Promise<Message[]> {
    return this.http.get<Message[]>(`/chats/${chatId}/messages`)
  }

  async sendMessage(chatId: number, content: string): Promise<Message> {
    return this.http.post<Message>(`/chats/${chatId}/messages`, { content })
  }

  async markAsRead(chatId: number): Promise<void> {
    await this.http.post(`/chats/${chatId}/read`)
  }
}
