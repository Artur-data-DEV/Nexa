import { AuthRepository } from "@/domain/repositories/auth-repository.interface"
import { AuthResponse } from "@/domain/entities/user"

type JsonObject = Record<string, unknown>

export class LoginUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(credentials: JsonObject): Promise<AuthResponse> {
    return this.authRepository.login(credentials)
  }
}
