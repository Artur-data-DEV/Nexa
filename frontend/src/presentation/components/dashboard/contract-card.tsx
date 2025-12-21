import { Contract } from "@/domain/entities/contract"
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card"
import { Badge } from "@/presentation/components/ui/badge"
import { Button } from "@/presentation/components/ui/button"
import { Calendar, DollarSign, User, CreditCard } from "lucide-react"
import { useAuth } from "@/presentation/contexts/auth-provider"

interface ContractCardProps {
    contract: Contract
    onPay?: (id: number) => void
}

export function ContractCard({ contract, onPay }: ContractCardProps) {
    const { user } = useAuth()
    
    const statusColors = {
        pending: "bg-yellow-500",
        active: "bg-blue-500",
        completed: "bg-green-500",
        cancelled: "bg-red-500",
        disputed: "bg-orange-500"
    }

    const isBrand = user?.role === 'brand'
    const showPayButton = isBrand && contract.status === 'pending'

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {contract.title}
                </CardTitle>
                <Badge className={statusColors[contract.status] || "bg-gray-500"}>
                    {contract.status === 'active' ? 'Ativo' : 
                     contract.status === 'completed' ? 'Concluído' : 
                     contract.status === 'pending' ? 'Pendente' : 
                     contract.status}
                </Badge>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-2 text-sm text-muted-foreground mt-2">
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{contract.other_user?.name || "Usuário"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contract.amount)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(contract.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                </div>
                <div className="mt-4 flex flex-col gap-2">
                    <Button variant="outline" size="sm" className="w-full">
                        Ver Detalhes
                    </Button>
                    {showPayButton && onPay && (
                        <Button 
                            variant="default" 
                            size="sm" 
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => onPay(contract.id)}
                        >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Realizar Pagamento
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
