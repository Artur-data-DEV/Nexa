import { PortfolioRepository } from "@/domain/repositories/portfolio-repository.interface"
import { PortfolioItem } from "@/domain/entities/portfolio"

export class UpdatePortfolioItemUseCase {
  constructor(private portfolioRepository: PortfolioRepository) {}

  async execute(itemId: number, data: { title?: string; description?: string; order?: number }): Promise<PortfolioItem> {
    return await this.portfolioRepository.updateItem(itemId, data)
  }
}
