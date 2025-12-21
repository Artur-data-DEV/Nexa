import { Portfolio, PortfolioItem, PortfolioStats, ReorderRequest } from "../entities/portfolio"

export interface PortfolioRepository {
  getPortfolio(): Promise<Portfolio>
  updateProfile(data: FormData): Promise<Portfolio>
  uploadMedia(data: FormData): Promise<{ items: PortfolioItem[]; total_items: number }>
  deleteItem(itemId: number): Promise<void>
  updateItem(itemId: number, data: { title?: string; description?: string; order?: number }): Promise<PortfolioItem>
  reorderItems(data: ReorderRequest): Promise<void>
  getStats(): Promise<PortfolioStats>
}
