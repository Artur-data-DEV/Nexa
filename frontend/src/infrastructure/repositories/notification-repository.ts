import { NotificationRepository } from "@/domain/repositories/notification-repository.interface"
import { Notification } from "@/domain/entities/notification"
import { HttpClient } from "../api/axios-adapter"

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null

export class ApiNotificationRepository implements NotificationRepository {
    constructor(private http: HttpClient) {}

    async getNotifications(page = 1, perPage = 20): Promise<{ data: Notification[], total: number, last_page: number }> {
        const response = await this.http.get<unknown>(`/notifications?page=${page}&per_page=${perPage}`)
        const data = isRecord(response) ? response["data"] : undefined
        const pagination = isRecord(response) ? response["pagination"] : undefined
        
        return {
            data: Array.isArray(data) ? (data as Notification[]) : [],
            total: isRecord(pagination) && typeof pagination["total"] === "number" ? pagination["total"] : 0,
            last_page: isRecord(pagination) && typeof pagination["last_page"] === "number" ? pagination["last_page"] : 1
        }
    }

    async getUnreadCount(): Promise<number> {
        const response = await this.http.get<unknown>('/notifications/unread-count')
        return isRecord(response) && typeof response["count"] === "number" ? response["count"] : 0
    }

    async markAsRead(id: number): Promise<void> {
        await this.http.post(`/notifications/${id}/mark-read`, {})
    }

    async markAllAsRead(): Promise<void> {
        await this.http.post('/notifications/mark-all-read', {})
    }

    async delete(id: number): Promise<void> {
        await this.http.delete(`/notifications/${id}`)
    }
}
