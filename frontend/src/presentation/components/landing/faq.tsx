"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/presentation/components/ui/accordion"
import { motion } from "framer-motion"

export const FAQ = () => {
    const faqs = [
        {
            question: "Como posso acessar a plataforma de jobs?",
            answer: "Você precisa contratar um dos nossos planos: mensal, semestral ou anual. Ao contratar, você receberá acesso imediato à plataforma, ao painel de campanhas e às ferramentas de criação."
        },
        {
            question: "Preciso ter muitos seguidores para começar?",
            answer: "Não! Na NEXA, priorizamos autenticidade e qualidade do conteúdo. Muitos dos nossos top creators começaram com menos de 1.000 seguidores. O que mais conta é a relevância e o engajamento do seu público."
        },
        {
            question: "Como funcionam os pagamentos das campanhas?",
            answer: "Todos os pagamentos são processados através dos nossos parceiros financeiros com prazo máximo de 30 dias. Os valores por vídeo variam entre R$150 e R$2.500, dependendo da complexidade da campanha. Você receberá informações detalhadas sobre prazos e condições diretamente na área da campanha e por e-mail."
        },
        {
            question: "Posso escolher com quais marcas trabalhar?",
            answer: "Sim. Você tem total autonomia para aceitar ou recusar campanhas. Nossa curadoria busca alinhar oportunidades com valores éticos e com o perfil do creator, garantindo recomendações relevantes."
        },
        {
            question: "Que tipo de equipamento preciso ter?",
            answer: "Um smartphone moderno é suficiente para começar. Para quem deseja melhorar a qualidade, fornecemos uma lista completa de equipamentos recomendados para cada nível de investimento (básico, intermediário e avançado)."
        },
        {
            question: "Há garantia de satisfação?",
            answer: "Sim. Oferecemos 7 dias de garantia incondicional. Se você não ficar satisfeito, devolvemos 100% do investimento."
        }
    ]

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    }

    return (
        <section className="py-12 md:py-20 bg-muted/30 relative">
            <div className="absolute top-0 left-0 w-full h-full bg-linear-to-brom-transparent to-background/80 -z-10" />
            <div className="max-w-4xl mx-auto px-4 md:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4">
                        Perguntas Frequentes
                    </h2>
                    <p className="text-muted-foreground">Tudo o que você precisa saber para começar</p>
                </motion.div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                >
                    <Accordion type="single" collapsible className="w-full space-y-4">
                        {faqs.map((faq, index) => (
                            <motion.div key={index} variants={item}>
                                <AccordionItem value={`item-${index}`} className="border-b-0 mb-4 rounded-2xl border border-black/5 dark:border-white/5 bg-background/50 backdrop-blur-sm px-2 py-1 md:px-6 md:py-2 transition-all hover:border-pink-500/30 hover:shadow-md data-[state=open]:border-pink-500/50 data-[state=open]:shadow-lg">
                                    <AccordionTrigger className="text-left text-base font-semibold md:text-lg hover:no-underline hover:text-pink-500 transition-colors py-4">
                                        {faq.question}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground leading-relaxed pt-2 pb-4 text-base">
                                        {faq.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            </motion.div>
                        ))}
                    </Accordion>
                </motion.div>
            </div>
        </section>
    )
}
