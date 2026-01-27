"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card"
import { Badge } from "@/presentation/components/ui/badge"
import { Construction, BookOpen } from "lucide-react"

export default function AdminStudentVerificationPage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <Badge variant="outline" className="mb-2">Verificação</Badge>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    Verificação de Alunos
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                    Aprove ou rejeite solicitações de verificação estudantil.
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
                        A verificação de alunos está sendo migrada para o novo painel administrativo.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <BookOpen className="h-4 w-4" />
                        Funcionalidades em breve: visualização de documentos, aprovação/rejeição, histórico
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
