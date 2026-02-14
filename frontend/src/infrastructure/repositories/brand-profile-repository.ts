import { HttpClient } from "../api/axios-adapter"

export interface BrandProfile {
    id: number
    user_id: number
    company_name?: string
    cnpj?: string
    website?: string
    description?: string
    niche?: string
    niches?: string[]
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

    private normalizeNiches(niches: unknown, legacyNiche?: string): string[] {
        let values: string[] = []

        if (Array.isArray(niches)) {
            values = niches.filter((item): item is string => typeof item === "string")
        } else if (typeof niches === "string" && niches.trim().length > 0) {
            try {
                const decoded = JSON.parse(niches)
                if (Array.isArray(decoded)) {
                    values = decoded.filter((item): item is string => typeof item === "string")
                } else {
                    values = [niches]
                }
            } catch {
                values = [niches]
            }
        }

        if (values.length === 0 && legacyNiche && legacyNiche.trim().length > 0) {
            values = [legacyNiche]
        }

        const unique: string[] = []
        values.forEach((value) => {
            const normalized = value.trim()
            if (!normalized || unique.includes(normalized)) return
            unique.push(normalized)
        })

        return unique
    }

    private normalizeProfile(profile: BrandProfile & { niches?: unknown }): BrandProfile {
        const niches = this.normalizeNiches(profile.niches, profile.niche)
        return {
            ...profile,
            niches,
            niche: niches[0] ?? profile.niche,
        }
    }

    async getProfile(): Promise<BrandProfile> {
        const response = await this.http.get<{ data: BrandProfile & { niches?: unknown } }>("/brand-profile")
        return this.normalizeProfile(response.data)
    }

    async updateProfile(data: Partial<BrandProfile>): Promise<BrandProfile> {
        const response = await this.http.put<{ data: BrandProfile & { niches?: unknown } }>("/brand-profile", data)
        return this.normalizeProfile(response.data)
    }
}
