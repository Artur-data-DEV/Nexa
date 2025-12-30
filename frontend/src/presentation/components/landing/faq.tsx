import { Accordion } from "@/components/ui/accordion"


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

    return (
        <section className="py-12 md:py-20 bg-muted/30">
            <div className="max-w-4xl mx-auto px-4 md:px-6">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center text-foreground mb-12">
                    Perguntas Frequentes
                </h2>

                <Accordion type="single" collapsible className="w-full space-y-4">
                    {faqs.map((faq, index) => (
                        <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg bg-background px-4 py-2">
                            <AccordionTrigger className="text-left font-medium hover:no-underline hover:text-pink-500 transition-colors">
                                {faq.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    )
}
