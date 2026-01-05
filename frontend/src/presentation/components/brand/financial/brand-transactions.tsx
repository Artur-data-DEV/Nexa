"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/presentation/components/ui/card"
import { Badge } from "@/presentation/components/ui/badge"
import { Button } from "@/presentation/components/ui/button"
import { Input } from "@/presentation/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/presentation/components/ui/select"
import { DollarSign, Search, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { api } from "@/infrastructure/api/axios-adapter"
import { toast } from "sonner"

interface BrandTransactionCreator {
  id: number
  name: string
  email: string
}

interface BrandTransaction {
  id: number
  contract_id: number
  contract_title: string
  contract_budget: number
  creator: BrandTransactionCreator | null
  pagarme_transaction_id: string
  stripe_payment_intent_id: string
  stripe_charge_id: string
  status: string
  amount: string
  payment_method: string
  card_brand: string
  card_last4: string
  card_holder_name: string
  paid_at: string
  created_at: string
}

interface BrandTransactionPagination {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

interface BrandTransactionHistoryResponse {
  success: boolean
  transactions?: BrandTransaction[]
  pagination?: BrandTransactionPagination
  error?: string
}

const ITEMS_PER_PAGE = 10

const formatCurrency = (value: string | number): string => {
  const numValue = typeof value === "string" ? parseFloat(value) : value
  if (Number.isNaN(numValue)) {
    return value.toString()
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numValue)
}

const formatDate = (dateString: string): string => {
  if (!dateString) {
    return "-"
  }
  try {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  } catch {
    return dateString
  }
}

const translateStatus = (status: string): string => {
  const map: Record<string, string> = {
    pending: "Pendente",
    processing: "Processando",
    paid: "Pago",
    completed: "Concluído",
    failed: "Falhou",
    cancelled: "Cancelado",
    refunded: "Reembolsado",
    expired: "Expirado",
  }
  const key = status.toLowerCase()
  return map[key] || status
}

const getStatusBadge = (status: string) => {
  const translatedStatus = translateStatus(status)
  const normalized = status.toLowerCase()

  if (normalized === "paid" || normalized === "completed") {
    return (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        {translatedStatus}
      </Badge>
    )
  }

  if (normalized === "failed") {
    return (
      <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200">
        <XCircle className="w-3 h-3 mr-1" />
        {translatedStatus}
      </Badge>
    )
  }

  if (normalized === "pending" || normalized === "processing") {
    return (
      <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
        <Clock className="w-3 h-3 mr-1" />
        {translatedStatus}
      </Badge>
    )
  }

  return (
    <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
      {translatedStatus}
    </Badge>
  )
}

const getPaymentMethodIcon = (paymentMethod?: string | null) => {
  const normalized = (paymentMethod ?? "").toLowerCase()
  if (normalized.includes("pix")) {
    return <DollarSign className="w-4 h-4" />
  }
  return <DollarSign className="w-4 h-4" />
}

export default function BrandTransactionsView() {
  const [transactions, setTransactions] = useState<BrandTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<BrandTransactionPagination>({
    current_page: 1,
    last_page: 1,
    per_page: ITEMS_PER_PAGE,
    total: 0,
    from: null,
    to: null,
  })

  const loadTransactions = async (page: number = 1) => {
    try {
      setLoading(true)
      const response = await api.get<BrandTransactionHistoryResponse>("/brand/transactions", {
        params: { page, per_page: ITEMS_PER_PAGE },
      })

      if (response.success && response.transactions) {
        setTransactions(response.transactions)
        if (response.pagination) {
          setPagination(response.pagination)
        }
      } else {
        toast.error(response.error || "Erro ao carregar transações")
      }
    } catch (error) {
      console.error("Error loading transactions", error)
      toast.error("Erro ao carregar transações. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTransactions(currentPage)
  }, [currentPage])

  const filteredTransactions = transactions.filter((transaction) => {
    const term = searchTerm.trim().toLowerCase()

    const matchesSearch =
      term.length === 0 ||
      transaction.contract_title.toLowerCase().includes(term) ||
      (transaction.creator?.name || "").toLowerCase().includes(term) ||
      (transaction.creator?.email || "").toLowerCase().includes(term) ||
      transaction.id.toString().includes(term)

    const normalizedStatus = transaction.status.toLowerCase()
    const matchesStatus =
      statusFilter === "all" || normalizedStatus === statusFilter.toLowerCase()

    return matchesSearch && matchesStatus
  })

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.last_page && newPage !== currentPage) {
      setCurrentPage(newPage)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 min-h-[92vh]">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Financeiro da Marca</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Acompanhe todas as transações relacionadas aos seus contratos e pagamentos.
          </p>
        </div>
        <Button
          onClick={() => loadTransactions(currentPage)}
          variant="outline"
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por contrato, criador ou ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-52">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="processing">Processando</SelectItem>
                  <SelectItem value="failed">Falhou</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Transações</CardTitle>
          <CardDescription>
            {pagination.total > 0
              ? `${pagination.total} transação${pagination.total !== 1 ? "ões" : ""} encontrada${
                  pagination.total !== 1 ? "s" : ""
                }`
              : "Nenhuma transação encontrada"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {searchTerm || statusFilter !== "all"
                ? "Nenhuma transação encontrada com os filtros aplicados"
                : "Nenhuma transação encontrada"}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex flex-col gap-4 rounded-lg border bg-muted/40 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        #{transaction.id}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/5 px-2 py-0.5 text-xs font-medium text-primary">
                        <DollarSign className="h-3 w-3" />
                        Contrato #{transaction.contract_id}
                      </span>
                    </div>
                    <div className="font-medium text-sm sm:text-base">
                      {transaction.contract_title}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Valor contratado: {formatCurrency(transaction.contract_budget)}
                    </div>
                    <div className="mt-1 text-xs sm:text-sm text-muted-foreground">
                      Criador:{" "}
                      {transaction.creator ? (
                        <>
                          <span className="font-medium text-foreground">
                            {transaction.creator.name}
                          </span>{" "}
                          ({transaction.creator.email})
                        </>
                      ) : (
                        <span className="italic">Não informado</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 min-w-45">
                    <div className="flex items-center gap-2">
                      {getPaymentMethodIcon(transaction.payment_method)}
                      <div className="text-right">
                        <div className="text-sm font-semibold text-foreground">
                          {formatCurrency(transaction.amount)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {transaction.card_brand || transaction.payment_method}
                          {transaction.card_last4 && ` • ****${transaction.card_last4}`}
                        </div>
                      </div>
                    </div>
                    <div>{getStatusBadge(transaction.status)}</div>
                    <div className="text-right text-xs text-muted-foreground">
                      <div>Criação: {formatDate(transaction.created_at)}</div>
                      {transaction.paid_at && (
                        <div>Pago: {formatDate(transaction.paid_at)}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {pagination.last_page > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Página {pagination.current_page} de {pagination.last_page}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                    >
                      Anterior
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                        let pageNum
                        if (pagination.last_page <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= pagination.last_page - 2) {
                          pageNum = pagination.last_page - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            disabled={loading}
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === pagination.last_page || loading}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

