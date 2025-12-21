import { Notification } from "@/domain/entities/notification"

export interface NotificationRepository {
    getNotifications(page?: number, perPage?: number): Promise<{ data: Notification[], total: number, last_page: number }>
    getUnreadCount(): Promise<number>
    markAsRead(id: number): Promise<void>
    markAllAsRead(): Promise<void>
    delete(id: number): Promise<void>
}
