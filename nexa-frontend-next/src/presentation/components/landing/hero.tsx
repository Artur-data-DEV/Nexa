"use client"

import { Speech, Building2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export const Hero = () => {
    return (
        <section className="relative overflow-hidden my-26 lg:my-18">
            <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_80%_0%,_var(--tw-gradient-stops))] from-pink-500/20 via-purple-500/10 to-transparent opacity-70" />
            <div className="relative max-w-7xl mx-auto px-4 md:px-6">
                <div className="grid lg:grid-cols-2 items-center">
                    <div className="space-y-12 text-center lg:text-left">
                        <div className="space-y-6">
                            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-foreground tracking-tight leading-[1.1]">
                                A nova era das colaborações entre {''}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
                                    influencers e marcas
                                </span>
                            </h1>
                            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                                Conexões de UGC com segurança, contratos e pagamento garantido. Fature com vídeos curtos ou encontre creators qualificados.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <div className="inline-flex items-center rounded-full bg-zinc-950 p-1.5 shadow-2xl ring-1 ring-zinc-800">
                                <Link
                                    href="/signup/creator?redirectTo=/dashboard"
                                    className="relative group flex items-center  rounded-full bg-pink-500 px-6 py-3 gap-2 text-base font-semibold text-white shadow-lg shadow-pink-500/20 hover:bg-pink-600 hover:shadow-pink-500/40 transition-all cursor-pointer"
                                    title="Para Influencers"
                                >
                                    <Speech size={26} />
                                    Impulsionar Carreira
                                    <span className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-zinc-900 px-3 py-1.5 text-xs text-white opacity-0 group-hover:opacity-100 shadow-lg ring-1 ring-zinc-700 transition-opacity">
                                        Para Influencers
                                    </span>
                                </Link>
                                <div className="h-6 w-px bg-zinc-800 mx-2" />
                                <Link
                                    href="/signup/brand"
                                    className="relative group flex items-center  rounded-full gap-2   py-3 text-base font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                    title="Para Empresas"
                                >
                                    <Building2 size={24} />
                                    Ampliar Engajamento
                                    <span className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-zinc-900 px-3 py-1.5 text-xs text-white opacity-0 group-hover:opacity-100 shadow-lg ring-1 ring-zinc-700 transition-opacity">
                                        Para Empresas
                                    </span>
                                </Link>
                            </div>
                        </div>

                        <div className="pt-4 flex items-center justify-center lg:justify-start gap-2 text-sm text-muted-foreground">
                            <span>Já usa a NEXA?</span>
                            <Link href="/login" className="font-medium text-foreground hover:text-pink-500 transition-colors underline underline-offset-4 cursor-pointer">
                                Entrar na plataforma
                            </Link>
                        </div>
                    </div>

                    <div className="relative lg:h-[600px] flex items-center justify-center">
                        <div className="relative w-full max-w-[520px] aspect-square lg:aspect-auto lg:h-full">
                            <div className="absolute -top-10 -left-10 h-48 w-48 rounded-full bg-pink-500/20 blur-3xl animate-pulse" />
                            <div className="absolute -bottom-10 -right-8 h-56 w-56 rounded-full bg-purple-500/20 blur-3xl animate-pulse" />
                            <div className="absolute inset-0 " />
                            <Image
                                src="/assets/landing/hero-img.png"
                                alt="Plataforma NEXA UGC"
                                fill
                                className="object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-700"
                                priority
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
