export interface Message {
  id: number
  message: string
  message_type: string
  sender_id: number
  sender_name: string
  sender_avatar: string | null
  is_sender: boolean
  is_read: boolean
  created_at: string
  file_path?: string | null
  file_name?: string | null
  file_size?: number | null
  file_type?: string | null
  file_url?: string | null
  formatted_file_size?: string | null
  read_at?: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  offer_data?: any
}

export interface ChatLastMessage {
  id: number
  message: string
  message_type: string
  sender_id: number
  is_sender: boolean
  created_at: string
}

export interface ChatOtherUser {
  id: number
  name: string
  avatar: string | null
  online: boolean
}

export interface Chat {
  id: number
  room_id: string
  campaign_id: number | null
  campaign_title: string
  campaign_status: string
  other_user: ChatOtherUser
  last_message: ChatLastMessage | null
  unread_count: number
  last_message_at: string | null
}

export interface ChatRoomSummary {
  id: number
  room_id: string
  campaign_id: number | null
  campaign_title: string
}

export interface ChatMessagesResponse {
  room: ChatRoomSummary
  messages: Message[]
}
