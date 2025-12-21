import { PortfolioRepository } from "@/domain/repositories/portfolio-repository.interface"

export class DeletePortfolioItemUseCase {
  constructor(private portfolioRepository: PortfolioRepository) {}

  async execute(itemId: number): Promise<void> {
    return this.portfolioRepository.deleteItem(itemId)
  }
}
