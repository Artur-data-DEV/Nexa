"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    Home,
    FileText,
    Users,
    GraduationCap,
    BookOpen,
    Trophy,
    Shield,
    Waypoints,
    Bell,
    LogOut,
    Menu,
    Text
} from "lucide-react"

import { Button } from "@/presentation/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/presentation/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/presentation/components/ui/avatar"
import { useAuth } from "@/presentation/contexts/auth-provider"
import { AuthGuard } from "@/presentation/components/auth/auth-guard"
import { Logo } from "@/presentation/components/logo"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetClose,
} from "@/presentation/components/ui/sheet"
import { Alert, AlertDescription, AlertTitle } from "@/presentation/components/ui/alert"
import { ShieldAlert } from "lucide-react"

const adminNavItems = [
    { name: "Painel", href: "/admin", icon: Home },
    { name: "Campanhas Pendentes", href: "/admin/campaigns/pending", icon: FileText },
    { name: "Todas as Campanhas", href: "/admin/campaigns", icon: Text },
    { name: "Usuários", href: "/admin/users", icon: Users },
    { name: "Alunos", href: "/admin/students", icon: GraduationCap },
    { name: "Verificação de Alunos", href: "/admin/students/verification", icon: BookOpen },
    { name: "Rankings das Marcas", href: "/admin/rankings", icon: Trophy },
    { name: "Verificação de Saques", href: "/admin/withdrawals/verification", icon: Shield },
    { name: "Guias", href: "/admin/guides", icon: Waypoints },
    { name: "Notificações", href: "/admin/notifications", icon: Bell },
]

function AdminOnly({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
            </div>
        )
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
                            Você não tem permissão para acessar o painel administrativo. Apenas
                            administradores podem acessar esta área.
                        </AlertDescription>
                    </Alert>
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                        <Button variant="outline" asChild>
                            <Link href="/dashboard">
                                Voltar para o dashboard
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link href="/">
                                Ir para a página inicial
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return <>{children}</>
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, logout } = useAuth()
    const pathname = usePathname()

    const basePathname = pathname.split("?")[0]
    const activeItemHref = (() => {
        const candidates = adminNavItems.map((item) => item.href).filter((hrefPath) => {
            const isRoot = hrefPath === "/admin"
            if (isRoot) return basePathname === hrefPath
            return basePathname === hrefPath || basePathname.startsWith(`${hrefPath}/`)
        })
        if (candidates.length === 0) return "/admin"
        return candidates.sort((a, b) => b.length - a.length)[0]
    })()

    return (
        <AuthGuard>
            <AdminOnly>
                <div className="grid h-screen w-full overflow-hidden md:grid-cols-[250px_1fr] lg:grid-cols-[280px_1fr]">
                    {/* Sidebar - Desktop */}
                    <div className="hidden border-r bg-muted/40 md:block">
                        <div className="flex h-screen flex-col gap-2">
                            <div className="flex h-14 items-center border-b px-4 lg:h-15 lg:px-6">
                                <Link href="/admin" className="flex items-center gap-2 font-semibold">
                                    <Logo
                                        width={90}
                                        height={30}
                                        className="w-24"
                                        preload={true}
                                    />
                                </Link>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1" data-testid="admin-sidebar">
                                    {adminNavItems.map((item) => {
                                        const Icon = item.icon
                                        const isActive = item.href === activeItemHref
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${isActive
                                                    ? "bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-300"
                                                    : "text-muted-foreground hover:bg-muted"
                                                    }`}
                                            >
                                                <Icon className="h-4 w-4" />
                                                {item.name}
                                            </Link>
                                        )
                                    })}
                                    <div className="border-t mt-2 pt-2">
                                        <Link
                                            href="/dashboard"
                                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                                        >
                                            <LogOut className="h-4 w-4 rotate-180" />
                                            Voltar ao App
                                        </Link>
                                    </div>
                                </nav>
                            </div>
                            <div className="px-4 pb-4">
                                <div className="text-xs rounded-md bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/40 dark:to-purple-900/40 text-pink-700 dark:text-pink-200 p-3">
                                    <span className="font-medium">Admin Mode</span> - Gerencie a plataforma com cuidado 🛡️
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex min-h-0 flex-col">
                        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-15 lg:px-6">
                            <div className="w-full flex-1 flex items-center gap-3">
                                {/* Mobile Menu */}
                                <div className="md:hidden">
                                    <Sheet>
                                        <SheetTrigger asChild>
                                            <Button variant="outline" size="icon">
                                                <Menu className="h-4 w-4" />
                                            </Button>
                                        </SheetTrigger>
                                        <SheetContent side="left" className="w-72 p-0">
                                            <SheetHeader className="m-auto p-5 border-b flex items-left justify-center align-middle">
                                                <Logo
                                                    width={90}
                                                    height={30}
                                                    className="w-20"
                                                />
                                                <SheetTitle className="sr-only">Navegação Admin</SheetTitle>
                                            </SheetHeader>
                                            <nav className="grid gap-1 p-2 text-sm font-medium">
                                                {adminNavItems.map((item) => {
                                                    const Icon = item.icon
                                                    const isActive = item.href === activeItemHref
                                                    return (
                                                        <SheetClose asChild key={item.href}>
                                                            <Link
                                                                href={item.href}
                                                                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${isActive
                                                                    ? "bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-300"
                                                                    : "text-muted-foreground"
                                                                    }`}
                                                            >
                                                                <Icon className="h-4 w-4" />
                                                                {item.name}
                                                            </Link>
                                                        </SheetClose>
                                                    )
                                                })}
                                                <div className="border-t mt-2 pt-2">
                                                    <SheetClose asChild>
                                                        <Link
                                                            href="/dashboard"
                                                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                                                        >
                                                            <LogOut className="h-4 w-4 rotate-180" />
                                                            Voltar ao App
                                                        </Link>
                                                    </SheetClose>
                                                </div>
                                            </nav>
                                        </SheetContent>
                                    </Sheet>
                                </div>
                                <div className="md:hidden">
                                    <Logo
                                        width={90}
                                        height={30}
                                        className="w-20"
                                    />
                                </div>
                                <h1 className="hidden md:block font-semibold text-lg">
                                    Painel Administrativo
                                </h1>
                            </div>

                            {/* User Menu */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="secondary" size="icon" className="rounded-full" data-testid="admin-user-menu">
                                        <Avatar>
                                            <AvatarImage src={user?.avatar} />
                                            <AvatarFallback>{user?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <span className="sr-only">Toggle user menu</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>
                                        <div className="flex flex-col">
                                            <span>{user?.name}</span>
                                            <span className="text-xs text-muted-foreground font-normal">{user?.email}</span>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard" className="flex items-center cursor-pointer">
                                            <Home className="mr-2 h-4 w-4" />
                                            Voltar ao Dashboard
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer" data-testid="admin-logout-button">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Sair
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </header>
                        <main className="flex flex-1 min-h-0 flex-col gap-4 overflow-y-auto p-4 lg:gap-6 lg:p-6 dark:bg-[#171717]">
                            {children}
                        </main>
                    </div>
                </div>
            </AdminOnly>
        </AuthGuard>
    )
}
