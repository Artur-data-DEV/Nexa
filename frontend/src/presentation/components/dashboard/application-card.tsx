import { Application } from "@/domain/entities/application"
import { Campaign } from "@/domain/entities/campaign"

export interface ExtendedApplication extends Application {
    campaign?: Campaign
}

import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card"
import { Badge } from "@/presentation/components/ui/badge"
import { Button } from "@/presentation/components/ui/button"
import { Calendar, DollarSign, Building2 } from "lucide-react"
import Link from "next/link"

interface ApplicationCardProps {
    application: ExtendedApplication
}

export function ApplicationCard({ application }: ApplicationCardProps) {
    const statusColors = {
        pending: "bg-yellow-500",
        approved: "bg-green-500",
        rejected: "bg-red-500"
    }

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium truncate pr-4">
                    {application.campaign?.title || "Campanha #" + application.campaign_id}
                </CardTitle>
                <Badge className={statusColors[application.status] || "bg-gray-500"}>
                    {application.status === 'approved'
                        ? 'Aprovado'
                        : application.status === 'rejected'
                        ? 'Rejeitado'
                        : 'Aplicado'}
                </Badge>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-2 text-sm text-muted-foreground mt-2">
                    <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>{application.campaign?.brand?.name || "Marca"}</span>
                    </div>
                    {application.budget && (
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            <span>Proposta: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(application.budget)}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Aplicado em: {new Date(application.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                </div>
                <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link href={`/dashboard/campaigns/${application.campaign_id}`}>
                            Ver Campanha
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
