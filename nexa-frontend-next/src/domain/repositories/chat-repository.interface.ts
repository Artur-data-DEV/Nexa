import { Chat, Message } from "@/domain/entities/chat"

export interface ChatRepository {
  getChats(): Promise<Chat[]>
  getMessages(chatId: number): Promise<Message[]>
  sendMessage(chatId: number, content: string): Promise<Message>
  markAsRead(chatId: number): Promise<void>
}
