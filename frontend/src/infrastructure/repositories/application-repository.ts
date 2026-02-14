import { ApplicationRepository, ApplicationStatusUpdateResult } from "@/domain/repositories/application-repository.interface"
import { Application } from "@/domain/entities/application"
import { HttpClient } from "../api/axios-adapter"

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null

export class ApiApplicationRepository implements ApplicationRepository {
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

    async getMyApplications(filters?: Parameters<ApplicationRepository["getMyApplications"]>[0]): Promise<Application[]> {
        const params = this.buildParams(filters).toString()
        const url = params ? `/applications?${params}` : "/applications"
        const response = await this.http.get<unknown>(url)
        
        // Handle Laravel Paginator: { success: true, data: { data: [...] } }
        if (isRecord(response)) {
            const data = response["data"]
            if (isRecord(data) && Array.isArray(data["data"])) {
                return data["data"] as Application[]
            }
            if (Array.isArray(data)) {
                return data as Application[]
            }
        }
        // Fallback
        return Array.isArray(response) ? (response as Application[]) : []
    }

    async getCampaignApplications(campaignId: number, filters?: Parameters<ApplicationRepository["getCampaignApplications"]>[1]): Promise<Application[]> {
        const params = this.buildParams(filters).toString()
        const url = params ? `/campaigns/${campaignId}/applications?${params}` : `/campaigns/${campaignId}/applications`
        const response = await this.http.get<unknown>(url)
        
        // Handle Laravel Paginator: { success: true, data: { data: [...] } }
        if (isRecord(response)) {
            const data = response["data"]
            if (isRecord(data) && Array.isArray(data["data"])) {
                return data["data"] as Application[]
            }
            if (Array.isArray(data)) {
                return data as Application[]
            }
        }
        return Array.isArray(response) ? (response as Application[]) : []
  }

    async create(campaignId: number, data: Parameters<ApplicationRepository["create"]>[1]): Promise<Application> {
        const response = await this.http.post<unknown, Record<string, unknown>>(
            `/campaigns/${campaignId}/applications`,
            data as Record<string, unknown>
        )
        if (isRecord(response) && isRecord(response["data"])) {
            return response["data"] as unknown as Application
        }
        return response as Application
    }

    async updateStatus(id: number, status: 'approved' | 'rejected'): Promise<ApplicationStatusUpdateResult> {
        const action = status === "approved" ? "approve" : "reject"
        const response = await this.http.post<unknown, Record<string, never>>(`/applications/${id}/${action}`, {})

        if (isRecord(response)) {
            const payload = response["data"]
            const application = isRecord(payload) ? (payload as unknown as Application) : ({} as Application)

            const contractIdRaw = response["contract_id"]
            const contractId =
                typeof contractIdRaw === "number"
                    ? contractIdRaw
                    : typeof contractIdRaw === "string"
                        ? Number(contractIdRaw)
                        : undefined

            return {
                application,
                message: typeof response["message"] === "string" ? response["message"] : undefined,
                chat_room_id: typeof response["chat_room_id"] === "string" ? response["chat_room_id"] : undefined,
                contract_id: Number.isFinite(contractId) ? contractId : undefined,
                contract_status: typeof response["contract_status"] === "string" ? response["contract_status"] : undefined,
                contract_workflow_status:
                    typeof response["contract_workflow_status"] === "string" ? response["contract_workflow_status"] : undefined,
            }
        }

        return {
            application: response as Application,
        }
    }
}
