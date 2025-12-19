"use client"

import Link from "next/link"
import { Menu } from "lucide-react"
import { Button } from "@/presentation/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/presentation/components/ui/sheet"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { ThemeToggle } from "@/presentation/components/theme-toggle"
import { Logo } from "@/presentation/components/logo"

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
                    <Button className="w-full bg-pink-500 hover:bg-pink-600 text-white cursor-pointer" asChild>
                        <Link href="/signup/creator?redirectTo=/dashboard">
                            Criar conta
                        </Link>
                    </Button>
                </div>
            </div>
        </SheetContent>
    </Sheet>
)

export const Navbar = () => {
    const handleScrollTo = (id: string) => {
        if (typeof window === "undefined") return
        const element = document.getElementById(id)
        if (!element) return
        element.scrollIntoView({ behavior: "smooth", block: "start" })
    }

    return (
        <header className="w-full top-0 z-50 p-4 md:p-6 bg-background/95 backdrop-blur fixed supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                <Link href="/" className="text-xl md:text-2xl font-bold text-foreground cursor-pointer">
                    <Logo
                        width={90}
                        height={30}
                        className="w-30 cursor-pointer"
                    />
                </Link>

                <nav className="hidden md:flex items-center gap-6 text-xl">
                    <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        onClick={() => handleScrollTo("how-it-works")}
                    >
                        Como funciona
                    </button>
                    <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        onClick={() => handleScrollTo("benefits")}
                    >
                        Benefícios
                    </button>
                    <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        onClick={() => handleScrollTo("pricing")}
                    >
                        Planos
                    </button>
                    <Link
                        href="/docs"
                        className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                        Guias
                    </Link>
                </nav>

                <div className="hidden md:flex items-center gap-3">
                    <Button variant="ghost" asChild className="cursor-pointer">
                        <Link href="/login">
                            Entrar
                        </Link>
                    </Button>
                    <Button
                        className="bg-pink-500 hover:bg-pink-600 text-white cursor-pointer"
                        asChild
                    >
                        <Link href="/signup/creator?redirectTo=/dashboard">
                            Criar conta
                        </Link>
                    </Button>
                    <ThemeToggle />
                </div>

                <div className="flex md:hidden items-center gap-3">
                    <ThemeToggle />
                    <MobileMenu />
                </div>
            </div>
        </header>
    )
}
