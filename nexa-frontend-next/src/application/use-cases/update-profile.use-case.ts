import { AuthRepository } from "@/domain/repositories/auth-repository.interface"
import { User } from "@/domain/entities/user"

export class UpdateProfileUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(data: any): Promise<User> {
    return this.authRepository.updateProfile(data)
  }
}
