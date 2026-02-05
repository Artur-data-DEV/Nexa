import { AuthResponse, User } from "../entities/user"

type JsonObject = Record<string, unknown>

export interface AuthRepository {
  login(credentials: JsonObject): Promise<AuthResponse>
  register(data: JsonObject): Promise<AuthResponse>
  logout(): Promise<void>
  me(): Promise<User>
  csrf(): Promise<void>
  updateProfile(data: JsonObject | FormData): Promise<User>
  uploadAvatar(file: File | Blob): Promise<User>
  sendOtp(contact: string, type: 'email' | 'whatsapp'): Promise<string | undefined>
  verifyOtp(contact: string, type: 'email' | 'whatsapp', code: string): Promise<boolean>
  forgotPassword(email: string): Promise<unknown>
  resetPassword(data: JsonObject): Promise<unknown>
  verifyStudent(data: { email: string; username: string; courseName: string }): Promise<unknown>
}
