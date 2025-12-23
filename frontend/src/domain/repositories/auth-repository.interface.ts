import { AuthResponse, User } from "../entities/user"

export interface AuthRepository {
  login(credentials: Record<string, any>): Promise<AuthResponse>
  register(data: Record<string, any>): Promise<AuthResponse>
  logout(): Promise<void>
  me(): Promise<User>
  csrf(): Promise<void>
  updateProfile(data: Record<string, any> | FormData): Promise<User>
  uploadAvatar(file: File | Blob): Promise<User>
  sendOtp(contact: string, type: 'email' | 'whatsapp'): Promise<void>
  verifyOtp(contact: string, type: 'email' | 'whatsapp', code: string): Promise<boolean>
  forgotPassword(email: string): Promise<any>
  resetPassword(data: Record<string, any>): Promise<any>
  verifyStudent(data: { email: string, username: string, courseName: string }): Promise<any>
}
