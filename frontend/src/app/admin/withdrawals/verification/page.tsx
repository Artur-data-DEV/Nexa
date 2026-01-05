"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Calendar as CalendarIcon,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Calendar,
  X,
  ShieldAlert,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/presentation/components/ui/card"
import { Button } from "@/presentation/components/ui/button"
import { Badge } from "@/presentation/components/ui/badge"
import { Label } from "@/presentation/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/presentation/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/presentation/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/presentation/components/ui/alert"
import { Separator } from "@/presentation/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/presentation/components/ui/popover"
import { Calendar as CalendarComponent } from "@/presentation/components/ui/calendar"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { api } from "@/infrastructure/api/axios-adapter"
import { AuthGuard } from "@/presentation/components/auth/auth-guard"
import { useAuth } from "@/presentation/contexts/auth-provider"
import { BankInfo } from "@/domain/entities/financial"

interface WithdrawalVerificationItem {
  id: number
  amount: string
  withdrawal_method: string
  status: string
  transaction_id: string | null
  processed_at: string | null
  creator: {
    id: number
    name: string
    email: string
  }
  verification_status: "passed" | "failed" | "pending"
  bank_details_match: boolean
  amount_verification: boolean
}

interface VerificationReport {
  summary: {
    total_withdrawals: number
    total_amount: number
    verification_passed: number
    verification_failed: number
    pending_verification: number
  }
  withdrawals: WithdrawalVerificationItem[]
  pagination: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

interface DetailedVerification {
  withdrawal: {
    id: number
    amount: string
    withdrawal_method: string
    status: string
    transaction_id: string | null
    processed_at: string | null
    created_at: string
    withdrawal_details: Record<string, unknown>
  }
  creator: {
    id: number
    name: string
    email: string
  }
  bank_account_verification: {
    withdrawal_bank_details: BankInfo | null
    current_bank_account: BankInfo | null
    details_match: boolean
  }
  verification_summary: {
    withdrawal_amount_correct: boolean
    bank_details_consistent: boolean
    transaction_id_valid: boolean
    processing_time_reasonable: boolean
    overall_verification_status: string
  }
}

function translateWithdrawalStatus(status: string) {
  const map: Record<string, string> = {
    pending: "Pendente",
    processing: "Processando",
    completed: "Concluído",
    failed: "Falhou",
    cancelled: "Cancelado",
  }
  const key = status.toLowerCase()
  return map[key] ?? status
}

function AdminOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return null
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-6">
          <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <ShieldAlert className="h-5 w-5 text-red-500" />
            <AlertTitle className="text-red-800 dark:text-red-200">
              Acesso negado
            </AlertTitle>
            <AlertDescription className="text-red-700 dark:text-red-300">
              Você não tem permissão para acessar a verificação de saques. Esta seção é
              exclusiva para administradores.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

function WithdrawalVerificationContent() {
  const [report, setReport] = useState<VerificationReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({
    start_date: "",
    end_date: "",
    status: "all",
    withdrawal_method: "all",
  })

  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<DetailedVerification | null>(null)
  const [detailedLoading, setDetailedLoading] = useState(false)
  const [processingWithdrawalId, setProcessingWithdrawalId] = useState<number | null>(null)

  const fetchVerificationReport = async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.start_date) params.append("start_date", filters.start_date)
      if (filters.end_date) params.append("end_date", filters.end_date)
      if (filters.status && filters.status !== "all") params.append("status", filters.status)
      if (filters.withdrawal_method && filters.withdrawal_method !== "all") {
        params.append("withdrawal_method", filters.withdrawal_method)
      }
      if (page > 1) {
        params.append("page", String(page))
      }

      const response = await api.get<{
        success: boolean
        data: VerificationReport
      }>("/admin/payouts/verification-report?" + params.toString())

      if (!response.success) {
        toast.error("Falha ao carregar relatório de verificação")
        setReport(null)
        return
      }

