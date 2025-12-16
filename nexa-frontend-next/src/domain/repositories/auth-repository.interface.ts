import { AuthResponse, User } from "../entities/user"

export interface AuthRepository {
  login(credentials: any): Promise<AuthResponse>
  register(data: any): Promise<AuthResponse>
  logout(): Promise<void>
  me(): Promise<User>
  csrf(): Promise<void>
}
