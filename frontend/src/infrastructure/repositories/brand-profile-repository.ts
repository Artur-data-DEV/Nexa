import { HttpClient } from "../api/axios-adapter"

export interface BrandProfile {
    id: number
    user_id: number
    company_name?: string
    cnpj?: string
    website?: string
    description?: string
    niche?: string
    address?: string
    city?: string
    state?: string
    logo_url?: string
}

export interface BrandProfileRepository {
    getProfile(): Promise<BrandProfile>
    updateProfile(data: Partial<BrandProfile>): Promise<BrandProfile>
}

export class ApiBrandProfileRepository implements BrandProfileRepository {
    constructor(private http: HttpClient) {}

    async getProfile(): Promise<BrandProfile> {
        const response = await this.http.get<{ data: BrandProfile }>("/brand-profile")
        return response.data
    }

    async updateProfile(data: Partial<BrandProfile>): Promise<BrandProfile> {
        const response = await this.http.put<{ data: BrandProfile }>("/brand-profile", data)
        return response.data
    }
}
