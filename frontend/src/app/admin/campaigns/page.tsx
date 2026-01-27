"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card"
import { Button } from "@/presentation/components/ui/button"
import { Badge } from "@/presentation/components/ui/badge"
import { Text, Construction } from "lucide-react"
import Link from "next/link"

export default function AdminCampaignsPage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <Badge variant="outline" className="mb-2">Campanhas</Badge>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    Todas as Campanhas
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                    Visualize e gerencie todas as campanhas da plataforma.
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
                        A listagem completa de campanhas está sendo migrada para o novo painel administrativo.
                        Por enquanto, você pode:
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <Button asChild>
                            <Link href="/admin/campaigns/pending">
                                <Text className="mr-2 h-4 w-4" />
                                Ver Campanhas Pendentes
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
