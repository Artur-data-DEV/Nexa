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
import { useState } from "react"

const MobileMenu = () => {
    const [open, setOpen] = useState(false)

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden p-2 h-9 w-9 flex items-center justify-center cursor-pointer hover:bg-primary/10 transition-colors"
                    aria-label="Abrir menu de navegação"
                >
                    <Menu className="h-6 w-6" />
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] bg-background/98 backdrop-blur-xl border-l border-white/10 p-0">
                <VisuallyHidden>
                    <SheetTitle>Menu de navegação</SheetTitle>
                    <SheetDescription>Opções de navegação para dispositivos móveis</SheetDescription>
                </VisuallyHidden>

                <div className="flex flex-col h-full">
                    <div className="p-4 pt-6 overflow-y-auto">
                        <div className="mb-6 px-1">
                            <Logo width={80} height={26} className="w-20" />
                        </div>

                        <nav className="flex flex-col gap-0.5">
                            <Link
                                href="/#how-it-works"
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-foreground/70 hover:text-foreground hover:bg-white/5 transition-all font-medium text-sm"
                                onClick={() => setOpen(false)}
                            >
                                Como funciona
                            </Link>
                            <Link
                                href="/#benefits"
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-foreground/70 hover:text-foreground hover:bg-white/5 transition-all font-medium text-sm"
                                onClick={() => setOpen(false)}
                            >
                                Benefícios
                            </Link>
                            <Link
                                href="/#pricing"
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-foreground/70 hover:text-foreground hover:bg-white/5 transition-all font-medium text-sm"
                                onClick={() => setOpen(false)}
                            >
                                Planos
                            </Link>
                            <Link
                                href="/docs"
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-foreground/70 hover:text-foreground hover:bg-white/5 transition-all font-medium text-sm"
                                onClick={() => setOpen(false)}
                            >
                                Guias
                            </Link>
                        </nav>
                    </div>

                    <div className="px-5 pb-6 space-y-2.5">
                        <Button variant="outline" className="w-full justify-center h-9 text-sm font-medium border-white/10 hover:bg-white/5" asChild>
                            <Link href="/login">
                                Entrar
                            </Link>
                        </Button>
                        <div className="grid gap-2">
                            <Button className="w-full h-9 bg-pink-500 hover:bg-pink-600 text-white shadow-sm transition-all border-none text-sm font-semibold" asChild>
                                <Link href="/signup/creator?redirectTo=/dashboard">
                                    <UserStar className="h-3.5 w-3.5 mr-1.5" />
                                    Sou Criador(a)
                                </Link>
                            </Button>
                            <Button className="w-full h-9 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all border-none text-sm font-semibold" asChild>
                                <Link href="/signup/brand?redirectTo=/dashboard">
                                    <Building2 className="h-3.5 w-3.5 mr-1.5" />
                                    Sou Empresa
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}

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
        <header className="w-full top-0 z-50 px-4 py-3 md:px-6 md:py-4 bg-background/80 backdrop-blur-md fixed border-b border-white/5">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                <Link href="/" className="text-xl md:text-2xl font-bold text-foreground cursor-pointer transition-transform hover:scale-105 active:scale-95">
                    <Logo
                        width={80}
                        height={25}
                        className="w-24 cursor-pointer"
                    />
                </Link>

                <nav className="hidden md:flex items-center gap-6 text-[14px] font-semibold uppercase tracking-tight">
                    <Link
                        href="/#how-it-works"
                        className="text-muted-foreground hover:text-foreground transition-all cursor-pointer relative group px-1"
                        onClick={(e) => {
                            if (pathname === "/") {
                                e.preventDefault()
                                handleScrollTo("how-it-works")
                            }
                        }}
                    >
                        Como funciona
                        <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                    </Link>
                    <Link
                        href="/#benefits"
                        className="text-muted-foreground hover:text-foreground transition-all cursor-pointer relative group px-1"
                        onClick={(e) => {
                            if (pathname === "/") {
                                e.preventDefault()
                                handleScrollTo("benefits")
                            }
                        }}
                    >
                        Benefícios
                        <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                    </Link>
                    <Link
                        href="/#pricing"
                        className="text-muted-foreground hover:text-foreground transition-all cursor-pointer relative group px-1"
                        onClick={(e) => {
                            if (pathname === "/") {
                                e.preventDefault()
                                handleScrollTo("pricing")
                            }
                        }}
                    >
                        Planos
                        <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                    </Link>
                    <Link
                        href="/docs"
                        className="text-muted-foreground hover:text-foreground transition-all cursor-pointer relative group px-1"
                    >
                        Guias
                        <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                    </Link>
                </nav>

                <div className="hidden md:flex items-center gap-3">
                    {!isAuthenticated ? (
                        <>
                            <Button variant="ghost" asChild className="cursor-pointer font-medium hover:text-foreground hover:bg-white/5 h-9 px-4">
                                <Link href="/login">
                                    Entrar
                                </Link>
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button className="bg-pink-500 hover:bg-pink-600 text-white shadow-sm shadow-pink-500/10 h-9 px-5 cursor-pointer border-none font-semibold text-sm">
                                        Criar conta
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52 p-1.5 bg-background/95 backdrop-blur-3xl border-white/10 rounded-xl shadow-2xl">
                                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer focus:bg-pink-500/10 transition-colors p-2">
                                        <Link href="/signup/creator?redirectTo=/dashboard" className="flex items-center gap-3">
                                            <div className="p-1.5 bg-pink-500/20 rounded-md">
                                                <UserStar className="h-4 w-4 text-pink-500" />
                                            </div>
                                            <span className="font-medium text-sm">Sou Criador(a)</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer focus:bg-indigo-600/10 transition-colors p-2 mt-0.5">
                                        <Link href="/signup/brand?redirectTo=/dashboard" className="flex items-center gap-3">
                                            <div className="p-1.5 bg-indigo-600/20 rounded-md">
                                                <Building2 className="h-4 w-4 text-indigo-500" />
                                            </div>
                                            <span className="font-medium text-sm">Sou Empresa</span>
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" asChild className="cursor-pointer border-white/10 hover:border-white/20 hover:bg-white/5 rounded-full h-9 px-5 text-sm">
                                <Link href="/dashboard">
                                    Dashboard
                                </Link>
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        className="flex items-center gap-2 rounded-full p-0.5 pr-3 hover:bg-white/5 transition-all border border-white/5 active:scale-95"
                                        aria-label="Abrir perfil"
                                    >
                                        <Avatar className="h-7 w-7 ring-1 ring-white/10">
                                            <AvatarImage src={user?.avatar || ""} alt={user?.name || "Perfil"} />
                                            <AvatarFallback className="bg-primary/20 text-primary text-[10px]">{(user?.name || "U").slice(0, 1).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-xs font-semibold">{user?.name || "Perfil"}</span>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52 p-1.5 bg-background/98 backdrop-blur-xl border-white/10 rounded-xl shadow-xl mt-2">
                                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-2 text-sm">
                                        <Link href="/dashboard">
                                            Ir para o painel
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => logout()}
                                        className="rounded-lg cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 p-2 text-sm mt-0.5"
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
                                    className="flex items-center rounded-full active:scale-95 transition-transform"
                                    aria-label="Abrir perfil"
                                >
                                    <Avatar className="h-8 w-8 ring-1 ring-white/10">
                                        <AvatarImage src={user?.avatar || ""} alt={user?.name || "Perfil"} />
                                        <AvatarFallback className="bg-primary/20 text-primary text-[10px]">{(user?.name || "U").slice(0, 1).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52 p-1.5 bg-background/98 backdrop-blur-xl border-white/10 rounded-xl shadow-xl mt-2 mr-2">
                                <DropdownMenuItem asChild className="rounded-lg p-2 text-sm">
                                    <Link href="/dashboard">
                                        Ir para o painel
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => logout()} className="rounded-lg p-2 text-sm text-destructive focus:text-destructive focus:bg-destructive/10 mt-0.5">
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
