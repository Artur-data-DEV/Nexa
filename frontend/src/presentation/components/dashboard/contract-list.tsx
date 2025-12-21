"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card"
import { Input } from "@/presentation/components/ui/input"
import { Button } from "@/presentation/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/presentation/components/ui/tabs"
import { FileText, Search, RefreshCw } from "lucide-react"
import { Contract } from "@/domain/entities/contract"
import { ApiContractRepository } from "@/infrastructure/repositories/contract-repository"
import { api } from "@/infrastructure/api/axios-adapter"
import { ContractCard } from "./contract-card"
import { Skeleton } from "@/presentation/components/ui/skeleton"
import { toast } from "sonner"

const contractRepository = new ApiContractRepository(api)

export default function ContractList() {
    const [contracts, setContracts] = useState<Contract[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [activeTab, setActiveTab] = useState("all")

    const fetchContracts = async () => {
        setIsLoading(true)
        try {
            const data = await contractRepository.getContracts()
            setContracts(data)
        } catch (error) {
            console.error("Failed to fetch contracts", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchContracts()
    }, [])

    const handlePay = async (id: number) => {
        try {
            // Mock payment processing
            toast.info("Processando pagamento...")
            await new Promise(resolve => setTimeout(resolve, 2000))
            await contractRepository.updateStatus(id, 'active')
            setContracts(prev => prev.map(c => c.id === id ? { ...c, status: 'active' } : c))
            toast.success("Pagamento realizado com sucesso! Contrato ativado.")
        } catch (error) {
            console.error("Payment failed", error)
            toast.error("Falha no pagamento.")
        }
    }

    const filteredContracts = contracts.filter(contract => {
        const matchesSearch = contract.title.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesTab = activeTab === "all" || contract.status === activeTab
        return matchesSearch && matchesTab
    })

    return (
        <Card className="min-h-[500px]">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Meus Contratos
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar contratos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Button variant="outline" onClick={fetchContracts}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Atualizar
                    </Button>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
                        <TabsTrigger value="all">Todos</TabsTrigger>
                        <TabsTrigger value="active">Ativos</TabsTrigger>
                        <TabsTrigger value="completed">Concluídos</TabsTrigger>
                        <TabsTrigger value="pending">Pendentes</TabsTrigger>
                    </TabsList>

                    <TabsContent value={activeTab} className="mt-6">
                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[1, 2, 3].map(i => (
                                    <Skeleton key={i} className="h-[200px] w-full" />
                                ))}
                            </div>
                        ) : filteredContracts.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">
                                    Nenhum contrato encontrado
                                </h3>
                                <p className="text-muted-foreground">
                                    Nenhum contrato corresponde aos filtros atuais.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredContracts.map(contract => (
                                    <ContractCard key={contract.id} contract={contract} onPay={handlePay} />
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}
