import { PortfolioRepository } from "@/domain/repositories/portfolio-repository.interface"
import { Portfolio, PortfolioItem, PortfolioStats, ReorderRequest } from "@/domain/entities/portfolio"
import { HttpClient } from "../api/axios-adapter"

export class ApiPortfolioRepository implements PortfolioRepository {
  constructor(private http: HttpClient) { }

  async getPortfolio(): Promise<Portfolio> {
    const response = await this.http.get<{
      data: {
        portfolio: {
          user_id: number
          id: number
          title: string
          bio: string
          profile_picture: string | null
          project_links: { title: string; url: string }[]
          items: {
            id: number
            title: string | null
            file_url: string
            media_type: "image" | "video"
            order?: number
          }[]
        }
      }
    }>("/portfolio")

    const apiPortfolio = response.data.portfolio
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      "https://www.nexacreators.com/api"
    const rootUrl = backendUrl.replace(/\/api\/?$/, "")
    const resolveUrl = (path?: string | null) => {
      if (!path) return undefined
      return path.startsWith("/") ? `${rootUrl}${path}` : path || undefined
    }

    return {
      user_id: apiPortfolio.user_id,
      id: apiPortfolio.id,
      title: apiPortfolio.title || "",
      bio: apiPortfolio.bio || "",
      profile_picture_url: resolveUrl(apiPortfolio.profile_picture),
      project_links: apiPortfolio.project_links || [],
      items: apiPortfolio.items.map((item) => ({
        id: item.id,
        file_url: item.file_url,
        media_type: item.media_type,
        title: item.title || undefined,
        order: item.order,
      })),
    }
  }

  async updateProfile(data: FormData): Promise<Portfolio> {
    // Backend response can come in two formats:
    // 1. { portfolio: {...}, user: {...} }
    // 2. { portfolio: { portfolio: {...}, items: [...] } }
    interface ApiPortfolioData {
      user_id: number
      id: number
      title: string
      bio: string
      profile_picture?: string | null
      project_links: { title: string; url: string }[]
      items?: {
        id: number
        title?: string | null
        file_url: string
        media_type: "image" | "video"
        order?: number
      }[]
      portfolio?: ApiPortfolioData
    }

    interface UpdateProfileResponse {
      portfolio: ApiPortfolioData
      user?: { id: number; name: string }
    }

    const response = await this.http.post<{ data: UpdateProfileResponse }>("/portfolio/profile", data)
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      "https://www.nexacreators.com/api"
    const rootUrl = backendUrl.replace(/\/api\/?$/, "")
    const resolveUrl = (path?: string | null) => {
      if (!path) return undefined
      return path.startsWith("/") ? `${rootUrl}${path}` : path || undefined
    }

    // Handle new backend response format { portfolio: ..., user: ... }
    const updatedData = response.data.portfolio

    // If updatedData has the nested structure, extract from it
    const apiPortfolio = updatedData.portfolio || updatedData

    return {
      user_id: apiPortfolio.user_id,
      id: apiPortfolio.id,
      title: apiPortfolio.title || "",
      bio: apiPortfolio.bio || "",
      profile_picture_url: resolveUrl(apiPortfolio.profile_picture),
      project_links: apiPortfolio.project_links || [],
      items: apiPortfolio.items ? apiPortfolio.items.map((item) => ({
        id: item.id,
        file_url: item.file_url,
        media_type: item.media_type,
        title: item.title || undefined,
        order: item.order,
      })) : [],
    }
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
