import { PortfolioRepository } from "@/domain/repositories/portfolio-repository.interface"
import { Portfolio } from "@/domain/entities/portfolio"

export class UploadPortfolioMediaUseCase {
  constructor(private portfolioRepository: PortfolioRepository) {}

  async execute(data: FormData): Promise<Portfolio> {
    return this.portfolioRepository.uploadMedia(data)
  }
}
