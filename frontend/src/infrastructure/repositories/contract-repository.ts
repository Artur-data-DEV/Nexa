import { ContractRepository } from "@/domain/repositories/contract-repository.interface"
import { Contract } from "@/domain/entities/contract"
import { HttpClient } from "../api/axios-adapter"

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null

export class ApiContractRepository implements ContractRepository {
    constructor(private http: HttpClient) {}

    private buildParams(filters?: Record<string, string | number | boolean | null | undefined>) {
        const params = new URLSearchParams()
        if (!filters) return params
        for (const [key, value] of Object.entries(filters)) {
            if (value === undefined || value === null) continue
            params.append(key, String(value))
        }
        return params
    }

    async getContracts(filters?: Parameters<ContractRepository["getContracts"]>[0]): Promise<Contract[]> {
        const params = this.buildParams(filters).toString()
        const url = params ? `/contracts?${params}` : "/contracts"
        const response = await this.http.get<unknown>(url)
        
        // Handle Laravel Paginator: { success: true, data: { data: [...] } }
        if (isRecord(response)) {
            const data = response["data"]
            if (isRecord(data) && Array.isArray(data["data"])) {
                return data["data"] as Contract[]
            }
            if (Array.isArray(data)) {
                return data as Contract[]
            }
        }
        // Fallback
        return Array.isArray(response) ? (response as Contract[]) : []
    }

    async getContract(id: number): Promise<Contract> {
        return this.http.get<Contract>(`/contracts/${id}`)
    }

    async updateStatus(id: number, status: string): Promise<Contract> {
        return this.http.put<Contract>(`/contracts/${id}/status`, { status })
    }

    async create(data: Partial<Contract>): Promise<Contract> {
        return this.http.post<Contract>("/contracts", data)
    }
}
