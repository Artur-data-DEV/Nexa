"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Bell,
  Home,
  Package,
  FileText,
  MessageCircle,
  User,
  Settings,
  Wallet,
  BanknoteIcon,
  PlusCircle,
  LogOut,
  Menu,
  Briefcase,
  CreditCard,
  GraduationCap,
  Shield,
  BookOpen,
  Receipt
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
import { EchoProvider } from "@/presentation/contexts/echo-provider"
import { NotificationProvider } from "@/presentation/contexts/notification-provider"
import { ChatProvider } from "@/presentation/contexts/chat-provider"
import { NotificationBell } from "@/presentation/components/notification-bell"
import { Logo } from "@/presentation/components/logo"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/presentation/components/ui/sheet"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const creatorNavItems = [
    { name: "Início", href: "/dashboard", icon: Home },
    { name: "Campanhas Disponíveis", href: "/dashboard/campaigns", icon: Package },
    { name: "Minhas Campanhas", href: "/dashboard/applications", icon: FileText },
    { name: "Meu Portfólio", href: "/dashboard/portfolio", icon: Briefcase },
    { name: "Carteira", href: "/dashboard/financial", icon: Wallet },
    { name: "Histórico", href: "/dashboard/financial/history", icon: Receipt },
    { name: "Métodos de Pagamento", href: "/dashboard/payment-methods", icon: BanknoteIcon },
    { name: "Assinatura", href: "/dashboard/subscription", icon: CreditCard },
    { name: "Conversas", href: "/dashboard/messages", icon: MessageCircle },
    { name: "Guia da Plataforma", href: "/docs", icon: BookOpen },
    { name: "Verificação de Aluno", href: "/dashboard/student-verify?embedded=true", icon: GraduationCap },
    { name: "Notificações", href: "/dashboard/notifications", icon: Bell },
    { name: "Minha Conta", href: "/dashboard/profile", icon: User },
  ]

  const brandNavItems = [
    { name: "Visão Geral", href: "/dashboard", icon: Home },
    { name: "Nova Campanha", href: "/dashboard/campaigns/create", icon: PlusCircle },
    { name: "Minhas Campanhas", href: "/dashboard/campaigns", icon: Package },
    { name: "Conversas", href: "/dashboard/messages", icon: MessageCircle },
    { name: "Dados Financeiros", href: "/dashboard/financial", icon: Wallet },
    { name: "Configurar Pagamentos", href: "/dashboard/payment-methods", icon: BanknoteIcon },
    { name: "Notificações", href: "/dashboard/notifications", icon: Bell },
    { name: "Meu Perfil", href: "/dashboard/profile", icon: User },
    { name: "Guia da Plataforma", href: "/docs", icon: BookOpen },
  ]

  const navItems = user?.role === 'brand' ? brandNavItems : creatorNavItems
  
  const basePathname = pathname.split("?")[0]
  const activeItemHref = (() => {
    const candidates = navItems.map((item) => item.href.split("?")[0]).filter((hrefPath) => {
      const isRoot = hrefPath === "/dashboard"
      if (isRoot) return basePathname === hrefPath
      return basePathname === hrefPath || basePathname.startsWith(`${hrefPath}/`)
    })
    if (candidates.length === 0) return "/dashboard"
    return candidates.sort((a, b) => b.length - a.length)[0]
  })()

  return (
    <AuthGuard>
      <EchoProvider>
        <NotificationProvider>
          <ChatProvider>
            <div className="grid h-screen w-full overflow-hidden md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
              <div className="hidden border-r bg-muted/40 md:block">
                <div className="flex h-screen flex-col gap-2">
                  <div className="flex h-14 items-center border-b px-4 lg:h-15 lg:px-6">
                    <Link href="/" className="flex items-center gap-2 font-semibold">
                      <Logo
                        width={90}
                        height={30}
                        className="w-24"
                        preload={true}
                      />
                    </Link>
                  </div>
                  <div className="flex-1">
                    <nav className="grid items-start px-2 text-sm font-medium lg:px-4" data-testid="sidebar">
                      {navItems.map((item) => {
                        const Icon = item.icon
                        const hrefPath = item.href.split("?")[0]
                        const isActive = hrefPath === activeItemHref
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${isActive ? "bg-muted text-primary" : "text-muted-foreground"
                              }`}
                          >
                            <Icon className="h-4 w-4" />
                            {item.name}
                          </Link>
                        )
                      })}
                    </nav>
                  </div>
                  {user?.role === "admin" && (
                    <div className="px-2 mt-auto pb-4">
                      <div className="border-t pt-4">
                        <Link
                          href="/admin"
                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-amber-600 font-medium transition-all hover:bg-amber-50 dark:hover:bg-amber-900/20"
                        >
                          <Shield className="h-4 w-4" />
                          Painel Admin
                        </Link>
                      </div>
                    </div>
                  )}
                  {user?.role !== "brand" && (
                    <div className="px-4 pb-4">
                      <div className="text-xs rounded-md bg-pink-50 dark:bg-pink-900/40 text-pink-700 dark:text-pink-200 p-3">
                        Dica: Cuide do seu portfólio para aumentar suas chances{" "}
                        <span role="img" aria-label="rocket">🚀</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex min-h-0 flex-col">
                <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-15 lg:px-6">
                  <div className="w-full flex-1 flex items-center gap-3">
                    <div className="md:hidden">
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="outline" size="icon">
                            <Menu className="h-4 w-4" />
                          </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-72 p-0">
                          <SheetHeader className="m-auto p-5 border-b flex items-left justify-center align-middle  ">
                            <Logo
                              width={90}
                              height={30}
                              className="w-20"
                            />
                            <SheetTitle className="sr-only">Navegação</SheetTitle>
                          </SheetHeader>
                          <nav className="grid gap-1 p-2 text-sm font-medium">
                            {navItems.map((item) => {
                              const Icon = item.icon
                              const hrefPath = item.href.split("?")[0]
                              const isActive = hrefPath === activeItemHref
                              return (
                                <SheetClose asChild key={item.href}>
                                  <Link
                                    href={item.href}
                                    className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${isActive ? "bg-muted text-primary" : "text-muted-foreground"
                                      }`}
                                  >
                                    <Icon className="h-4 w-4" />
                                    {item.name}
                                  </Link>
                                </SheetClose>
                              )
                            })}
                          </nav>
                          {user?.role === "admin" && (
                            <div className="border-t p-2 mt-2">
                              <SheetClose asChild>
                                <Link
                                  href="/admin"
                                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-amber-600 font-medium transition-all hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                >
                                  <Shield className="h-4 w-4" />
                                  Painel Admin
                                </Link>
                              </SheetClose>
                            </div>
                          )}
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
                      Dashboard
                    </h1>
                  </div>
                  <NotificationBell />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="icon" className="rounded-full" data-testid="user-menu">
                        <Avatar>
                          <AvatarImage src={user?.avatar} />
                          <AvatarFallback>{user?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="sr-only">Toggle user menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => router.push("/dashboard/profile")} className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Perfil
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push("/dashboard/profile")} className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Configurações
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer" data-testid="logout-button">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sair
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </header>
                <main className="flex flex-1 min-h-0 flex-col gap-4 overflow-y-auto p-4 lg:gap-6 lg:p-6">
                  {children}
                </main>
              </div>
            </div>
          </ChatProvider>
        </NotificationProvider>
      </EchoProvider>
    </AuthGuard>
  )
}
