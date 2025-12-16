import { AuthRepository } from "@/domain/repositories/auth-repository.interface"
import { AuthResponse } from "@/domain/entities/user"

export class LoginUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(credentials: any): Promise<AuthResponse> {
    return this.authRepository.login(credentials)
  }
}
