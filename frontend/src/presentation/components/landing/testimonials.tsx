'use client'
import { Avatar, AvatarFallback, AvatarImage } from "@/presentation/components/ui/avatar"
import { motion } from "framer-motion"


export const Testimonials = () => {
    const testimonials = [
        {
            name: "Mariana Costa",
            role: "Creator UGC",
            location: "São Paulo, SP",
            initials: "MC",
            quote: "Antes da NEXA, eu criava conteúdo como hobby ganhando R$ 200-300 esporadicamente. Hoje, trabalho com marcas premium e minha renda mensal média é de R$ 6.800. Consegui sair do CLT."
        },
        {
            name: "Ricardo Silva",
            role: "Creator Tech",
            location: "Rio de Janeiro, RJ",
            initials: "RS",
            quote: "A NEXA me conectou com marcas internacionais que eu jamais imaginaria acessar. Em 4 meses, saí de R$ 800 para R$ 4.200 mensais. A estrutura profissional da plataforma fez toda a diferença."
        },
        {
            name: "Júlia Martins",
            role: "Lifestyle Creator",
            location: "Belo Horizonte, MG",
            initials: "JM",
            quote: "Como mãe solo, precisava de flexibilidade e renda extra. A NEXA me proporcionou isso e muito mais: em 6 meses, já estava faturando R$ 3.500 mensais trabalhando apenas 3 horas por dia."
        },
        {
            name: "Thiago Santos",
            role: "Fashion Creator",
            location: "Porto Alegre, RS",
            initials: "TS",
            quote: "Nunca pensei que poderia ganhar R$ 1.800 por um vídeo de 30 segundos. A NEXA abriu portas que eu nem sabia que existiam. Hoje tenho uma agenda que me rende mais de R$ 5K por mês."
        },
        {
            name: "Ana Lucia",
            role: "Vlogger",
            location: "Brasília, DF",
            initials: "AL",
            quote: "Saí de zero na criação de UGC e em 3 meses já estava faturando R$ 2.800 mensais. A metodologia da NEXA e o suporte da comunidade foram fundamentais para meu sucesso."
        },
        {
            name: "Carlos Ferreira",
            role: "Fitness Influencer",
            location: "Salvador, BA",
            initials: "CF",
            quote: "A NEXA não é só uma plataforma, é um ecossistema completo. Triplicou minha renda, expandiu minha rede de contatos e me posicionou como referência no meu nicho."
        }
    ]

    // Duplicating for infinite scroll effect
    const firstRow = [...testimonials, ...testimonials];
    const secondRow = [...testimonials.slice().reverse(), ...testimonials.slice().reverse()];

    return (
        <section className="py-24 bg-background relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-pink-500/5 rounded-full blur-[120px] -z-10" />
            <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[120px] -z-10" />

            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="text-center mb-16">
                    <h2 className="text-4xl lg:text-5xl font-black text-foreground mb-6 tracking-tight leading-tight">
                        Aprovado por quem <br />
                        <span className="text-transparent bg-clip-text bg-linear-to-r from-pink-500 to-purple-600">
                            vive de conteúdo
                        </span>
                    </h2>
                    <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto font-medium">
                        Junte-se à maior comunidade de creators autênticos do Brasil e comece a escalar seus resultados hoje mesmo.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 relative">
                    {/* Columns with infinite scroll animation */}
                    <div className="flex flex-col gap-6 h-[600px] overflow-hidden relative">
                        <motion.div
                            animate={{ y: ["0%", "-50%"] }}
                            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                            className="flex flex-col gap-6"
                        >
                            {firstRow.map((t, i) => (
                                <TestimonialCard key={i} testimonial={t} />
                            ))}
                        </motion.div>
                        <div className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-background to-transparent pointer-events-none z-10" />
                        <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-background to-transparent pointer-events-none z-10" />
                    </div>

                    <div className="hidden md:flex flex-col gap-6 h-[600px] overflow-hidden relative">
                        <motion.div
                            animate={{ y: ["-50%", "0%"] }}
                            transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
                            className="flex flex-col gap-6"
                        >
                            {secondRow.map((t, i) => (
                                <TestimonialCard key={i} testimonial={t} />
                            ))}
                        </motion.div>
                        <div className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-background to-transparent pointer-events-none z-10" />
                        <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-background to-transparent pointer-events-none z-10" />
                    </div>
                </div>
            </div>
        </section>
    )
}

const TestimonialCard = ({ testimonial }: { testimonial: any }) => (
    <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-white/5 p-8 rounded-[2.5rem] shadow-xl shadow-black/5 hover:border-pink-500/30 transition-all duration-500 group">
        <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-14 w-14 border-2 border-white dark:border-zinc-800 shadow-md ring-2 ring-pink-500/10 group-hover:ring-pink-500/30 transition-all">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${testimonial.name}`} />
                <AvatarFallback className="bg-linear-to-br from-pink-500 to-purple-600 text-white font-bold">{testimonial.initials}</AvatarFallback>
            </Avatar>
            <div>
                <p className="font-black text-lg text-foreground leading-tight">{testimonial.name}</p>
                <p className="text-xs font-bold text-pink-500 dark:text-pink-400 uppercase tracking-widest">{testimonial.role}</p>
                <p className="text-[10px] text-zinc-400 font-medium">{testimonial.location}</p>
            </div>
        </div>
        <blockquote className="text-zinc-600 dark:text-zinc-300 text-base leading-relaxed font-medium">
            "{testimonial.quote}"
        </blockquote>
    </div>
)
