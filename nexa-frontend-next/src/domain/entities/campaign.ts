export interface Brand {
  id: number
  name: string
  email: string
  avatar?: string
}

export interface Campaign {
  id: number
  title: string
  description: string
  briefing?: string
  budget: number
  remuneration_type?: 'paga' | 'permuta'
  logo?: string
  image_url?: string
  deadline: string
  target_states?: string[]
  requirements?: string[]
  brand?: Brand
  brand_id?: number
  type?: string
  category?: string
  status: 'pending' | 'approved' | 'rejected' | 'archived'
  created_at: string
  approved_creators?: number
  attachments?: string[]
  is_featured?: boolean
  is_favorited?: boolean
}
