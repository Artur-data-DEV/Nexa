"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Bell,
  Home,
  Package,
  FileText,
  MessageCircle,
  User,
  Settings,
  Wallet,
  BookOpen,
  BanknoteIcon,
  PlusCircle,
  LogOut,
  Menu,
  Briefcase,
  CreditCard,
  GraduationCap
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

  const creatorNavItems = [
    { name: "Início", href: "/dashboard", icon: Home },
    { name: "Campanhas", href: "/dashboard/campaigns", icon: Package },
    // { name: "Minhas Aplicações", href: "/dashboard/applications", icon: FileText },
    { name: "Conversas", href: "/dashboard/messages", icon: MessageCircle },
    { name: "Meu Portfólio", href: "/dashboard/portfolio", icon: Briefcase },
    { name: "Financeiro", href: "/dashboard/financial", icon: Wallet },
    { name: "Assinatura", href: "/dashboard/subscription", icon: CreditCard },
    { name: "Métodos de Pagamento", href: "/dashboard/payment-methods", icon: BanknoteIcon },
    { name: "Verificação de Aluno", href: "/dashboard/student-verify?embedded=true", icon: GraduationCap },
    { name: "Notificações", href: "/dashboard/notifications", icon: Bell },
    { name: "Minha Conta", href: "/dashboard/profile", icon: User },
    // { name: "Guia da Plataforma", href: "/dashboard/guide", icon: BookOpen },
  ]

  const brandNavItems = [
    { name: "Visão Geral", href: "/dashboard", icon: Home },
    { name: "Minhas Campanhas", href: "/dashboard/campaigns", icon: Package },
    { name: "Nova Campanha", href: "/dashboard/campaigns/create", icon: PlusCircle },
    { name: "Conversas", href: "/dashboard/messages", icon: MessageCircle },
    { name: "Financeiro", href: "/dashboard/financial", icon: Wallet },
    { name: "Notificações", href: "/dashboard/notifications", icon: Bell },
    { name: "Meu Perfil", href: "/dashboard/profile", icon: User },
    // { name: "Guia da Plataforma", href: "/dashboard/guide", icon: BookOpen },
  ]

  const navItems = user?.role === 'brand' ? brandNavItems : creatorNavItems

  return (
    <AuthGuard>
      <EchoProvider>
        <NotificationProvider>
          <ChatProvider>
            <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
              <div className="hidden border-r bg-muted/40 md:block">
                <div className="flex h-full max-h-screen flex-col gap-2">
                  <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
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
                    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                      {navItems.map((item) => {
                        const Icon = item.icon
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
                              pathname === item.href
                                ? "bg-muted text-primary"
                                : "text-muted-foreground"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            {item.name}
                          </Link>
                        )
                      })}
                    </nav>
                  </div>
                </div>
              </div>
              <div className="flex flex-col">
                <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                  <div className="w-full flex-1 flex items-center gap-3">
                    <div className="md:hidden">
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="outline" size="icon">
                            <Menu className="h-4 w-4" />
                          </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-72 p-0">
                          <SheetHeader className="p-4 border-b">
                            <SheetTitle>Navegação</SheetTitle>
                          </SheetHeader>
                          <nav className="grid gap-1 p-2 text-sm font-medium">
                            {navItems.map((item) => {
                              const Icon = item.icon
                              return (
                                <SheetClose asChild key={item.href}>
                                  <Link
                                    href={item.href}
                                    className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
                                      pathname === item.href
                                        ? "bg-muted text-primary"
                                        : "text-muted-foreground"
                                    }`}
                                  >
                                    <Icon className="h-4 w-4" />
                                    {item.name}
                                  </Link>
                                </SheetClose>
                              )
                            })}
                          </nav>
                        </SheetContent>
                      </Sheet>
                    </div>
                    <h1 className="font-semibold text-lg">Dashboard</h1>
                  </div>
                  <NotificationBell />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="icon" className="rounded-full">
                        <Avatar>
                            <AvatarImage src={user?.avatar} />
                            <AvatarFallback>{user?.name?.substring(0,2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="sr-only">Toggle user menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                          <User className="mr-2 h-4 w-4" />
                          Perfil
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                          <Settings className="mr-2 h-4 w-4" />
                          Configurações
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={logout} className="text-destructive">
                          <LogOut className="mr-2 h-4 w-4" />
                          Sair
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
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
