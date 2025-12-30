
import Link from "next/link"
import { Button } from "@/presentation/components/ui/button"
import { ArrowRight } from "lucide-react"

export const FinalCTA = () => {
    return (
        <section className="py-20 md:py-32 relative overflow-hidden">
            {/* Background gradients */}
            <div className="absolute inset-0 bg-background">
                <div className="absolute -top-[30%] -left-[10%] w-[700px] h-[700px] rounded-full bg-pink-500/10 blur-[120px]" />
                <div className="absolute -bottom-[30%] -right-[10%] w-[700px] h-[700px] rounded-full bg-purple-600/10 blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-6 text-center space-y-8">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
                    Pronto para Transformar sua <br className="hidden sm:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
                        Vida Financeira?
                    </span>
                </h2>

                <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    Junte-se a mais de <span className="font-semibold text-foreground">5.000 creators</span> que já estão faturando consistentemente através da NEXA.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <Button
                        size="lg"
                        className="w-full sm:w-auto text-lg h-14 px-8 rounded-full bg-pink-500 hover:bg-pink-600 text-white shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-all font-semibold"
                        asChild
                    >
                        <Link href="/signup/creator">
                            Começar minha transformação
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                </div>

                <p className="text-sm text-muted-foreground pt-8">
                    NEXA UGC <br />
                    Construindo o maior ecossistema de UGC da América Latina, uma parceria autêntica por vez.
                </p>
            </div>
        </section>
    )
}
