import { PortfolioRepository } from "@/domain/repositories/portfolio-repository.interface"
import { Portfolio, PortfolioItem, PortfolioStats, ReorderRequest } from "@/domain/entities/portfolio"
import { HttpClient } from "../api/axios-adapter"

export class ApiPortfolioRepository implements PortfolioRepository {
  constructor(private http: HttpClient) {}

  async getPortfolio(): Promise<Portfolio> {
    const response = await this.http.get<{ data: Portfolio }>("/portfolio")
    return response.data
  }

  async updateProfile(data: FormData): Promise<Portfolio> {
    const response = await this.http.post<{ data: Portfolio }>("/portfolio/profile", data)
    return response.data
  }

  async uploadMedia(data: FormData): Promise<{ items: PortfolioItem[]; total_items: number }> {
    const response = await this.http.post<{ data: { items: PortfolioItem[]; total_items: number } }>("/portfolio/media", data)
    return response.data
  }

  async deleteItem(itemId: number): Promise<void> {
    await this.http.delete(`/portfolio/items/${itemId}`)
  }

  async updateItem(itemId: number, data: { title?: string; description?: string; order?: number }): Promise<PortfolioItem> {
    const response = await this.http.put<{ data: PortfolioItem }>(`/portfolio/items/${itemId}`, data)
    return response.data
  }

  async reorderItems(data: ReorderRequest): Promise<void> {
    await this.http.post("/portfolio/reorder", data)
  }

  async getStats(): Promise<PortfolioStats> {
    const response = await this.http.get<{ data: PortfolioStats }>("/portfolio/statistics")
    return response.data
  }
}
