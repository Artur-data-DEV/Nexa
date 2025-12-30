"use client"

import Link from "next/link"
import { Menu, UserStar, Building2 } from "lucide-react"
import { Button } from "@/presentation/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/presentation/components/ui/sheet"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { ThemeToggle } from "@/presentation/components/theme-toggle"
import { Logo } from "@/presentation/components/logo"
import { usePathname } from "next/navigation"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/presentation/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/presentation/components/ui/avatar"
import { useAuth } from "@/presentation/contexts/auth-provider"

const MobileMenu = () => (
    <Sheet>
        <SheetTrigger asChild>
            <Button
                variant="ghost"
                size="sm"
                className="md:hidden p-2 h-10 w-10 flex items-center justify-center cursor-pointer"
                aria-label="Abrir menu de navegação"
            >
                <Menu className="h-5 w-5" />
            </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-80">
            <VisuallyHidden>
                <SheetTitle>Menu de navegação</SheetTitle>
                <SheetDescription>Opções de navegação para dispositivos móveis</SheetDescription>
            </VisuallyHidden>
            <div className="flex flex-col gap-4 mt-8">
                <nav className="flex flex-col gap-3 text-md">
                    <Link href="/#how-it-works" className="text-foreground hover:text-primary transition-colors cursor-pointer">
                        Como funciona
                    </Link>
                    <Link href="/#benefits" className="text-foreground hover:text-primary transition-colors cursor-pointer">
                        Benefícios
                    </Link>
                    <Link href="/#pricing" className="text-foreground hover:text-primary transition-colors cursor-pointer">
                        Planos
                    </Link>
                    <Link href="/docs" className="text-foreground hover:text-primary transition-colors cursor-pointer">
                        Guias
                    </Link>
                </nav>
                <div className="flex flex-col gap-3 pt-2">
                    <Button variant="outline" className="w-full cursor-pointer" asChild>
                        <Link href="/login">
                            Entrar
                        </Link>
                    </Button>
                    <div className="flex flex-col gap-2">
                        <Button className="w-full bg-pink-500 hover:bg-pink-600 text-white cursor-pointer" asChild>
                            <Link href="/signup/creator?redirectTo=/dashboard">
                                <span className="inline-flex items-center gap-2">
                                    <UserStar className="h-4 w-4" />
                                    Criar conta como Criador(a)
                                </span>
                            </Link>
                        </Button>
                        <Button className="w-full bg-primary hover:bg-primary/90 text-white cursor-pointer" asChild>
                            <Link href="/signup/brand?redirectTo=/dashboard">
                                <span className="inline-flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    Criar conta como Empresa
                                </span>
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </SheetContent>
    </Sheet>
)

export const Navbar = () => {
    const pathname = usePathname()
    const { isAuthenticated, user, logout } = useAuth()
    const handleScrollTo = (id: string) => {
        if (typeof window === "undefined") return
        const element = document.getElementById(id)
        if (!element) return
        element.scrollIntoView({ behavior: "smooth", block: "start" })
    }

    return (
        <header className="w-full top-0 z-50 p-4 md:p-6 bg-background/95 backdrop-blur fixed supports-backdrop-filter:bg-background/60">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                <Link href="/" className="text-xl md:text-2xl font-bold text-foreground cursor-pointer">
                    <Logo
                        width={90}
                        height={30}
                        className="w-30 cursor-pointer"
                    />
                </Link>

                <nav className="hidden md:flex items-center gap-6 text-xl">
                    <Link
                        href="/#how-it-works"
                        className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        onClick={(e) => {
                            if (pathname === "/") {
                                e.preventDefault()
                                handleScrollTo("how-it-works")
                            }
                        }}
                    >
                        Como funciona
                    </Link>
                    <Link
                        href="/#benefits"
                        className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        onClick={(e) => {
                            if (pathname === "/") {
                                e.preventDefault()
                                handleScrollTo("benefits")
                            }
                        }}
                    >
                        Benefícios
                    </Link>
                    <Link
                        href="/#pricing"
                        className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        onClick={(e) => {
                            if (pathname === "/") {
                                e.preventDefault()
                                handleScrollTo("pricing")
                            }
                        }}
                    >
                        Planos
                    </Link>
                    <Link
                        href="/docs"
                        className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                        Guias
                    </Link>
                </nav>

                <div className="hidden md:flex items-center gap-3">
                    {!isAuthenticated ? (
                        <>
                            <Button variant="ghost" asChild className="cursor-pointer">
                                <Link href="/login">
                                    Entrar
                                </Link>
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button className="bg-pink-500 hover:bg-pink-600 text-white cursor-pointer">
                                        Criar conta
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                        <Link href="/signup/creator?redirectTo=/dashboard">
                                            <span className="inline-flex items-center gap-2">
                                                <UserStar className="h-4 w-4" />
                                                Sou Criador(a)
                                            </span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/signup/brand?redirectTo=/dashboard">
                                            <span className="inline-flex items-center gap-2">
                                                <Building2 className="h-4 w-4" />
                                                Sou Empresa
                                            </span>
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" asChild className="cursor-pointer">
                                <Link href="/dashboard">
                                    Dashboard
                                </Link>
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-muted transition-colors"
                                        aria-label="Abrir perfil"
                                    >
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={user?.avatar || ""} alt={user?.name || "Perfil"} />
                                            <AvatarFallback>{(user?.name || "U").slice(0, 1).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm font-medium">{user?.name || "Perfil"}</span>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard">
                                            Ir para o painel
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => logout()}
                                    >
                                        Sair
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    )}
                </div>

                <div className="flex md:hidden items-center gap-3">
                    {isAuthenticated ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-muted transition-colors"
                                    aria-label="Abrir perfil"
                                >
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user?.avatar || ""} alt={user?.name || "Perfil"} />
                                        <AvatarFallback>{(user?.name || "U").slice(0, 1).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard">
                                        Ir para o painel
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => logout()}>
                                    Sair
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <MobileMenu />
                    )}
                </div>
            </div>
        </header>
    )
}
