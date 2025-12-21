import { PortfolioRepository } from "@/domain/repositories/portfolio-repository.interface"
import { PortfolioStats } from "@/domain/entities/portfolio"

export class GetPortfolioStatsUseCase {
  constructor(private portfolioRepository: PortfolioRepository) {}

  async execute(): Promise<PortfolioStats> {
    return await this.portfolioRepository.getStats()
  }
}
