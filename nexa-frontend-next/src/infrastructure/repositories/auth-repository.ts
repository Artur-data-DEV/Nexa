import { AuthRepository } from "@/domain/repositories/auth-repository.interface"
import { AuthResponse, User } from "@/domain/entities/user"
import { HttpClient } from "../api/axios-adapter"

export class ApiAuthRepository implements AuthRepository {
  constructor(private http: HttpClient) {}

  async csrf(): Promise<void> {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api"
    const rootUrl = backendUrl.replace(/\/api\/?$/, "")
    await this.http.get(`${rootUrl}/sanctum/csrf-cookie`)
  }

  async login(credentials: any): Promise<AuthResponse> {
    await this.csrf()
    return this.http.post<AuthResponse>("/login", credentials)
  }

  async register(data: any): Promise<AuthResponse> {
    // In Laravel usually register returns user or token, adapting to generic response
    return this.http.post<AuthResponse>("/register", data)
  }

  async logout(): Promise<void> {
    await this.http.post("/logout")
  }

  async me(): Promise<User> {
    return this.http.get<User>("/user")
  }
}
