"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card"
import { Button } from "@/presentation/components/ui/button"
import { Badge } from "@/presentation/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/presentation/components/ui/tabs"
import { Skeleton } from "@/presentation/components/ui/skeleton"
import { DollarSign, TrendingUp, Clock, AlertCircle, Download, Wallet } from "lucide-react"
import { toast } from "sonner"
import { ApiFinancialRepository } from "@/infrastructure/repositories/financial-repository"
import { GetCreatorBalanceUseCase } from "@/application/use-cases/get-creator-balance.use-case"
import { GetWithdrawalsUseCase } from "@/application/use-cases/get-withdrawals.use-case"
import { api } from "@/infrastructure/api/axios-adapter"
import { CreatorBalance, Withdrawal } from "@/domain/entities/financial"
import { WithdrawalModal } from "./withdrawal-modal"
import { BankRegistration } from "./bank-registration"

const financialRepository = new ApiFinancialRepository(api)
const getCreatorBalanceUseCase = new GetCreatorBalanceUseCase(financialRepository)
const getWithdrawalsUseCase = new GetWithdrawalsUseCase(financialRepository)

export default function FinancialView() {
    const [balance, setBalance] = useState<CreatorBalance | null>(null)
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
    const [loading, setLoading] = useState(true)
    const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const [balanceData, withdrawalsData] = await Promise.all([
                getCreatorBalanceUseCase.execute(),
                getWithdrawalsUseCase.execute()
            ])
            setBalance(balanceData)
            setWithdrawals(withdrawalsData)
        } catch (error) {
            console.error("Failed to load financial data", error)
            // toast.error("Erro ao carregar dados financeiros")
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const translateStatus = (status: string) => {
        const map: Record<string, string> = {
            'pending': 'Pendente',
            'processing': 'Processando',
            'completed': 'Concluído',
            'failed': 'Falhou',
            'cancelled': 'Cancelado'
        }
        return map[status] || status
    }

    if (loading) {
        return (
            <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
                </div>
                <Skeleton className="h-64 w-full" />
            </div>
        )
    }

    if (!balance) {
        return (
            <div className="p-6 text-center">
                <p className="text-muted-foreground">Não foi possível carregar os dados financeiros.</p>
                <Button onClick={loadData} variant="outline" className="mt-4">Tentar Novamente</Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
                    <p className="text-muted-foreground">Gerencie seus ganhos e saques.</p>
                </div>
                <Button 
                    onClick={() => setIsWithdrawalModalOpen(true)}
                    disabled={balance.balance.available_balance <= 0}
                    className="gap-2 bg-pink-600 hover:bg-pink-700 text-white"
                >
                    <Wallet className="h-4 w-4" />
                    Solicitar Saque
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Saldo Disponível</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {balance.balance.formatted_available_balance}
                        </div>
                        <p className="text-xs text-muted-foreground">Disponível para saque</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Saldo Pendente</CardTitle>
                        <Clock className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">
                            {balance.balance.formatted_pending_balance}
                        </div>
                        <p className="text-xs text-muted-foreground">Aguardando liberação</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Ganho</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {balance.balance.formatted_total_earned}
                        </div>
                        <p className="text-xs text-muted-foreground">Desde o início</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Sacado</CardTitle>
                        <Download className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">
                            {balance.balance.formatted_total_withdrawn}
                        </div>
                        <p className="text-xs text-muted-foreground">Saques realizados</p>
                    </CardContent>
                </Card>
            </div>

            {balance.withdrawals.pending_count > 0 && (
                <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
                    <CardContent className="p-4 flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                        <div>
                            <p className="font-medium text-yellow-800 dark:text-yellow-200">
                                {balance.withdrawals.pending_count} saque(s) pendente(s)
                            </p>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                Total: {balance.withdrawals.formatted_pending_amount}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Tabs defaultValue="transactions" className="w-full">
                <TabsList>
                    <TabsTrigger value="transactions">Transações Recentes</TabsTrigger>
                    <TabsTrigger value="withdrawals">Histórico de Saques</TabsTrigger>
                </TabsList>

                <TabsContent value="transactions" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Transações Recentes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {balance.recent_transactions.length > 0 ? (
                                <div className="space-y-4">
                                    {balance.recent_transactions.map((transaction) => (
                                        <div key={transaction.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                            <div>
                                                <p className="font-medium">{transaction.contract_title}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {transaction.processed_at ? formatDate(transaction.processed_at) : 'Data indisponível'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-green-600">{transaction.amount}</p>
                                                <Badge variant="outline">{translateStatus(transaction.status)}</Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">Nenhuma transação recente.</div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="withdrawals" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Histórico de Saques</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {withdrawals.length > 0 ? (
                                <div className="space-y-4">
                                    {withdrawals.map((withdrawal) => (
                                        <div key={withdrawal.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                            <div>
                                                <p className="font-medium">{withdrawal.amount}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {withdrawal.method} • {formatDate(withdrawal.created_at)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <Badge className={
                                                    withdrawal.status === 'completed' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                                                    withdrawal.status === 'pending' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' :
                                                    'bg-gray-100 text-gray-800 hover:bg-gray-100'
                                                }>
                                                    {translateStatus(withdrawal.status)}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">Nenhum saque realizado.</div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="bank-info" className="mt-4">
                    <BankRegistration />
                </TabsContent>
            </Tabs>

            <WithdrawalModal 
                open={isWithdrawalModalOpen} 
                onOpenChange={setIsWithdrawalModalOpen}
                availableBalance={balance.balance.available_balance}
                onSuccess={loadData}
            />
        </div>
    )
}
