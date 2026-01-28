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
  offer_data?: Record<string, unknown> | null
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

export type ChatStatus = 'active' | 'completed' | 'archived'

export interface Chat {
  id: number
  room_id: string
  campaign_id: number | null
  campaign_title: string
  campaign_status: string
  chat_status: ChatStatus
  can_send_messages: boolean
  archived_at: string | null
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

// ============ Archived Chat Types ============

export interface ArchivedChatSummary {
  total_messages: number
  total_paid: number
  duration_days: number
}

export interface ArchivedChat {
  id: number
  room_id: string
  campaign_id: number
  campaign_title: string
  other_user: {
    id: number
    name: string
    avatar: string | null
  }
  archived_at: string
  closure_reason: string
  summary: ArchivedChatSummary
}

export interface CampaignReportFinancial {
  contract_value: number
  platform_fee: number
  total_paid_to_creator: number
}

export interface CampaignReportCommunication {
  total_messages: number
  messages_by_type: Record<string, number>
}

export interface CampaignReportTimeline {
  chat_started_at: string
  chat_archived_at: string | null
  first_offer_at: string | null
  contract_signed_at: string | null
  contract_completed_at: string | null
}

export interface CampaignReport {
  campaign: {
    id: number
    title: string
    type: string
    status: string
  }
  participants: {
    brand: { id: number; name: string }
    creator: { id: number; name: string }
  }
  financial: CampaignReportFinancial
  communication: CampaignReportCommunication
  timeline: CampaignReportTimeline
  duration_days: number
}

export interface ArchivedChatDetail {
  room_id: string
  archived_at: string
  closure_reason: string
  report: CampaignReport
}

export interface ArchivedChatExport {
  export_date: string
  room_id: string
  report: CampaignReport
  messages: Message[]
  offers: Array<{
    id: number
    title: string
    budget: number
    status: string
    created_at: string
    contract: {
      id: number
      status: string
      workflow_status: string
      creator_amount: number
      completed_at: string | null
    } | null
  }>
}

