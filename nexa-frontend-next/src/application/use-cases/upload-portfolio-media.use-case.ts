import { PortfolioRepository } from "@/domain/repositories/portfolio-repository.interface"
import { PortfolioItem } from "@/domain/entities/portfolio"

export class UploadPortfolioMediaUseCase {
  constructor(private portfolioRepository: PortfolioRepository) {}

  async execute(data: FormData): Promise<{ items: PortfolioItem[]; total_items: number }> {
    return this.portfolioRepository.uploadMedia(data)
  }
}
