import { PortfolioRepository } from "@/domain/repositories/portfolio-repository.interface"
import { ReorderRequest } from "@/domain/entities/portfolio"

export class ReorderPortfolioItemsUseCase {
  constructor(private portfolioRepository: PortfolioRepository) {}

  async execute(data: ReorderRequest): Promise<void> {
    return await this.portfolioRepository.reorderItems(data)
  }
}
