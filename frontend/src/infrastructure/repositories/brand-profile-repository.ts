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
        return this.http.get<BrandProfile>("/brand-profile")
    }

    async updateProfile(data: Partial<BrandProfile>): Promise<BrandProfile> {
        return this.http.put<BrandProfile>("/brand-profile", data)
    }
}
