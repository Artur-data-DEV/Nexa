"use client"

import { Button } from "@/presentation/components/ui/button"
import { User, Eye, Image, DollarSign, ArrowRight } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

export const HowItWorks = () => {
  const steps = [
    {
      step: "1",
      title: "Cadastre-se na NEXA",
      description: "Complete seu cadastro e crie seu perfil estratégico na plataforma, destacando suas habilidades e estilo único! ",
      icon: User
    },
    {
      step: "2",
      title: "Encontre Campanhas Exclusivas ",
      description: "Acesse oportunidades selecionadas com marcas nacionais e internacionais que pagam entre R$ 150 a R$ 2.500 por vídeo.",
      icon: Eye
    },
    {
      step: "3",
      title: "Produza conteúdos criativos ",
      description: "Crie conteúdo autêntico seguindo diretrizes claras, mas mantendo sua personalidade e estilo únicos.",
      icon: Image
    },
    {
      step: "4",
      title: "Pagamentos Garantidos",
      description: "Receba seus pagamentos de forma segura e pontual, diretamente em sua conta bancária, sem burocracias.",
      icon: DollarSign
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
    <section id="how-it-works" className="py-12 md:py-24 bg-muted/30 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-20"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 tracking-tight">
            Como a NEXA funciona
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Um processo profissional para transformar sua criatividade em renda consistente
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-20"
        >
          {steps.map((step, index) => {
            const IconComponent = step.icon
            return (
              <motion.div
                key={index}
                variants={item}
                className="relative group h-full"
              >
                <div className="relative z-10 h-full bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-white/10 p-8 rounded-3xl hover:border-purple-500 transition-all duration-500 group-hover:shadow-[0_20px_50px_rgba(168,85,247,0.15)] group-hover:-translate-y-3 flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-[1.5rem] rotate-3 group-hover:rotate-12 transition-all duration-500 flex items-center justify-center mb-8 group-hover:bg-linear-to-br group-hover:from-purple-600 group-hover:to-pink-500 group-hover:shadow-xl group-hover:shadow-purple-500/30">
                    <IconComponent className="w-10 h-10 text-purple-600 group-hover:text-white -rotate-3 group-hover:-rotate-12 transition-all duration-500" />
                  </div>

                  <div className="px-4 py-1.5 bg-zinc-100 dark:bg-white/5 rounded-full text-[10px] font-black tracking-widest mb-6 text-zinc-500 dark:text-zinc-400 uppercase ring-1 ring-zinc-200 dark:ring-white/10 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-pulse" />
                    PASSO {step.step}
                  </div>

                  <h3 className="text-xl font-black text-foreground mb-4 leading-tight">{step.title}</h3>
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed font-medium">{step.description}</p>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Button
            className="group relative bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-12 py-8 text-xl rounded-full font-black shadow-[0_20px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_40px_rgba(255,255,255,0.1)] transition-all hover:scale-105 hover:-translate-y-1 active:scale-95 overflow-hidden hover:shadow-purple-500/25"
            asChild
          >
            <Link href="/signup/brand">
              <span className="relative z-10 flex items-center gap-3 group-hover:text-white transition-colors duration-300">
                Começar agora
                <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
              </span>
              <div className="absolute inset-0 bg-linear-to-r from-pink-500 to-purple-600 opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_50%)] transition-opacity duration-500" />
            </Link>
          </Button>
          <p className="mt-6 text-sm font-bold text-zinc-400 dark:text-zinc-500 tracking-widest uppercase">
            Junte-se a mais de 5.000 criadores
          </p>
        </motion.div>
      </div>
    </section>
  )
}
