"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card"
import { Badge } from "@/presentation/components/ui/badge"
import { Construction, Bell } from "lucide-react"

export default function AdminNotificationsPage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <Badge variant="outline" className="mb-2">Notificações</Badge>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    Notificações do Sistema
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                    Envie notificações para usuários e acompanhe alertas do sistema.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Construction className="h-5 w-5 text-yellow-500" />
                        Em Desenvolvimento
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                        O sistema de notificações administrativas está sendo migrado para o novo painel.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Bell className="h-4 w-4" />
                        Funcionalidades em breve: envio em massa, templates, histórico de notificações
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
