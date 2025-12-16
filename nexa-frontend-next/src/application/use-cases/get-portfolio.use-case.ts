import { PortfolioRepository } from "@/domain/repositories/portfolio-repository.interface"
import { Portfolio } from "@/domain/entities/portfolio"

export class GetPortfolioUseCase {
  constructor(private portfolioRepository: PortfolioRepository) {}

  async execute(): Promise<Portfolio> {
    return this.portfolioRepository.getPortfolio()
  }
}
