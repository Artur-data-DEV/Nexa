import { PortfolioRepository } from "@/domain/repositories/portfolio-repository.interface"
import { Portfolio } from "@/domain/entities/portfolio"

export class UpdatePortfolioProfileUseCase {
  constructor(private portfolioRepository: PortfolioRepository) {}

  async execute(data: FormData): Promise<Portfolio> {
    return this.portfolioRepository.updateProfile(data)
  }
}
