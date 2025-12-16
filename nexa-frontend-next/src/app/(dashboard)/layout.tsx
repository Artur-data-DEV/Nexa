"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Bell,
  Home,
  LineChart,
  Package,
  Package2,
  ShoppingCart,
  Users,
  LogOut,
  User,
  Settings,
  FileText,
  MessageCircle,
  Briefcase,
  Wallet,
  CreditCard,
  Receipt,
  GraduationCap,
  BookOpen,
  BanknoteIcon,
  PlusCircle,
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
import { ThemeProvider } from "@/presentation/contexts/theme-provider"
import { EchoProvider } from "@/presentation/contexts/echo-provider"

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
    { name: "Minhas Aplicações", href: "/dashboard/applications", icon: FileText },
    { name: "Conversas", href: "/dashboard/messages", icon: MessageCircle },
    { name: "Minha Conta", href: "/dashboard/profile", icon: User },
    // { name: "Meu Portfólio", href: "/dashboard/portfolio", icon: Briefcase },
    { name: "Saldo e Saques", href: "/dashboard/finance", icon: Wallet },
    // { name: "Assinatura", href: "/dashboard/subscription", icon: CreditCard },
    // { name: "Verificação de Aluno", href: "/dashboard/student-verify", icon: GraduationCap },
    { name: "Guia da Plataforma", href: "/dashboard/guide", icon: BookOpen },
  ]

  const brandNavItems = [
    { name: "Visão Geral", href: "/dashboard", icon: Home },
    { name: "Minhas Campanhas", href: "/dashboard/campaigns", icon: Package },
    { name: "Nova Campanha", href: "/dashboard/campaigns/new", icon: PlusCircle },
    { name: "Conversas", href: "/dashboard/messages", icon: MessageCircle },
    { name: "Meu Perfil", href: "/dashboard/profile", icon: User },
    { name: "Pagamentos", href: "/dashboard/payments", icon: BanknoteIcon },
    { name: "Guia da Plataforma", href: "/dashboard/guide", icon: BookOpen },
  ]

  const navItems = user?.role === 'brand' ? brandNavItems : creatorNavItems

  return (
    <AuthGuard>
      <EchoProvider>
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <div className="hidden border-r bg-muted/40 md:block">
          <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
              <Link href="/" className="flex items-center gap-2 font-semibold">
                <Package2 className="h-6 w-6" />
                <span className="">Nexa</span>
              </Link>
              <Button variant="outline" size="icon" className="ml-auto h-8 w-8">
                <Bell className="h-4 w-4" />
                <span className="sr-only">Toggle notifications</span>
              </Button>
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
            {/* <div className="mt-auto p-4">
              <Card x-chunk="dashboard-02-chunk-0">
                <CardHeader className="p-2 pt-0 md:p-4">
                  <CardTitle>Upgrade to Pro</CardTitle>
                  <CardDescription>
                    Unlock all features and get unlimited access to our support
                    team.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
                  <Button size="sm" className="w-full">
                    Upgrade
                  </Button>
                </CardContent>
              </Card>
            </div> */}
          </div>
        </div>
        <div className="flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
            <div className="w-full flex-1">
              {/* <form>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search products..."
                    className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
                  />
                </div>
              </form> */}
              <h1 className="font-semibold text-lg">Dashboard</h1>
            </div>
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
      </EchoProvider>
    </AuthGuard>
  )
}
