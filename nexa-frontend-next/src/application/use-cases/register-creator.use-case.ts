import { AuthRepository } from "@/domain/repositories/auth-repository.interface"
import { AuthResponse } from "@/domain/entities/user"

export class RegisterCreatorUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(data: any): Promise<AuthResponse> {
    // Add role identifier for backend
    const payload = {
      ...data,
      role: "creator",
    }
    return this.authRepository.register(payload)
  }
}
