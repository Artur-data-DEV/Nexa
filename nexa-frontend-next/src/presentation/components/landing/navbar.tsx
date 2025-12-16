"use client"

import Link from "next/link"
import { Menu } from "lucide-react"
import { Button } from "@/presentation/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/presentation/components/ui/sheet"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { useTheme } from "next-themes"
import { ThemeToggle } from "@/presentation/components/theme-toggle"

export const Navbar = () => {
    const { theme } = useTheme()

    const MobileMenu = () => (
        <Sheet>
            <SheetTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="md:hidden p-2 h-10 w-10 flex items-center justify-center"
                    aria-label="Open mobile menu"
                >
                    <Menu className="h-5 w-5" />
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
                <VisuallyHidden>
                    <SheetTitle>Mobile Navigation Menu</SheetTitle>
                    <SheetDescription>Navigation options for mobile users</SheetDescription>
                </VisuallyHidden>
                <div className="flex flex-col gap-6 mt-8">
                    <Button className="bg-pink-500 hover:bg-pink-600 text-white" asChild>
                        <Link href="/login">
                            Acessar a plataforma
                        </Link>
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )

    return (
        <header className="w-full top-0 z-50 p-4 md:p-6 bg-background/95 backdrop-blur fixed supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <Link href="/" className="text-xl md:text-2xl font-bold text-foreground">
                     <img 
                        src={theme === 'dark' ? "/assets/light-logo.png" : "/assets/dark-logo.png"} 
                        alt="Logo" 
                        width={90} 
                        className="w-30 cursor-pointer" 
                     />
                </Link>

                <div className="hidden md:flex items-center gap-4">
                    <Button size="sm" className="bg-pink-500 hover:bg-pink-600 text-white" asChild>
                        <Link href="/login">
                            Acessar a plataforma
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
