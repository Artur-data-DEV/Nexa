import { Avatar, AvatarFallback, AvatarImage } from "@/presentation/components/ui/avatar"
import { Card, CardContent } from "@/presentation/components/ui/card"

export const Testimonials = () => {
    const testimonials = [
        {
            name: "Mariana Costa",
            location: "São Paulo, SP",
            initials: "MC",
            quote: "Antes da NEXA, eu criava conteúdo como hobby ganhando R$ 200-300 esporadicamente. Hoje, trabalho com marcas premium e minha renda mensal média é de R$ 6.800. Consegui sair do CLT e viver do que amo."
        },
        {
            name: "Ricardo Silva",
            location: "Rio de Janeiro, RJ",
            initials: "RS",
            quote: "A NEXA me conectou com marcas internacionais que eu jamais imaginaria acessar. Em 4 meses, saí de R$ 800 para R$ 4.200 mensais. A estrutura profissional da plataforma fez toda a diferença."
        },
        {
            name: "Júlia Martins",
            location: "Belo Horizonte, MG",
            initials: "JM",
            quote: "Como mãe solo, precisava de flexibilidade e renda extra. A NEXA me proporcionou isso e muito mais: em 6 meses, já estava faturando R$ 3.500 mensais trabalhando apenas 3 horas por dia de casa."
        },
        {
            name: "Thiago Santos",
            location: "Porto Alegre, RS",
            initials: "TS",
            quote: "Nunca pensei que poderia ganhar R$ 1.800 por um vídeo de 30 segundos. A NEXA abriu portas que eu nem sabia que existiam. Hoje tenho uma agenda de campanhas que me rende mais de R$ 5K por mês."
        },
        {
            name: "Ana Lucia",
            location: "Brasília, DF",
            initials: "AL",
            quote: "Saí de zero na criação de UGC e em 3 meses já estava faturando R$ 2.800 mensais. A metodologia da NEXA e o suporte da comunidade foram fundamentais para meu sucesso."
        },
        {
            name: "Carlos Ferreira",
            location: "Salvador, BA",
            initials: "CF",
            quote: "A NEXA não é só uma plataforma, é um ecossistema completo. Triplicou minha renda, expandiu minha rede de contatos e me posicionou como referência no meu nicho."
        }
    ]

    return (
        <section className="py-12 md:py-20 bg-background">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="text-center mb-12 md:mb-16">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4">
                        Comunidade de Criadores
                    </h2>
                    <p className="text-base md:text-lg text-muted-foreground">
                        Veja como a NEXA está transformando a vida de creators brasileiros.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {testimonials.map((testimonial, index) => (
                        <Card key={index} className="h-full border-border hover:border-pink-500/50 transition-colors">
                            <CardContent className="p-6 flex flex-col h-full">
                                <div className="flex items-center gap-4 mb-4">
                                    <Avatar className="h-10 w-10 border border-border">
                                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${testimonial.name}`} />
                                        <AvatarFallback>{testimonial.initials}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold text-sm text-foreground">{testimonial.name}</p>
                                        <p className="text-xs text-muted-foreground">{testimonial.location}</p>
                                    </div>
                                </div>
                                <blockquote className="text-muted-foreground text-sm leading-relaxed italic flex-1">
                                    "{testimonial.quote}"
                                </blockquote>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    )
}
