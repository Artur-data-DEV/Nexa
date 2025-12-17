"use client";

import React, { useState } from 'react';
import { useNotifications } from '@/presentation/contexts/notification-provider';
import { Button } from '@/presentation/components/ui/button';
import { Card, CardContent } from '@/presentation/components/ui/card';
import { Badge } from '@/presentation/components/ui/badge';
import { Check, Trash2, Bell, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
    const router = useRouter();
    const { 
        notifications, 
        unreadCount, 
        markAsRead, 
        markAllAsRead, 
        deleteNotification 
    } = useNotifications();
    
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const filteredNotifications = filter === 'unread' 
        ? notifications.filter(n => !n.is_read)
        : notifications;

    const handleMarkAsRead = async (notificationId: number) => {
        await markAsRead(notificationId);
    };

    const handleDeleteNotification = async (notificationId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        await deleteNotification(notificationId);
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
    };

    const handleDeleteAllNotifications = async () => {
        // Since context doesn't support bulk delete yet, we'll delete one by one or implement bulk later
        // For now, let's just delete the visible ones to avoid too many requests if list is huge
        // Or better, just disable this button if not supported efficiently
        // But the user asked for porting, so I'll try to iterate
        const ids = notifications.map(n => n.id);
        for (const id of ids) {
            await deleteNotification(id);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'login_detected':
            case 'new_project':
            case 'project_approved':
            case 'proposal_approved':
                return '✅';
            case 'project_rejected':
            case 'proposal_rejected':
                return '❌';
            case 'new_message':
                return '💬';
            default:
                return '🔔';
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Agora';
        if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
        return `${Math.floor(diffInMinutes / 1440)}d atrás`;
    };

    const getNotificationTypeLabel = (type: string) => {
        switch (type) {
            case 'login_detected':
                return 'Login Detectado';
            case 'new_project':
                return 'Novo Projeto';
            case 'project_approved':
                return 'Projeto Aprovado';
            case 'project_rejected':
                return 'Projeto Rejeitado';
            case 'proposal_approved':
                return 'Proposta Aprovada';
            case 'proposal_rejected':
                return 'Proposta Rejeitada';
            case 'new_message':
                return 'Nova Mensagem';
            default:
                return 'Notificação';
        }
    };

    const handleNotificationClick = async (notification: any) => {
        const isChatNotification =
            notification.type === 'new_message' &&
            notification.data &&
            (notification.data.chat_type === 'campaign' || notification.data.chat_type === 'direct') &&
            notification.data.chat_room_id;

        if (isChatNotification) {
            const roomId = notification.data.chat_room_id;
            // Assuming dashboard/messages is the route
            router.push(`/dashboard/messages?roomId=${roomId}`);
        }

        if (!notification.is_read) {
            await markAsRead(notification.id);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.back()}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Voltar
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold">Notificações</h1>
                            <p className="text-muted-foreground">
                                {unreadCount > 0 ? `${unreadCount} não lida${unreadCount !== 1 ? 's' : ''}` : 'Todas as notificações foram lidas'}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <Button
                                variant="outline"
                                onClick={handleMarkAllAsRead}
                                className="flex items-center gap-2"
                            >
                                <Check className="w-4 h-4" />
                                Marcar todas como lidas
                            </Button>
                        )}
                        {notifications.length > 0 && (
                            <Button
                                variant="outline"
                                onClick={handleDeleteAllNotifications}
                                className="flex items-center gap-2 text-red-600 border-red-600 hover:bg-red-50"
                            >
                                <Trash2 className="w-4 h-4" />
                                Excluir todas
                            </Button>
                        )}
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6">
                    <Button
                        variant={filter === 'all' ? 'default' : 'outline'}
                        onClick={() => setFilter('all')}
                    >
                        Todas ({notifications.length})
                    </Button>
                    <Button
                        variant={filter === 'unread' ? 'default' : 'outline'}
                        onClick={() => setFilter('unread')}
                    >
                        Não lidas ({unreadCount})
                    </Button>
                </div>

                {/* Notifications List */}
                <div className="space-y-4">
                    {filteredNotifications.length === 0 ? (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                                <h3 className="text-lg font-semibold mb-2">
                                    {filter === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
                                </h3>
                                <p className="text-muted-foreground">
                                    {filter === 'unread' 
                                        ? 'Todas as suas notificações foram lidas.' 
                                        : 'Você ainda não recebeu nenhuma notificação.'
                                    }
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredNotifications.map((notification) => (
                            <Card
                                key={notification.id}
                                className={`transition-all ${!notification.is_read ? 'border-primary/50 bg-primary/5' : ''} cursor-pointer`}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 mt-1 text-2xl">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4 mb-2">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-semibold text-lg">
                                                            {notification.title}
                                                        </h3>
                                                        {!notification.is_read && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                Não lida
                                                            </Badge>
                                                        )}
                                                        <Badge variant="outline" className="text-xs">
                                                            {getNotificationTypeLabel(notification.type)}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-muted-foreground mb-2">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {formatTime(notification.created_at)}
                                                    </p>
                                                </div>
                                                
                                                <div className="flex items-center gap-2">
                                                    {!notification.is_read && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleMarkAsRead(notification.id);
                                                            }}
                                                            className="h-8 w-8 p-0 hover:bg-accent"
                                                            title="Marcar como lida"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => handleDeleteNotification(notification.id, e)}
                                                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-accent"
                                                        title="Excluir notificação"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
