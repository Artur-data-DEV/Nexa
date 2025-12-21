export interface PortfolioItem {
  id: number
  file_url: string
  media_type: "image" | "video"
  title?: string
  description?: string
  order?: number
}

export interface PortfolioLink {
  title: string
  url: string
}

export interface PortfolioStats {
  total_items: number
  images_count: number
  videos_count: number
  is_complete: boolean
  has_minimum_items: boolean
  profile_complete: boolean
}

export interface ReorderRequest {
  item_orders: Array<{
    id: number
    order: number
  }>
}

export interface Portfolio {
  id?: number
  user_id: number
  title: string
  bio: string
  profile_picture_url?: string
  project_links?: PortfolioLink[]
  items: PortfolioItem[]
}
