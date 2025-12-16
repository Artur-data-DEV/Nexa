export interface NotificationData {
    [key: string]: any;
}

export interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    data: NotificationData;
    is_read: boolean;
    read_at?: string;
    created_at: string;
}
