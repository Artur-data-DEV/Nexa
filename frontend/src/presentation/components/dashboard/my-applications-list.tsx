"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/presentation/components/ui/tabs"
import { FileText, Send } from "lucide-react"
import { ExtendedApplication, ApplicationCard } from "./application-card"
import { ApiApplicationRepository } from "@/infrastructure/repositories/application-repository"
import { api } from "@/infrastructure/api/axios-adapter"
import { Skeleton } from "@/presentation/components/ui/skeleton"

const applicationRepository = new ApiApplicationRepository(api)

export default function MyApplicationsList() {
    const [applications, setApplications] = useState<ExtendedApplication[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("all")

    const fetchApplications = async () => {
        setIsLoading(true)
        try {
            const data = await applicationRepository.getMyApplications()
            setApplications(data as ExtendedApplication[])
        } catch (error) {
            console.error("Failed to fetch applications", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchApplications()
    }, [])

    const filteredApplications = applications.filter(app => 
        activeTab === "all" || app.status === activeTab
    )

    return (
        <Card className="min-h-[500px]">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Minhas Aplicações
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
                        <TabsTrigger value="all">Todas</TabsTrigger>
                        <TabsTrigger value="pending">Pendentes</TabsTrigger>
                        <TabsTrigger value="approved">Aprovadas</TabsTrigger>
                        <TabsTrigger value="rejected">Recusadas</TabsTrigger>
                    </TabsList>

                    <TabsContent value={activeTab} className="mt-6">
                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[1, 2, 3].map(i => (
                                    <Skeleton key={i} className="h-[180px] w-full" />
                                ))}
                            </div>
                        ) : filteredApplications.length === 0 ? (
                            <div className="text-center py-12">
                                <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">
                                    Nenhuma aplicação encontrada
                                </h3>
                                <p className="text-muted-foreground">
                                    Você ainda não se candidatou a nenhuma campanha com este status.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredApplications.map(app => (
                                    <ApplicationCard key={app.id} application={app} />
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}
