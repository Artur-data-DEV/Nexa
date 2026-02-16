import { ContractRepository } from "@/domain/repositories/contract-repository.interface"
import { Contract } from "@/domain/entities/contract"
import { HttpClient } from "../api/axios-adapter"

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null

export class ApiContractRepository implements ContractRepository {
    constructor(private http: HttpClient) {}

    private extractContractsFromResponse(response: unknown): Contract[] {
        if (Array.isArray(response)) {
            return response as Contract[]
        }

        if (!isRecord(response)) {
            return []
        }

        const data = response["data"]
        if (Array.isArray(data)) {
            return data as Contract[]
        }

        if (isRecord(data)) {
            const nestedData = data["data"]
            if (Array.isArray(nestedData)) {
                return nestedData as Contract[]
            }

            if (isRecord(nestedData) && typeof nestedData["id"] === "number") {
                return [nestedData as unknown as Contract]
            }

            if (typeof data["id"] === "number") {
                return [data as unknown as Contract]
            }
        }

        if (typeof response["id"] === "number") {
            return [response as unknown as Contract]
        }

        return []
    }

    private extractSingleContract(response: unknown): Contract | null {
        const contracts = this.extractContractsFromResponse(response)
        return contracts.length > 0 ? contracts[0] : null
    }

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

        return this.extractContractsFromResponse(response)
    }

    async getContract(id: number): Promise<Contract> {
        const response = await this.http.get<unknown>(`/contracts/${id}`)
        const contract = this.extractSingleContract(response)
        if (!contract) {
            throw new Error("Contract not found in API response")
        }
        return contract
    }

    async updateStatus(id: number, status: string): Promise<Contract> {
        return this.http.put<Contract>(`/contracts/${id}/status`, { status })
    }

    async updateWorkflowStatus(
        id: number,
        workflowStatus: string,
        options?: { trackingCode?: string }
    ): Promise<Contract> {
        const payload: { workflow_status: string; tracking_code?: string } = {
            workflow_status: workflowStatus,
        }

        if (typeof options?.trackingCode === "string") {
            payload.tracking_code = options.trackingCode
        }

        const response = await this.http.post<{ success: boolean; data: Contract }>(`/contracts/${id}/workflow-status`, payload)
        return response.data
    }

    async update(id: number, data: Partial<Contract>): Promise<Contract> {
        const response = await this.http.put<unknown>(`/contracts/${id}`, data)
        const contract = this.extractSingleContract(response)
        if (!contract) {
            throw new Error("Contract not found in API response")
        }
        return contract
    }

    async create(data: Partial<Contract>): Promise<Contract> {
        return this.http.post<Contract>("/contracts", data)
    }

    async getContractForRoom(roomId: string): Promise<Contract | null> {
        try {
            const response = await this.http.get<unknown>(`/contracts/chat-room/${roomId}`)
            return this.extractSingleContract(response)
        } catch {
            // Return null instead of throwing if not found, to allow graceful handling
            return null
        }
    }
}
