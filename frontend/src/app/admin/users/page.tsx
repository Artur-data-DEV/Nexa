"use client"

import { useEffect, useState, useCallback } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/presentation/components/ui/card"
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/presentation/components/ui/dialog"
import { Skeleton } from "@/presentation/components/ui/skeleton"
import {
    Users,
    Search,
    MoreHorizontal,
    UserCheck,
    UserX,
    Trash2,
    Building2,
    Palette,
    Crown,
    RefreshCw,
    Eye,
    Mail,
    Calendar,
    Shield,
    ChevronLeft,
    ChevronRight
} from "lucide-react"
import { api } from "@/infrastructure/api/axios-adapter"
import { toast } from "sonner"

interface User {
    id: number
    name: string
    email: string
    role: "creator" | "brand" | "admin"
    profile_image?: string
    is_active: boolean
    email_verified_at: string | null
    created_at: string
    last_login_at: string | null
    account_status: string
    time_on_platform: string
    total_campaigns?: number
    total_applications?: number
    company_name?: string
}

interface UserStatistics {
    total_users: number
    total_creators: number
    total_brands: number
    active_users: number
    blocked_users: number
    pending_verification: number
}

interface PaginationInfo {
    current_page: number
    last_page: number
    per_page: number
    total: number
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [statistics, setStatistics] = useState<UserStatistics | null>(null)
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [roleFilter, setRoleFilter] = useState("all")
    const [statusFilter, setStatusFilter] = useState("all")
    const [currentPage, setCurrentPage] = useState(1)
    const [pagination, setPagination] = useState<PaginationInfo | null>(null)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [processingUserId, setProcessingUserId] = useState<number | null>(null)

