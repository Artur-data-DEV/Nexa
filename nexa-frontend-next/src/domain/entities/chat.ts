export interface Message {
  id: number
  chat_id: number
  user_id: number
  content: string
  is_read: boolean
  created_at: string
}

export interface Chat {
  id: number
  campaign_id: number
  brand_id: number
  creator_id: number
  status: 'active' | 'archived'
  created_at: string
  updated_at: string
  last_message?: Message
  campaign?: {
      id: number
      title: string
  }
  brand?: {
      id: number
      name: string
      avatar?: string
  }
  creator?: {
      id: number
      name: string
      avatar?: string
  }
}
