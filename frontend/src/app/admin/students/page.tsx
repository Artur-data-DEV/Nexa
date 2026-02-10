"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card"
import { Button } from "@/presentation/components/ui/button"
import { Badge } from "@/presentation/components/ui/badge"
import { Input } from "@/presentation/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/presentation/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/presentation/components/ui/dropdown-menu"
import { Skeleton } from "@/presentation/components/ui/skeleton"
import Image from "next/image"
import {
    GraduationCap,
    Search,
    MoreHorizontal,
    UserCheck,
    UserX,
    Trash2,
    Calendar,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Clock
} from "lucide-react"
import { api } from "@/infrastructure/api/axios-adapter"
import { toast } from "sonner"
import type { AxiosError } from "axios"
import Link from "next/link"

interface Student {
    id: number
    name: string
    email: string
    profile_image?: string
    is_active: boolean
    institution_name?: string
    course_name?: string
    student_verified_at: string
    trial_ends_at?: string
    created_at: string
}

interface PaginationInfo {
    current_page: number
    last_page: number
    per_page: number
    total: number
}

export default function AdminStudentsPage() {
    const [students, setStudents] = useState<Student[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [currentPage, setCurrentPage] = useState(1)
    const [pagination, setPagination] = useState<PaginationInfo | null>(null)
    const [processingId, setProcessingId] = useState<number | null>(null)

    useEffect(() => {
        fetchStudents(currentPage)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage])

    const fetchStudents = async (page = 1) => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            params.append("page", String(page))
            if (searchTerm) params.append("search", searchTerm)
            if (statusFilter !== "all") params.append("status", statusFilter)

            const response = await api.get<{
                success: boolean
                data: {
                    data: Student[]
                    current_page: number
                    last_page: number
                    per_page: number
                    total: number
                }
            }>(`/admin/students?${params.toString()}`)

            if (response.success) {
                setStudents(response.data.data || [])
                setPagination({
                    current_page: response.data.current_page,
                    last_page: response.data.last_page,
                    per_page: response.data.per_page,
                    total: response.data.total,
                })
            }
        } catch (error) {
            console.error("Failed to fetch students:", error)
            toast.error("Falha ao carregar alunos")
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = () => {
        setCurrentPage(1)
        fetchStudents(1)
    }

    const handleAction = async (studentId: number, action: "activate" | "block" | "remove") => {
        if (action === "remove" && !confirm("Tem certeza que deseja remover este aluno?")) return

        setProcessingId(studentId)
        try {
            const response = await api.patch<{
                success: boolean
                message?: string
            }>(`/admin/students/${studentId}/status`, { action })

            if (response.success) {
                toast.success(response.message || `Ação realizada com sucesso`)
                fetchStudents(currentPage)
            } else {
                toast.error(response.message || "Falha ao executar ação")
            }
        } catch (error: unknown) {
            const axiosError = error as AxiosError<{ message?: string }>
            console.error(`Failed to ${action} student:`, axiosError)
            toast.error(axiosError.response?.data?.message || "Falha ao atualizar aluno")
        } finally {
            setProcessingId(null)
        }
    }

    const handleExtendTrial = async (studentId: number) => {
        const days = prompt("Quantos dias deseja adicionar ao período de teste?", "30")
        if (!days || isNaN(Number(days))) return

        setProcessingId(studentId)
        try {
            const response = await api.patch<{ success: boolean; message?: string }>(
                `/admin/students/${studentId}/trial`,
                { days: Number(days) }
            )

            if (response.success) {
                toast.success(response.message || "Período de teste estendido")
                fetchStudents(currentPage)
            }
        } catch (error) {
            console.error("Failed to extend trial:", error)
            toast.error("Falha ao estender período de teste")
        } finally {
            setProcessingId(null)
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <Badge variant="outline" className="mb-2">Alunos</Badge>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                        Gerenciamento de Alunos
                    </h1>
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                        Visualize e gerencie todos os alunos verificados na plataforma.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/admin/students/verification">
                        Verificar Solicitações
                    </Link>
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Filtros
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="flex-1 min-w-50">
                            <Input
                                placeholder="Buscar por nome, email ou instituição..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            />
                        </div>
                        <div className="w-40">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="active">Ativos</SelectItem>
                                    <SelectItem value="blocked">Bloqueados</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleSearch}>
                            <Search className="mr-2 h-4 w-4" />
                            Buscar
                        </Button>
                        <Button variant="outline" onClick={() => {
                            setSearchTerm("")
                            setStatusFilter("all")
                            setCurrentPage(1)
                            fetchStudents(1)
                        }}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Limpar
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Students Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        Alunos Verificados
                        {pagination && (
                            <span className="ml-2 text-sm font-normal text-muted-foreground">
                                ({pagination.total} total)
                            </span>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-48" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                    <Skeleton className="h-6 w-24" />
                                </div>
                            ))}
                        </div>
                    ) : students.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">
                            Nenhum aluno encontrado
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-muted-foreground">
                                        <th className="px-4 py-3 text-left">Aluno</th>
                                        <th className="px-4 py-3 text-left">Instituição</th>
                                        <th className="px-4 py-3 text-left">Status</th>
                                        <th className="px-4 py-3 text-left">Período de Teste</th>
                                        <th className="px-4 py-3 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student) => (
                                        <tr key={student.id} className="border-b last:border-0 hover:bg-muted/50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                                        {student.profile_image ? (
                                                            <Image
                                                                src={student.profile_image}
                                                                alt={student.name}
                                                                width={40}
                                                                height={40}
                                                                className="h-10 w-10 rounded-full object-cover"
                                                                sizes="40px"
                                                                unoptimized
                                                            />
                                                        ) : (
                                                            student.name.charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{student.name}</div>
                                                        <div className="text-xs text-muted-foreground">{student.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium">{student.institution_name || "-"}</div>
                                                <div className="text-xs text-muted-foreground">{student.course_name || "-"}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {student.is_active ? (
                                                    <Badge className="bg-green-600">Ativo</Badge>
                                                ) : (
                                                    <Badge variant="destructive">Bloqueado</Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {student.trial_ends_at ? (
                                                    <div className="flex items-center text-xs">
                                                        <Clock className="mr-1 h-3 w-3 text-muted-foreground" />
                                                        Até {new Date(student.trial_ends_at).toLocaleDateString("pt-BR")}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" disabled={processingId === student.id}>
                                                            {processingId === student.id ? (
                                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleExtendTrial(student.id)}>
                                                            <Calendar className="mr-2 h-4 w-4" />
                                                            Estender Teste
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        {student.is_active ? (
                                                            <DropdownMenuItem
                                                                onClick={() => handleAction(student.id, "block")}
                                                                className="text-yellow-600"
                                                            >
                                                                <UserX className="mr-2 h-4 w-4" />
                                                                Bloquear
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <DropdownMenuItem
                                                                onClick={() => handleAction(student.id, "activate")}
                                                                className="text-green-600"
                                                            >
                                                                <UserCheck className="mr-2 h-4 w-4" />
                                                                Ativar
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem
                                                            onClick={() => handleAction(student.id, "remove")}
                                                            className="text-red-600"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Remover
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination && pagination.last_page > 1 && (
                        <div className="mt-4 flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                Página {pagination.current_page} de {pagination.last_page}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Anterior
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                    disabled={currentPage === pagination.last_page}
                                >
                                    Próximo
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
