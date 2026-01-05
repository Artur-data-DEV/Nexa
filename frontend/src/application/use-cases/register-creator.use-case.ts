import { AuthRepository } from "@/domain/repositories/auth-repository.interface"
import { AuthResponse } from "@/domain/entities/user"

type JsonObject = Record<string, unknown>

export class RegisterCreatorUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(data: JsonObject): Promise<AuthResponse> {
    // Add role identifier for backend
    const payload = {
      ...data,
      role: "creator",
    }
    return this.authRepository.register(payload)
  }
}
