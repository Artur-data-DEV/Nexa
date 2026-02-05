import { Portfolio } from "./portfolio"

export interface User {
  id: number
  name: string
  email: string
  whatsapp?: string
  role: "brand" | "creator" | "admin"
  avatar?: string
  email_verified_at?: string | null
  created_at: string
  updated_at: string
  
  // Extended Profile Fields
  bio?: string
  location?: string
  state?: string
  gender?: string
  categories?: string[]
  balance?: number
  age?: number
  creator_type?: string
  birth_date?: string
  instagram_handle?: string
  tiktok_handle?: string
  youtube_channel?: string
  facebook_page?: string
  twitter_handle?: string
  niche?: string
  industry?: string
  profession?: string
  languages?: string[]
  has_premium?: boolean
  avatar_url?: string
  portfolio?: Portfolio
}

export interface AuthResponse {
  user: User
  token: string
}
