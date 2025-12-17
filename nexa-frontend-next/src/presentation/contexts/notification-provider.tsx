"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useAuth } from "@/presentation/contexts/auth-provider"
import { useEcho } from "@/presentation/contexts/echo-provider"
import { Notification } from "@/domain/entities/notification"
import { ApiNotificationRepository } from "@/infrastructure/repositories/notification-repository"
import { api } from "@/infrastructure/api/axios-adapter"
import { toast } from "sonner"

interface BroadcastNotificationPayload {
    id: number
    type: string
    title: string
    message: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any
    created_at?: string
}

interface NotificationContextType {
    notifications: Notification[]
    unreadCount: number
    isLoading: boolean
    fetchNotifications: (page?: number) => Promise<void>
    markAsRead: (id: number) => Promise<void>
    markAllAsRead: () => Promise<void>
    deleteNotification: (id: number) => Promise<void>
    hasMore: boolean
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

const notificationRepository = new ApiNotificationRepository(api)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth()
    const { echo } = useEcho()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)

    const fetchNotifications = useCallback(async (pageNum = 1) => {
        if (!user) return
        setIsLoading(true)
        try {
            const { data, last_page } = await notificationRepository.getNotifications(pageNum)
            if (pageNum === 1) {
                setNotifications(data)
            } else {
                setNotifications(prev => [...prev, ...data])
            }
            setHasMore(pageNum < last_page)
            setPage(pageNum)
        } catch (error) {
            console.error("Failed to fetch notifications", error)
        } finally {
            setIsLoading(false)
        }
    }, [user])

    const updateUnreadCount = useCallback(async () => {
        if (!user) return
        try {
            const count = await notificationRepository.getUnreadCount()
            setUnreadCount(count)
        } catch (error) {
            console.error("Failed to fetch unread count", error)
        }
    }, [user])

    const markAsRead = async (id: number) => {
        const notification = notifications.find(n => n.id === id)
        if (!notification || notification.is_read) {
            return
        }

        setNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)))
        setUnreadCount(prev => Math.max(0, prev - 1))

        try {
            await notificationRepository.markAsRead(id)
        } catch (error) {
            console.error("Failed to mark notification as read", error)
            toast.error("Erro ao marcar notificação como lida")
            await fetchNotifications()
            await updateUnreadCount()
        }
    }

    const markAllAsRead = async () => {
        try {
            await notificationRepository.markAllAsRead()
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
            setUnreadCount(0)
            toast.success("Todas as notificações marcadas como lidas")
        } catch (error) {
            console.error("Failed to mark all as read", error)
            toast.error("Erro ao marcar todas como lidas")
        }
    }

    const deleteNotification = async (id: number) => {
        const notification = notifications.find(n => n.id === id)
        if (!notification) {
            return
        }

        setNotifications(prev => prev.filter(n => n.id !== id))
        if (!notification.is_read) {
            setUnreadCount(c => Math.max(0, c - 1))
        }

        try {
            await notificationRepository.delete(id)
            toast.success("Notificação removida")
        } catch (error) {
            console.error("Failed to delete notification", error)
            toast.error("Erro ao remover notificação")
            await fetchNotifications()
            await updateUnreadCount()
        }
    }

    useEffect(() => {
        if (user) {
            updateUnreadCount()
        }
    }, [user, updateUnreadCount])

    useEffect(() => {
        if (echo && user?.id) {
            const channelName = `App.Models.User.${user.id}`
            const channel = echo.private(channelName)

            console.log(`[NotificationProvider] Listening on ${channelName}`)

            channel.listen(".new_notification", (e: BroadcastNotificationPayload) => {
                console.log("[NotificationProvider] New notification received:", e)

                const newNotification: Notification = {
                    id: e.id,
                    type: e.type,
                    title: e.title,
                    message: e.message,
                    data: e.data,
                    is_read: false,
                    created_at: e.created_at || new Date().toISOString(),
                }

                setNotifications(prev => [newNotification, ...prev])
                setUnreadCount(prev => prev + 1)

                toast(e.title, {
                    description: e.message,
                    action: {
                        label: "Ver",
                        onClick: () => {
                        },
                    },
                })
            })

            return () => {
                console.log(`[NotificationProvider] Stop listening on ${channelName}`)
                channel.stopListening(".new_notification")
            }
        }
    }, [echo, user?.id])

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                isLoading,
                fetchNotifications,
                markAsRead,
                markAllAsRead,
                deleteNotification,
                hasMore,
            }}
        >
            {children}
        </NotificationContext.Provider>
    )
}

export const useNotifications = () => {
    const context = useContext(NotificationContext)
    if (!context) {
        throw new Error("useNotifications must be used within a NotificationProvider")
    }
    return context
}