      setReport(response.data)
    } catch {
      toast.error("Falha ao carregar relatório de verificação")
      setReport(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchDetailedVerification = async (withdrawalId: number) => {
    setDetailedLoading(true)
    try {
      const response = await api.get<{
        success: boolean
        data: DetailedVerification
      }>(`/admin/payouts/${withdrawalId}/verify`)

      if (!response.success) {
        toast.error("Falha ao carregar detalhes da verificação")
        return
      }

      setSelectedWithdrawal(response.data)
    } catch {
      toast.error("Falha ao carregar detalhes da verificação")
    } finally {
      setDetailedLoading(false)
    }
  }

  useEffect(() => {
    fetchVerificationReport(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePageChange = (page: number) => {
    if (!report) return
    if (page < 1 || page > report.pagination.last_page) return
    setCurrentPage(page)
    fetchVerificationReport(page)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "passed":
        return <Badge className="bg-green-100 text-green-800">Verificado</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Falha</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Desconhecido</Badge>
    }
  }

  const formatCurrency = (amount: string) => {
    const numeric = parseFloat(
      amount
        .replace("R$ ", "")
        .replace(/\./g, "")
        .replace(",", ".")
    )

    if (Number.isNaN(numeric)) {
      return amount
    }

    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numeric)
  }

  const handleProcessWithdrawal = async (
    withdrawalId: number,
    action: "approve" | "reject"
  ) => {
    let reason = ""
    if (action === "reject") {
      const input = window.prompt("Informe o motivo da recusa (opcional):") ?? ""
      reason = input
    }

    setProcessingWithdrawalId(withdrawalId)
    try {
      const response = await api.post<{
        success: boolean
        message?: string
      }>(`/admin/payouts/${withdrawalId}/process`, {
        action,
        reason: reason || undefined,
      })

      if (!response.success) {
        toast.error(response.message || "Falha ao processar saque")
        return
      }

      toast.success(
        response.message ||
          (action === "approve"
            ? "Saque aprovado com sucesso"
            : "Saque rejeitado com sucesso")
      )
      fetchVerificationReport(currentPage)
    } catch {
      toast.error("Falha ao processar saque")
    } finally {
      setProcessingWithdrawalId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Verificação de Saques
            </h1>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              Verifique se os fundos foram retirados corretamente para as contas bancárias
              registradas.
            </p>
          </div>
        </div>

        <Card className="border">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              Filtros de Verificação
            </CardTitle>
            <CardDescription>
              Configure os filtros para verificar saques específicos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="start_date" className="text-sm font-medium">
                  Data Inicial
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP", { locale: ptBR }) : "Selecione uma data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        setStartDate(date ?? undefined)
                        setFilters({
                          ...filters,
                          start_date: date ? format(date, "yyyy-MM-dd") : "",
                        })
                      }}
                      initialFocus
                      locale={ptBR}
                      className="rounded-md border"
                    />
                  </PopoverContent>
                </Popover>
                {startDate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStartDate(undefined)
                      setFilters({ ...filters, start_date: "" })
                    }}
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <X className="mr-1 h-3 w-3" />
                    Limpar
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date" className="text-sm font-medium">
                  Data Final
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP", { locale: ptBR }) : "Selecione uma data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => {
                        setEndDate(date ?? undefined)
                        setFilters({
                          ...filters,
                          end_date: date ? format(date, "yyyy-MM-dd") : "",
                        })
                      }}
                      initialFocus
                      locale={ptBR}
                      className="rounded-md border"
                      disabled={(date) => (startDate ? date < startDate : false)}
                    />
                  </PopoverContent>
                </Popover>
                {endDate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEndDate(undefined)
                      setFilters({ ...filters, end_date: "" })
                    }}
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <X className="mr-1 h-3 w-3" />
                    Limpar
                  </Button>
                )}
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters({ ...filters, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="processing">Processando</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="failed">Falhou</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="method">Método</Label>
                <Select
                  value={filters.withdrawal_method}
                  onValueChange={(value) =>
                    setFilters({ ...filters, withdrawal_method: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os métodos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="bank_transfer">Transferência Bancária</SelectItem>
                    <SelectItem value="pagarme_bank_transfer">Pagar.me</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date()
                  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
                  setStartDate(sevenDaysAgo)
                  setEndDate(today)
                  setFilters({
                    ...filters,
                    start_date: format(sevenDaysAgo, "yyyy-MM-dd"),
                    end_date: format(today, "yyyy-MM-dd"),
                  })
                  setCurrentPage(1)
                }}
                className="text-xs"
              >
                Últimos 7 dias
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date()
                  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
                  setStartDate(thirtyDaysAgo)
                  setEndDate(today)
                  setFilters({
                    ...filters,
                    start_date: format(thirtyDaysAgo, "yyyy-MM-dd"),
                    end_date: format(today, "yyyy-MM-dd"),
                  })
                  setCurrentPage(1)
                }}
                className="text-xs"
              >
                Últimos 30 dias
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date()
                  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
                  setStartDate(firstDayOfMonth)
                  setEndDate(today)
                  setFilters({
                    ...filters,
                    start_date: format(firstDayOfMonth, "yyyy-MM-dd"),
                    end_date: format(today, "yyyy-MM-dd"),
                  })
                  setCurrentPage(1)
                }}
                className="text-xs"
              >
                Este mês
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStartDate(undefined)
                  setEndDate(undefined)
                  setFilters({
                    ...filters,
                    start_date: "",
                    end_date: "",
                  })
                  setCurrentPage(1)
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Limpar datas
              </Button>
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div className="text-sm text-muted-foreground">
                {startDate && endDate && (
                  <span>
                    Período:{" "}
                    {format(startDate, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                    {format(endDate, "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                )}
              </div>
              <Button
                onClick={() => {
                  setCurrentPage(1)
                  fetchVerificationReport(1)
                }}
                disabled={loading}
                className="bg-[#E91E63] px-6 py-2 text-white shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                    Carregando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Aplicar filtros
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {report && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Saques</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {report.summary.total_withdrawals}
                </div>
                <p className="text-xs text-muted-foreground">
                  Valor total: {formatCurrency(report.summary.total_amount.toString())}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Verificados</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {report.summary.verification_passed}
                </div>
                <p className="text-xs text-muted-foreground">
                  {report.summary.total_withdrawals > 0
                    ? (
                        (report.summary.verification_passed /
                          report.summary.total_withdrawals) *
                        100
                      ).toFixed(1)
                    : "0.0"}
                  % do total
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Falhas</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {report.summary.verification_failed}
                </div>
                <p className="text-xs text-muted-foreground">
                  {report.summary.total_withdrawals > 0
                    ? (
                        (report.summary.verification_failed /
                          report.summary.total_withdrawals) *
                        100
                      ).toFixed(1)
                    : "0.0"}
                  % do total
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {report.summary.pending_verification}
                </div>
                <p className="text-xs text-muted-foreground">
                  {report.summary.total_withdrawals > 0
                    ? (
                        (report.summary.pending_verification /
                          report.summary.total_withdrawals) *
                        100
                      ).toFixed(1)
                    : "0.0"}
                  % do total
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {report && (
          <Card>
            <CardHeader>
              <CardTitle>Saques</CardTitle>
              <CardDescription>
                Lista de saques com status de verificação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="w-16 px-3 py-2 text-left">ID</th>
                      <th className="min-w-37.5 px-3 py-2 text-left">Criador</th>
                      <th className="w-24 px-3 py-2 text-left">Valor</th>
                      <th className="min-w-30 px-3 py-2 text-left">Método</th>
                      <th className="w-20 px-3 py-2 text-left">Status</th>
                      <th className="w-24 px-3 py-2 text-left">Verificação</th>
                      <th className="min-w-25 px-3 py-2 text-left">Data</th>
                      <th className="w-16 px-3 py-2 text-left">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.withdrawals.map((withdrawal) => (
                      <tr key={withdrawal.id} className="border-b last:border-0">
                        <td className="px-3 py-3 align-top">#{withdrawal.id}</td>
                        <td className="px-3 py-3 align-top">
                          <div className="min-w-0">
                            <div className="truncate font-medium">
                              {withdrawal.creator.name}
                            </div>
                            <div
                              className="truncate text-xs text-muted-foreground"
                              title={withdrawal.creator.email}
                            >
                              {withdrawal.creator.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 align-top font-medium">
                          {withdrawal.amount}
                        </td>
                        <td className="max-w-40 px-3 py-3 align-top">
                          <div className="truncate" title={withdrawal.withdrawal_method}>
                            {withdrawal.withdrawal_method}
                          </div>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <Badge
                            variant={
                              withdrawal.status === "completed" ? "default" : "secondary"
                            }
                          >
                            {translateWithdrawalStatus(withdrawal.status)}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(withdrawal.verification_status)}
                            {getStatusBadge(withdrawal.verification_status)}
                          </div>
                        </td>
                        <td className="px-3 py-3 align-top">
                          {withdrawal.processed_at ? (
                            format(new Date(withdrawal.processed_at), "dd/MM/yyyy HH:mm", {
                              locale: ptBR,
                            })
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-3 py-3 align-top">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchDetailedVerification(withdrawal.id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="space-y-4 max-h-[80vh] max-w-4xl overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>
                                  Detalhes da Verificação - Saque #{withdrawal.id}
                                </DialogTitle>
                                <DialogDescription>
                                  Verificação detalhada do saque e conta bancária
                                </DialogDescription>
                              </DialogHeader>
                              {detailedLoading ? (
                                <div className="flex items-center justify-center py-8">
                                  <div className="text-center">
                                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
                                    <p className="mt-2 text-sm text-muted-foreground">
                                      Carregando detalhes...
                                    </p>
                                  </div>
                                </div>
                              ) : selectedWithdrawal ? (
                                <div className="space-y-6">
                                  <Card>
                                    <CardHeader>
                                      <CardTitle>Detalhes do Saque</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        <div className="space-y-1">
                                          <Label className="text-sm font-medium">
                                            Valor
                                          </Label>
                                          <p className="wrap-break-word text-lg font-bold">
                                            {selectedWithdrawal.withdrawal.amount}
                                          </p>
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-sm font-medium">
                                            Método
                                          </Label>
                                          <p className="wrap-break-word">
                                            {selectedWithdrawal.withdrawal.withdrawal_method}
                                          </p>
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-sm font-medium">
                                            Status
                                          </Label>
                                          <div>
                                            <Badge>
                                              {translateWithdrawalStatus(
                                                selectedWithdrawal.withdrawal.status
                                              )}
                                            </Badge>
                                          </div>
                                        </div>
                                        <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                                          <Label className="text-sm font-medium">
                                            ID da Transação
                                          </Label>
                                          <p className="break-all rounded border bg-muted/50 p-2 font-mono text-sm">
                                            {selectedWithdrawal.withdrawal.transaction_id ||
                                              "N/A"}
                                          </p>
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-sm font-medium">
                                            Criado em
                                          </Label>
                                          <p className="wrap-break-word">
                                            {format(
                                              new Date(
                                                selectedWithdrawal.withdrawal.created_at
                                              ),
                                              "dd/MM/yyyy HH:mm",
                                              { locale: ptBR }
                                            )}
                                          </p>
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-sm font-medium">
                                            Processado em
                                          </Label>
                                          <p className="wrap-break-word">
                                            {selectedWithdrawal.withdrawal.processed_at
                                              ? format(
                                                  new Date(
                                                    selectedWithdrawal.withdrawal
                                                      .processed_at
                                                  ),
                                                  "dd/MM/yyyy HH:mm",
                                                  { locale: ptBR }
                                                )
                                              : "N/A"}
                                          </p>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  <Card>
                                    <CardHeader>
                                      <CardTitle>Informações do Criador</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div className="space-y-1">
                                          <Label className="text-sm font-medium">
                                            Nome
                                          </Label>
                                          <p className="wrap-break-word">
                                            {selectedWithdrawal.creator.name}
                                          </p>
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-sm font-medium">
                                            Email
                                          </Label>
                                          <p className="break-all rounded border bg-muted/50 p-2 font-mono text-sm">
                                            {selectedWithdrawal.creator.email}
                                          </p>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  <Card>
                                    <CardHeader>
                                      <CardTitle>Verificação da Conta Bancária</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                          {selectedWithdrawal.bank_account_verification
                                            .details_match ? (
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                          ) : (
                                            <XCircle className="h-5 w-5 text-red-600" />
                                          )}
                                          <span className="font-medium">
                                            Detalhes bancários{" "}
                                            {selectedWithdrawal.bank_account_verification
                                              .details_match
                                              ? "coincidem"
                                              : "não coincidem"}
                                          </span>
                                        </div>

                                        <Separator />

                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                          <div>
                                            <h4 className="mb-3 font-medium">
                                              Detalhes do Saque
                                            </h4>
                                            {selectedWithdrawal.bank_account_verification
                                              .withdrawal_bank_details ? (
                                              <div className="space-y-2 text-sm">
                                                <div>
                                                  <strong>Banco:</strong>{" "}
                                                  {
                                                    selectedWithdrawal
                                                      .bank_account_verification
                                                      .withdrawal_bank_details.bank_code
                                                  }
                                                </div>
                                                <div>
                                                  <strong>Agência:</strong>{" "}
                                                  {
                                                    selectedWithdrawal
                                                      .bank_account_verification
                                                      .withdrawal_bank_details.agencia
                                                  }
                                                  -
                                                  {
                                                    selectedWithdrawal
                                                      .bank_account_verification
                                                      .withdrawal_bank_details.agencia_dv
                                                  }
                                                </div>
                                                <div>
                                                  <strong>Conta:</strong>{" "}
                                                  {
                                                    selectedWithdrawal
                                                      .bank_account_verification
                                                      .withdrawal_bank_details.conta
                                                  }
                                                  -
                                                  {
                                                    selectedWithdrawal
                                                      .bank_account_verification
                                                      .withdrawal_bank_details.conta_dv
                                                  }
                                                </div>
                                                <div>
                                                  <strong>CPF:</strong>{" "}
                                                  {
                                                    selectedWithdrawal
                                                      .bank_account_verification
                                                      .withdrawal_bank_details.cpf
                                                  }
                                                </div>
                                                <div>
                                                  <strong>Nome:</strong>{" "}
                                                  {
                                                    selectedWithdrawal
                                                      .bank_account_verification
                                                      .withdrawal_bank_details.name
                                                  }
                                                </div>
                                              </div>
                                            ) : (
                                              <p className="text-muted-foreground">
                                                Nenhum detalhe bancário encontrado
                                              </p>
                                            )}
                                          </div>

                                          <div>
                                            <h4 className="mb-3 font-medium">
                                              Conta Atual
                                            </h4>
                                            {selectedWithdrawal.bank_account_verification
                                              .current_bank_account ? (
                                              <div className="space-y-2 text-sm">
                                                <div>
                                                  <strong>Banco:</strong>{" "}
                                                  {
                                                    selectedWithdrawal
                                                      .bank_account_verification
                                                      .current_bank_account.bank_code
                                                  }
                                                </div>
                                                <div>
                                                  <strong>Agência:</strong>{" "}
                                                  {
                                                    selectedWithdrawal
                                                      .bank_account_verification
                                                      .current_bank_account.agencia
                                                  }
                                                  -
                                                  {
                                                    selectedWithdrawal
                                                      .bank_account_verification
                                                      .current_bank_account.agencia_dv
                                                  }
                                                </div>
                                                <div>
                                                  <strong>Conta:</strong>{" "}
                                                  {
                                                    selectedWithdrawal
                                                      .bank_account_verification
                                                      .current_bank_account.conta
                                                  }
                                                  -
                                                  {
                                                    selectedWithdrawal
                                                      .bank_account_verification
                                                      .current_bank_account.conta_dv
                                                  }
                                                </div>
                                                <div>
                                                  <strong>CPF:</strong>{" "}
                                                  {
                                                    selectedWithdrawal
                                                      .bank_account_verification
                                                      .current_bank_account.cpf
                                                  }
                                                </div>
                                                <div>
                                                  <strong>Nome:</strong>{" "}
                                                  {
                                                    selectedWithdrawal
                                                      .bank_account_verification
                                                      .current_bank_account.name
                                                  }
                                                </div>
                                              </div>
                                            ) : (
                                              <p className="text-muted-foreground">
                                                Nenhuma conta bancária registrada
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  <Card>
                                    <CardHeader>
                                      <CardTitle>Resumo da Verificação</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                          <span>Valor do saque correto</span>
                                          {selectedWithdrawal.verification_summary
                                            .withdrawal_amount_correct ? (
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                          ) : (
                                            <XCircle className="h-5 w-5 text-red-600" />
                                          )}
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span>Detalhes bancários consistentes</span>
                                          {selectedWithdrawal.verification_summary
                                            .bank_details_consistent ? (
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                          ) : (
                                            <XCircle className="h-5 w-5 text-red-600" />
                                          )}
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span>ID da transação válido</span>
                                          {selectedWithdrawal.verification_summary
                                            .transaction_id_valid ? (
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                          ) : (
                                            <XCircle className="h-5 w-5 text-red-600" />
                                          )}
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span>Tempo de processamento razoável</span>
                                          {selectedWithdrawal.verification_summary
                                            .processing_time_reasonable ? (
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                          ) : (
                                            <XCircle className="h-5 w-5 text-red-600" />
                                          )}
                                        </div>
                                        <Separator />
                                        <div className="flex items-center justify-between">
                                          <span className="font-medium">Status geral</span>
                                          {getStatusBadge(
                                            selectedWithdrawal.verification_summary
                                              .overall_verification_status
                                          )}
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>
                              ) : null}
                              <div className="flex flex-wrap gap-2 pt-2">
                                {(withdrawal.status === "pending" ||
                                  withdrawal.status === "processing") && (
                                  <>
                                    <Button
                                      size="sm"
                                      disabled={
                                        processingWithdrawalId === withdrawal.id
                                      }
                                      onClick={() =>
                                        handleProcessWithdrawal(
                                          withdrawal.id,
                                          "approve"
                                        )
                                      }
                                    >
                                      Aprovar saque
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      disabled={
                                        processingWithdrawalId === withdrawal.id
                                      }
                                      onClick={() =>
                                        handleProcessWithdrawal(
                                          withdrawal.id,
                                          "reject"
                                        )
                                      }
                                    >
                                      Rejeitar saque
                                    </Button>
                                  </>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t pt-4 text-sm text-muted-foreground sm:flex-row">
                <div>
                  Página {report.pagination.current_page} de{" "}
                  {report.pagination.last_page} •{" "}
                  {report.pagination.total} registros
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      loading || report.pagination.current_page <= 1
                    }
                    onClick={() =>
                      handlePageChange(report.pagination.current_page - 1)
                    }
                  >
                    Anterior
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from(
                      {
                        length: Math.min(5, report.pagination.last_page),
                      },
                      (_, index) => {
                        let pageNumber
                        if (report.pagination.last_page <= 5) {
                          pageNumber = index + 1
                        } else if (currentPage <= 3) {
                          pageNumber = index + 1
                        } else if (
                          currentPage >= report.pagination.last_page - 2
                        ) {
                          pageNumber =
                            report.pagination.last_page - 4 + index
                        } else {
                          pageNumber = currentPage - 2 + index
                        }

                        return (
                          <Button
                            key={pageNumber}
                            variant={
                              pageNumber === currentPage
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            disabled={loading}
                            onClick={() => handlePageChange(pageNumber)}
                          >
                            {pageNumber}
                          </Button>
                        )
                      }
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      loading ||
                      report.pagination.current_page >=
                        report.pagination.last_page
                    }
                    onClick={() =>
                      handlePageChange(report.pagination.current_page + 1)
                    }
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!report && !loading && (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Nenhum dado de verificação encontrado
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default function WithdrawalVerificationPage() {
  return (
    <AuthGuard>
      <AdminOnly>
        <WithdrawalVerificationContent />
      </AdminOnly>
    </AuthGuard>
  )
}
