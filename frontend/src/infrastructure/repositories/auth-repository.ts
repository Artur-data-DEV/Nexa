import { AuthRepository } from "@/domain/repositories/auth-repository.interface"
import { AuthResponse, User } from "@/domain/entities/user"
import { HttpClient } from "../api/axios-adapter"

export class ApiAuthRepository implements AuthRepository {
  constructor(private http: HttpClient) {}

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
    return this.http.get<User>("/user")
  }

  async updateProfile(data: Record<string, any> | FormData): Promise<User> {
    // If FormData, we might need POST with _method=PUT depending on Laravel/Server config for file uploads
    // Assuming standard PUT for JSON or FormData handling
    if (data instanceof FormData) {
        data.append('_method', 'PUT');
        return this.http.post<User>("/user/profile-update", data); // Often better to use POST for files with method spoofing
    }
    return this.http.put<User>("/user/profile", data)
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
}
