import { AuthRepository } from "@/domain/repositories/auth-repository.interface"
import { AuthResponse } from "@/domain/entities/user"

export class RegisterBrandUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(data: any): Promise<AuthResponse> {
    const payload = {
      ...data,
      role: "brand",
    }
    return this.authRepository.register(payload)
  }
}
