import { HttpClient } from "@/infrastructure/api/axios-adapter"

export interface TermAcceptance {
    id: number
    term_key: string
    version: string
    accepted_at: string
}

export interface TermsRepository {
    check(keys: string[]): Promise<Record<string, boolean>>
    accept(termKey: string, version?: string): Promise<TermAcceptance>
}

export class ApiTermsRepository implements TermsRepository {
    constructor(private http: HttpClient) {}

    async check(keys: string[]): Promise<Record<string, boolean>> {
        const response = await this.http.get<{ data: Record<string, boolean> }>(`/terms/check?keys=${keys.join(',')}`)
        return response.data
    }

    async accept(termKey: string, version?: string): Promise<TermAcceptance> {
        const response = await this.http.post<{ data: TermAcceptance }>("/terms/accept", { term_key: termKey, version })
        return response.data
    }
}
