import { AuthRepository } from "@/domain/repositories/auth-repository.interface"
import { AuthResponse } from "@/domain/entities/user"

type JsonObject = Record<string, unknown>

export class RegisterBrandUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(data: JsonObject): Promise<AuthResponse> {
    const payload = {
      ...data,
      role: "brand",
    }
    return this.authRepository.register(payload)
  }
}
