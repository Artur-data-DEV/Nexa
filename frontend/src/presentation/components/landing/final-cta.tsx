"use client"

import Link from "next/link"
import { Button } from "@/presentation/components/ui/button"
import { ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

export const FinalCTA = () => {
    return (
        <section className="py-20 md:py-32 relative overflow-hidden">
            {/* Background gradients */}
            <div className="absolute inset-0 bg-background">
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-[30%] -left-[10%] w-[700px] h-[700px] rounded-full bg-pink-500/20 blur-[120px]"
                />
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute -bottom-[30%] -right-[10%] w-[700px] h-[700px] rounded-full bg-purple-600/20 blur-[120px]"
                />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-6 text-center space-y-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <h2 className="text-3xl sm:text-4xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
                        Pronto para Transformar sua <br className="hidden sm:block" />
                        <span className="text-transparent bg-clip-text bg-linear-to-rrom-pink-500 to-purple-600">
                            Vida Financeira?
                        </span>
                    </h2>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
                >
                    Junte-se a mais de <span className="font-semibold text-foreground">5.000 creators</span> que já estão faturando consistentemente através da NEXA.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
                >
                    <Button
                        size="lg"
                        className="w-full sm:w-auto text-lg h-16 px-10 rounded-full bg-pink-500 hover:bg-pink-600 text-white shadow-xl shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-105 transition-all font-bold"
                        asChild
                    >
                        <Link href="/signup/creator">
                            Começar minha transformação
                            <ArrowRight className="ml-2 h-6 w-6" />
                        </Link>
                    </Button>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.6 }}
                    className="text-sm text-muted-foreground pt-8"
                >
                    NEXA UGC <br />
                    Construindo o maior ecossistema de UGC da América Latina, uma parceria autêntica por vez.
                </motion.p>
            </div>
        </section>
    )
}
