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
}

export interface AuthResponse {
  user: User
  token: string
}
