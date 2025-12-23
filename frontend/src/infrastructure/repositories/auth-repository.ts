import { AuthRepository } from "@/domain/repositories/auth-repository.interface"
import { AuthResponse, User } from "@/domain/entities/user"
import { HttpClient } from "../api/axios-adapter"

export class ApiAuthRepository implements AuthRepository {
  constructor(private http: HttpClient) {}

  private resolveUrl(path?: string | null): string | undefined {
    if (!path) return undefined
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api"
    const rootUrl = backendUrl.replace(/\/api\/?$/, "")
    return path.startsWith("/") ? `${rootUrl}${path}` : path
  }

  private normalizeProfile(profile: any): User {
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
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api"
    const rootUrl = backendUrl.replace(/\/api\/?$/, "")
    await this.http.get(`${rootUrl}/sanctum/csrf-cookie`, {
      baseURL: rootUrl,
      headers: { "X-Skip-Auth": "true" },
    })
  }

  async login(credentials: Record<string, any>): Promise<AuthResponse> {
    await this.csrf()
    return this.http.post<AuthResponse>("/login", credentials)
  }

  async register(data: Record<string, any>): Promise<AuthResponse> {
    // In Laravel usually register returns user or token, adapting to generic response
    return this.http.post<AuthResponse>("/register", data)
  }

  async logout(): Promise<void> {
    await this.http.post("/logout")
  }

  async me(): Promise<User> {
    const resp = await this.http.get<any>("/profile")
    return this.normalizeProfile(resp?.profile || resp?.data?.profile || resp)
  }

  async updateProfile(data: Record<string, any> | FormData): Promise<User> {
    if (data instanceof FormData) {
      const avatar = data.get('avatar') || data.get('image')
      const hasAvatar = avatar instanceof Blob
      const payload: Record<string, any> = {}
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
          const avatarResp = await this.http.post<any>("/profile/avatar", form)
          if (avatarResp?.profile) {
            // ignore, final profile will be returned by PUT
          }
        } catch {
          // continue updating other fields even if avatar upload fails
        }
      }
      const putResp = await this.http.put<any>("/profile", payload)
      return this.normalizeProfile(putResp?.profile || putResp?.data?.profile || putResp)
    }
    const putResp = await this.http.put<any>("/profile", data)
    return this.normalizeProfile(putResp?.profile || putResp?.data?.profile || putResp)
  }

  async sendOtp(contact: string, type: 'email' | 'whatsapp'): Promise<void> {
    await this.csrf()
    await this.http.post("/otp/send", { contact, type })
  }

  async verifyOtp(contact: string, type: 'email' | 'whatsapp', code: string): Promise<boolean> {
    try {
        await this.csrf()
        const response: any = await this.http.post("/otp/verify", { contact, type, code })
        return response.verified === true
    } catch (error) {
        return false
    }
  }

  async forgotPassword(email: string): Promise<any> {
    return this.http.post("/forgot-password", { email })
  }

  async resetPassword(data: Record<string, any>): Promise<any> {
    return this.http.post("/reset-password", data)
  }

  async verifyStudent(data: { email: string, username: string, courseName: string }): Promise<any> {
    return this.http.post("/student/verify", {
        purchase_email: data.email,
        course_name: data.courseName
    })
  }

  async uploadAvatar(file: File | Blob): Promise<User> {
    const form = new FormData()
    form.append('avatar', file)
    const resp = await this.http.post<any>("/profile/avatar", form)
    return this.normalizeProfile(resp?.profile || resp?.data?.profile || resp)
  }
}
