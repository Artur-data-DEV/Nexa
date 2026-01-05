export interface Application {
  id: number
  campaign_id: number
  creator_id: number
  status: 'pending' | 'approved' | 'rejected'
  proposal: string
  budget?: number
  delivery_days?: number
  proposed_budget?: number | null
  estimated_delivery_days?: number | null
  portfolio_links?: string[] | null
  created_at: string
}