    const fetchUsers = useCallback(async (page = 1) => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            params.append("page", String(page))
            if (searchTerm) params.append("search", searchTerm)
            if (roleFilter !== "all") params.append("role", roleFilter)
            if (statusFilter !== "all") params.append("status", statusFilter)

            const response = await api.get<{
                success: boolean
                data: {
                    data: User[]
                    current_page: number
                    last_page: number
                    per_page: number
                    total: number
                }
            }>(`/admin/users?${params.toString()}`)

            if (response.success) {
                setUsers(response.data.data || [])
                setPagination({
                    current_page: response.data.current_page,
                    last_page: response.data.last_page,
                    per_page: response.data.per_page,
                    total: response.data.total,
                })
            }
        } catch (error) {
            console.error("Failed to fetch users:", error)
            toast.error("Falha ao carregar usuários")
        } finally {
            setLoading(false)
        }
    }, [searchTerm, roleFilter, statusFilter])

    const fetchStatistics = async () => {
        try {
            const response = await api.get<{
                success: boolean
                data: UserStatistics
            }>("/admin/users/statistics")

            if (response.success) {
                setStatistics(response.data)
            }
        } catch (error) {
            console.error("Failed to fetch user statistics:", error)
        }
    }

    useEffect(() => {
        fetchUsers(currentPage)
        fetchStatistics()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage])

    const handleSearch = () => {
        setCurrentPage(1)
        fetchUsers(1)
    }

    const handleUserAction = async (userId: number, action: "activate" | "block" | "remove") => {
        setProcessingUserId(userId)
        try {
            const response = await api.patch<{
                success: boolean
                message?: string
            }>(`/admin/users/${userId}/status`, { action })

            if (response.success) {
                toast.success(response.message || `Usuário ${action === "activate" ? "ativado" : action === "block" ? "bloqueado" : "removido"} com sucesso`)
                fetchUsers(currentPage)
                fetchStatistics()
            } else {
                toast.error(response.message || "Falha ao executar ação")
            }
        } catch (error) {
            console.error("Failed to update user:", error)
            toast.error("Falha ao atualizar usuário")
        } finally {
            setProcessingUserId(null)
        }
    }

    const getRoleBadge = (role: string) => {
        switch (role) {
            case "creator":
                return <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"><Palette className="mr-1 h-3 w-3" />Criador</Badge>
            case "brand":
                return <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"><Building2 className="mr-1 h-3 w-3" />Marca</Badge>
            case "admin":
                return <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"><Crown className="mr-1 h-3 w-3" />Admin</Badge>
            default:
                return <Badge variant="outline">{role}</Badge>
        }
    }

    const getStatusBadge = (user: User) => {
        if (!user.is_active) {
            return <Badge variant="destructive">Bloqueado</Badge>
        }
        if (!user.email_verified_at) {
            return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Não verificado</Badge>
        }
        return <Badge variant="default" className="bg-green-600">Ativo</Badge>
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div>
                <Badge variant="outline" className="mb-2">Usuários</Badge>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    Gerenciamento de Usuários
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                    Visualize e gerencie todos os usuários da plataforma.
                </p>
            </div>

            {/* Statistics Cards */}
            {statistics && (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.total_users}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Criadores</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-600">{statistics.total_creators}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Marcas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{statistics.total_brands}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Ativos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{statistics.active_users}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Bloqueados</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{statistics.blocked_users}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{statistics.pending_verification}</div>
                        </CardContent>
                    </Card>
                </div>
            )}

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
                                placeholder="Buscar por nome ou email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            />
                        </div>
                        <div className="w-40">
                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os tipos</SelectItem>
                                    <SelectItem value="creator">Criadores</SelectItem>
                                    <SelectItem value="brand">Marcas</SelectItem>
                                    <SelectItem value="admin">Admins</SelectItem>
                                </SelectContent>
                            </Select>
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
                                    <SelectItem value="unverified">Não verificados</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleSearch}>
                            <Search className="mr-2 h-4 w-4" />
                            Buscar
                        </Button>
                        <Button variant="outline" onClick={() => {
                            setSearchTerm("")
                            setRoleFilter("all")
                            setStatusFilter("all")
                            setCurrentPage(1)
                            fetchUsers(1)
                        }}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Limpar
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Usuários
                        {pagination && (
                            <span className="ml-2 text-sm font-normal text-muted-foreground">
                                ({pagination.total} total)
                            </span>
                        )}
                    </CardTitle>
                    <CardDescription>
                        Lista de todos os usuários cadastrados na plataforma.
                    </CardDescription>
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
                                    <Skeleton className="h-6 w-20" />
                                    <Skeleton className="h-6 w-16" />
                                </div>
                            ))}
                        </div>
                    ) : users.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">
                            Nenhum usuário encontrado
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-muted-foreground">
                                        <th className="px-4 py-3 text-left">Usuário</th>
                                        <th className="px-4 py-3 text-left">Tipo</th>
                                        <th className="px-4 py-3 text-left">Status</th>
                                        <th className="px-4 py-3 text-left">Cadastro</th>
                                        <th className="px-4 py-3 text-left">Tempo</th>
                                        <th className="px-4 py-3 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id} className="border-b last:border-0 hover:bg-muted/50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                                        {user.profile_image ? (
                                                            <Image
                                                                src={user.profile_image}
                                                                alt={user.name}
                                                                width={40}
                                                                height={40}
                                                                className="h-10 w-10 rounded-full object-cover"
                                                                unoptimized
                                                            />
                                                        ) : (
                                                            user.name.charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{user.name}</div>
                                                        <div className="text-xs text-muted-foreground">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">{getRoleBadge(user.role)}</td>
                                            <td className="px-4 py-3">{getStatusBadge(user)}</td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {new Date(user.created_at).toLocaleDateString("pt-BR")}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {user.time_on_platform}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" disabled={processingUserId === user.id}>
                                                            {processingUserId === user.id ? (
                                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            Ver detalhes
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        {user.is_active ? (
                                                            <DropdownMenuItem
                                                                onClick={() => handleUserAction(user.id, "block")}
                                                                className="text-yellow-600"
                                                            >
                                                                <UserX className="mr-2 h-4 w-4" />
                                                                Bloquear
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <DropdownMenuItem
                                                                onClick={() => handleUserAction(user.id, "activate")}
                                                                className="text-green-600"
                                                            >
                                                                <UserCheck className="mr-2 h-4 w-4" />
                                                                Ativar
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem
                                                            onClick={() => handleUserAction(user.id, "remove")}
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

            {/* User Details Dialog */}
            <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Detalhes do Usuário</DialogTitle>
                        <DialogDescription>Informações completas do usuário</DialogDescription>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                                    {selectedUser.profile_image ? (
                                        <Image
                                            src={selectedUser.profile_image}
                                            alt={selectedUser.name}
                                            width={64}
                                            height={64}
                                            className="h-16 w-16 rounded-full object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        selectedUser.name.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                                    {selectedUser.company_name && (
                                        <p className="text-sm text-muted-foreground">{selectedUser.company_name}</p>
                                    )}
                                    {getRoleBadge(selectedUser.role)}
                                </div>
                            </div>

                            <div className="grid gap-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span>{selectedUser.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>Cadastrado em {new Date(selectedUser.created_at).toLocaleDateString("pt-BR")}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Shield className="h-4 w-4 text-muted-foreground" />
                                    <span>Status: {selectedUser.account_status}</span>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4">
                                {selectedUser.is_active ? (
                                    <Button variant="outline" className="flex-1 text-yellow-600" onClick={() => {
                                        handleUserAction(selectedUser.id, "block")
                                        setSelectedUser(null)
                                    }}>
                                        <UserX className="mr-2 h-4 w-4" />
                                        Bloquear
                                    </Button>
                                ) : (
                                    <Button variant="outline" className="flex-1 text-green-600" onClick={() => {
                                        handleUserAction(selectedUser.id, "activate")
                                        setSelectedUser(null)
                                    }}>
                                        <UserCheck className="mr-2 h-4 w-4" />
                                        Ativar
                                    </Button>
                                )}
                                <Button variant="destructive" className="flex-1" onClick={() => {
                                    handleUserAction(selectedUser.id, "remove")
                                    setSelectedUser(null)
                                }}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Remover
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
