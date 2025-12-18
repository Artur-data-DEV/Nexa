"use client"

import { Play } from "lucide-react"
import { Button } from "@/presentation/components/ui/button"
import Link from "next/link"
import Image from "next/image"

export const Hero = () => {
    return (
        <section className="relative overflow-hidden mt-[88px]">
            <div className="absolute inset-0 bg-linear-to-br from-pink-500/10 via-purple-500/10 to-orange-500/10"></div>
            <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div className="space-y-5 md:space-y-6 text-center lg:text-left">
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-5xl font-bold text-foreground leading-tight">
                            A nova era das colaborações entre criadores e marcas.
                            <br />
                            <span className="text-transparent bg-clip-text bg-linear-to-r from-pink-500 to-purple-600">
                                Conexões de UGC com segurança, contratos e pagamento garantido.
                            </span>
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto lg:mx-0">
                            Fature com vídeos curtos sem precisar se expor nas redes ou encontre creators qualificados para as campanhas da sua marca.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Button
                                size="lg"
                                className="px-8 w-full sm:w-auto rounded-full bg-pink-500 hover:bg-pink-600 text-white"
                                asChild
                            >
                                <Link href="/signup/creator?redirectTo=/dashboard">
                                    Quero ser criador(a)
                                </Link>
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                className="px-8 w-full sm:w-auto rounded-full"
                                asChild
                            >
                                <Link href="/signup/brand">
                                    <Play className="mr-2 h-4 w-4" />
                                    Sou uma marca
                                </Link>
                            </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Já usa a NEXA?{" "}
                            <Link href="/login" className="underline underline-offset-4">
                                Entrar na plataforma
                            </Link>
                        </p>
                    </div>
                    <div className="relative order-first lg:order-last lg:-mt-6">
                        <div className="w-[260px] h-64 sm:w-96 sm:h-96 lg:w-[500px] lg:h-[500px] mx-auto flex items-center justify-center relative">
                            <Image 
                                src="/assets/landing/hero-img.png" 
                                alt="Hero-Image" 
                                fill
                                className="object-contain" 
                                priority
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
