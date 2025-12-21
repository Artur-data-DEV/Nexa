import { ContractRepository } from "@/domain/repositories/contract-repository.interface"
import { Contract } from "@/domain/entities/contract"
import { HttpClient } from "../api/axios-adapter"

export class ApiContractRepository implements ContractRepository {
    constructor(private http: HttpClient) {}

    async getContracts(filters?: Record<string, any>): Promise<Contract[]> {
        const params = new URLSearchParams(filters).toString()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response: any = await this.http.get<any>(`/contracts?${params}`)
        
        // Handle Laravel Paginator: { success: true, data: { data: [...] } }
        if (response && response.data && Array.isArray(response.data.data)) {
            return response.data.data
        }
        // Fallback
        if (response && Array.isArray(response.data)) {
            return response.data
        }
        return Array.isArray(response) ? response : []
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
