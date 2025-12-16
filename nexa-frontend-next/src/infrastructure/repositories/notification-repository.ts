import { NotificationRepository } from "@/domain/repositories/notification-repository.interface"
import { Notification } from "@/domain/entities/notification"
import { HttpClient } from "../api/axios-adapter"

export class ApiNotificationRepository implements NotificationRepository {
    constructor(private http: HttpClient) {}

    async getNotifications(page = 1, perPage = 20): Promise<{ data: Notification[], total: number, last_page: number }> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response: any = await this.http.get<any>(`/notifications?page=${page}&per_page=${perPage}`)
        
        return {
            data: response.data || [],
            total: response.pagination?.total || 0,
            last_page: response.pagination?.last_page || 1
        }
    }

    async getUnreadCount(): Promise<number> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response: any = await this.http.get<any>('/notifications/unread-count')
        return response.count || 0
    }

    async markAsRead(id: number): Promise<void> {
        await this.http.put(`/notifications/${id}/read`, {})
    }

    async markAllAsRead(): Promise<void> {
        await this.http.put('/notifications/read-all', {})
    }

    async delete(id: number): Promise<void> {
        await this.http.delete(`/notifications/${id}`)
    }
}
