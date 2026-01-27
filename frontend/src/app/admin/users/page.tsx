"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card"
import { Badge } from "@/presentation/components/ui/badge"
import { Construction, Users } from "lucide-react"

export default function AdminUsersPage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <Badge variant="outline" className="mb-2">Usuários</Badge>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    Gerenciamento de Usuários
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                    Visualize e gerencie todos os usuários da plataforma (criadores, marcas e administradores).
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
                        O gerenciamento completo de usuários está sendo migrado para o novo painel administrativo.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        Funcionalidades em breve: pesquisa, filtros, edição de perfil, bloqueio/desbloqueio de contas
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
