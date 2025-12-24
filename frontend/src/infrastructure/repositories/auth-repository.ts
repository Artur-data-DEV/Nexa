import { AuthRepository } from "@/domain/repositories/auth-repository.interface"
import { AuthResponse, User } from "@/domain/entities/user"
import { HttpClient } from "../api/axios-adapter"

type RawProfile = {
  id: number
  name: string
  email: string
  role: User['role']
  avatar_url?: string
  avatar?: string
  whatsapp?: string
  created_at: string
  updated_at: string
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
}

export class ApiAuthRepository implements AuthRepository {
  constructor(private http: HttpClient) {}

  private resolveUrl(path?: string | null): string | undefined {
    if (!path) return undefined
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api"
    const rootUrl = backendUrl.replace(/\/api\/?$/, "")
    return path.startsWith("/") ? `${rootUrl}${path}` : path
  }

  private normalizeProfile(profile: RawProfile): User {
    const avatar = this.resolveUrl(profile?.avatar_url || profile?.avatar)
    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      avatar,
      whatsapp: profile.whatsapp,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      location: profile.location,
      state: profile.state,
      gender: profile.gender,
      categories: profile.categories,
      balance: profile.balance,
      age: profile.age,
      creator_type: profile.creator_type,
      birth_date: profile.birth_date,
      instagram_handle: profile.instagram_handle,
      tiktok_handle: profile.tiktok_handle,
      youtube_channel: profile.youtube_channel,
      facebook_page: profile.facebook_page,
      twitter_handle: profile.twitter_handle,
      niche: profile.niche,
      industry: profile.industry,
      profession: profile.profession,
      languages: profile.languages,
      has_premium: profile.has_premium,
    }
  }

  async csrf(): Promise<void> {
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      "https://nexa-backend2-1044548850970.southamerica-east1.run.app/api"
    const rootUrl = backendUrl.replace(/\/api\/?$/, "")
    await this.http.get(`${rootUrl}/sanctum/csrf-cookie`, {
      baseURL: rootUrl,
      headers: { "X-Skip-Auth": "true" },
    })
  }

  async login(credentials: Record<string, unknown>): Promise<AuthResponse> {
    await this.csrf()
    return this.http.post<AuthResponse>("/login", credentials as Record<string, unknown>)
  }

  async register(data: Record<string, unknown>): Promise<AuthResponse> {
    // In Laravel usually register returns user or token, adapting to generic response
    return this.http.post<AuthResponse>("/register", data)
  }

  async logout(): Promise<void> {
    await this.http.post("/logout")
  }

  async me(): Promise<User> {
    const resp = await this.http.get<unknown>("/profile")
    const r = resp as { profile?: unknown; data?: { profile?: unknown } }
    const raw = r?.profile ?? r?.data?.profile ?? resp
    return this.normalizeProfile(raw as RawProfile)
  }

  async updateProfile(data: Record<string, unknown> | FormData): Promise<User> {
    if (data instanceof FormData) {
      const avatar = data.get('avatar') || data.get('image')
      const hasAvatar = avatar instanceof Blob
      const payload: Record<string, unknown> = {}
      data.forEach((value, key) => {
        if (key !== 'avatar' && key !== 'image') {
          payload[key] = value
        }
      })
      if (Array.isArray(payload.languages)) {
        payload.languages = payload.languages
      } else if (typeof payload.languages === 'string') {
        try {
          payload.languages = JSON.parse(payload.languages as string)
        } catch {
          payload.languages = [payload.languages]
        }
      }
      if (hasAvatar) {
        try {
          const form = new FormData()
          form.append('avatar', avatar as Blob)
          await this.http.post<unknown>("/profile/avatar", form)
        } catch {
          // continue updating other fields even if avatar upload fails
        }
      }
      const putResp = await this.http.put<unknown>("/profile", payload)
      const r = putResp as { profile?: unknown; data?: { profile?: unknown } }
      const raw = r?.profile ?? r?.data?.profile ?? putResp
      return this.normalizeProfile(raw as RawProfile)
    }
    const putResp = await this.http.put<unknown>("/profile", data as Record<string, unknown>)
    const r = putResp as { profile?: unknown; data?: { profile?: unknown } }
    const raw = r?.profile ?? r?.data?.profile ?? putResp
    return this.normalizeProfile(raw as RawProfile)
  }

  async sendOtp(contact: string, type: 'email' | 'whatsapp'): Promise<void> {
    await this.csrf()
    await this.http.post("/otp/send", { contact, type })
  }

  async verifyOtp(contact: string, type: 'email' | 'whatsapp', code: string): Promise<boolean> {
    try {
        await this.csrf()
        const response: unknown = await this.http.post("/otp/verify", { contact, type, code })
        if (response && typeof response === "object" && "verified" in response) {
          return !!(response as { verified?: boolean }).verified
        }
        return false
    } catch (error) {
        return false
    }
  }

  async forgotPassword(email: string): Promise<unknown> {
    return this.http.post("/forgot-password", { email })
  }

  async resetPassword(data: Record<string, unknown>): Promise<unknown> {
    return this.http.post("/reset-password", data)
  }

  async verifyStudent(data: { email: string, username: string, courseName: string }): Promise<unknown> {
    return this.http.post("/student/verify", {
        purchase_email: data.email,
        course_name: data.courseName
    })
  }

  async uploadAvatar(file: File | Blob): Promise<User> {
    const form = new FormData()
    form.append('avatar', file)
    const resp = await this.http.post<unknown>("/profile/avatar", form)
    const r = resp as { profile?: unknown; data?: { profile?: unknown } }
    const raw = r?.profile ?? r?.data?.profile ?? resp
    return this.normalizeProfile(raw as RawProfile)
  }
}
