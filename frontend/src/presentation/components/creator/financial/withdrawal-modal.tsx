"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/presentation/components/ui/dialog"
import { Button } from "@/presentation/components/ui/button"
import { Input } from "@/presentation/components/ui/input"
import { Label } from "@/presentation/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/presentation/components/ui/select"
import { toast } from "sonner"
import { ApiFinancialRepository } from "@/infrastructure/repositories/financial-repository"
import { GetWithdrawalMethodsUseCase } from "@/application/use-cases/get-withdrawal-methods.use-case"
import { RequestWithdrawalUseCase } from "@/application/use-cases/request-withdrawal.use-case"
import { api } from "@/infrastructure/api/axios-adapter"
import { WithdrawalMethod } from "@/domain/entities/financial"
import type { AxiosError } from "axios"

const financialRepository = new ApiFinancialRepository(api)
const getWithdrawalMethodsUseCase = new GetWithdrawalMethodsUseCase(financialRepository)
const requestWithdrawalUseCase = new RequestWithdrawalUseCase(financialRepository)
const ALLOWED_WITHDRAWAL_METHOD_CODES = new Set(["pix", "pagarme_bank_transfer", "bank_transfer"])

interface WithdrawalModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    availableBalance: number
    onSuccess: () => void
}

export function WithdrawalModal({ open, onOpenChange, availableBalance, onSuccess }: WithdrawalModalProps) {
    const [methods, setMethods] = useState<WithdrawalMethod[]>([])
    const [selectedMethod, setSelectedMethod] = useState<string>("")
    const [amount, setAmount] = useState<string>("")
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const loadMethods = useCallback(async () => {
        setLoading(true)
        try {
            const data = await getWithdrawalMethodsUseCase.execute()
            const filteredMethods = data
                .filter((method) => ALLOWED_WITHDRAWAL_METHOD_CODES.has(method.id))
                .map((method) => {
                    if (method.id === "pix") {
                        return {
                            ...method,
                            name: "PIX",
                        }
                    }

                    if (method.id === "pagarme_bank_transfer" || method.id === "bank_transfer") {
                        return {
                            ...method,
                            name: "Dados Bancarios",
                        }
                    }

                    return method
                })

            setMethods(filteredMethods)
            if (selectedMethod && !filteredMethods.some((method) => method.id === selectedMethod)) {
                setSelectedMethod("")
            }
        } catch (error: unknown) {
            console.error("Failed to load withdrawal methods", error)
            const axiosError = error as AxiosError<{ message?: string }>
            toast.error(axiosError.response?.data?.message || "Erro ao carregar métodos de saque")
        } finally {
            setLoading(false)
        }
    }, [selectedMethod])

    useEffect(() => {
        if (open) {
            loadMethods()
        }
    }, [open, loadMethods])

    const handleSubmit = async () => {
        if (!selectedMethod || !amount) {
            toast.error("Preencha todos os campos")
            return
        }

        const numericAmount = parseFloat(amount)
        if (isNaN(numericAmount) || numericAmount <= 0) {
            toast.error("Valor inválido")
            return
        }

        if (numericAmount > availableBalance) {
            toast.error("Saldo insuficiente")
            return
        }

        const method = methods.find(m => m.id === selectedMethod)
        if (method) {
            if (numericAmount < method.min_amount) {
                toast.error(`Valor mínimo para este método é ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(method.min_amount)}`)
                return
            }
            if (numericAmount > method.max_amount) {
                toast.error(`Valor máximo para este método é ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(method.max_amount)}`)
                return
            }
        }

        setSubmitting(true)
        try {
            await requestWithdrawalUseCase.execute({
                amount: numericAmount,
                withdrawal_method: selectedMethod,
            })
            toast.success("Solicitação de saque enviada com sucesso!")
            onSuccess()
            onOpenChange(false)
            setAmount("")
            setSelectedMethod("")
        } catch (error: unknown) {
            console.error("Failed to request withdrawal", error)
            const axiosError = error as AxiosError<{ message?: string }>
            toast.error(axiosError.response?.data?.message || "Erro ao solicitar saque")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-106.25">
                <DialogHeader>
                    <DialogTitle>Solicitar Saque</DialogTitle>
                    <DialogDescription>
                        Escolha o método e o valor que deseja sacar.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Saldo Disponível</Label>
                        <div className="font-bold text-xl text-green-600">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(availableBalance)}
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Método de Saque</Label>
                        <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um método" />
                            </SelectTrigger>
                            <SelectContent>
                                {methods.map(method => (
                                    <SelectItem key={method.id} value={method.id}>
                                        {method.name} (Taxa: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(method.fee)})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Valor</Label>
                        <Input 
                            type="number" 
                            step="0.01"
                            placeholder="0,00" 
                            value={amount}
                            onChange={(e) => setAmount(e.target.value.replace(',', '.'))}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={submitting || loading}>
                        {submitting ? "Enviando..." : "Confirmar Saque"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
