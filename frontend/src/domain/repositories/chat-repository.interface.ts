import {
  Chat,
  ChatMessagesResponse,
  Message,
  ArchivedChat,
  ArchivedChatDetail,
  ArchivedChatExport
} from "@/domain/entities/chat"

export interface ChatRepository {
  getChats(includeArchived?: boolean): Promise<Chat[]>
  getMessages(roomId: string): Promise<ChatMessagesResponse>
  sendMessage(roomId: string, content: string): Promise<Message>
  sendFileMessage(roomId: string, file: File, message?: string): Promise<Message>
  markAsRead(roomId: string, messageIds: number[]): Promise<void>
  sendTypingStatus(roomId: string, isTyping: boolean): Promise<void>

  sendGuideMessages(roomId: string): Promise<void>

  // Archived chat methods
  getArchivedChats(limit?: number): Promise<ArchivedChat[]>
  getArchivedChatReport(roomId: string): Promise<ArchivedChatDetail>
  getArchivedChatMessages(roomId: string, page?: number, perPage?: number): Promise<{
    messages: Message[]
    meta: {
      current_page: number
      last_page: number
      per_page: number
      total: number
    }
  }>
  exportArchivedChat(roomId: string): Promise<ArchivedChatExport>
}

