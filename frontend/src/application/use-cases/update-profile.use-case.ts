import { AuthRepository } from "@/domain/repositories/auth-repository.interface"
import { User } from "@/domain/entities/user"

type JsonObject = Record<string, unknown>

export class UpdateProfileUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(data: FormData | JsonObject): Promise<User> {
    return this.authRepository.updateProfile(data)
  }
}
