import { Chat, ChatMessagesResponse, Message } from "@/domain/entities/chat"

export interface ChatRepository {
  getChats(): Promise<Chat[]>
  getMessages(roomId: string): Promise<ChatMessagesResponse>
  sendMessage(roomId: string, content: string): Promise<Message>
  markAsRead(roomId: string, messageIds: number[]): Promise<void>
  sendTypingStatus(roomId: string, isTyping: boolean): Promise<void>
}
