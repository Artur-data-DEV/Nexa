"use client"

import { MessageSquare, Shield, DollarSign, Heart, Eye, Star, User, Book, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/presentation/components/ui/badge";

export const Benefits = () => {
  const benefits = [
    {
      icon: MessageSquare,
      title: "Comunicação Direta com Decision Makers",
      description: "Chat integrado que conecta você diretamente com os responsáveis pelas campanhas das marcas, eliminando intermediários e agilizando todo o processo."
    },
    {
      icon: Shield,
      title: "Proteção Jurídica Completa",
      description: "Contratos profissionais e transparentes que protegem seus direitos autorais e definem exatamente como seu conteúdo será utilizado, com cláusulas claras de uso."
    },
    {
      icon: DollarSign,
      title: "Sistema de Pagamentos Seguro",
      description: "Processamento seguro através de parceiros financeiros consolidados, com garantia de recebimento e prazos respeitados religiosamente."
    },
    {
      icon: Heart,
      title: "Acesso para Alunos Certificados",
      description: "Membros da NEXA UGC têm acesso à plataforma, incluindo todas as novas funcionalidades e oportunidades que surgirem."
    },
    {
      icon: Eye,
      title: "Dashboard de Performance Avançado",
      description: "Monitore métricas detalhadas, entenda quais tipos de conteúdo têm melhor aceitação e otimize continuamente seus resultados financeiros."
    },
    {
      icon: Star,
      title: "Network Exclusivo de Alto Nível",
      description: "Conecte-se com creators que faturam 5 dígitos mensais, compartilhe estratégias e participe de uma comunidade focada em alta performance."
    },
    {
      icon: User,
      title: "Suporte Técnico Especializado",
      description: "Equipe dedicada para auxiliar em todas as etapas, desde a criação do conteúdo até a negociação com marcas e resolução de questões técnicas."
    },
    {
      icon: Book,
      title: "Campanhas Pré-Selecionadas",
      description: "Oportunidades curadas especialmente para o perfil brasileiro, com briefings claros e valores de mercado sempre atualizados."
    }
  ];

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
    <section id="benefits" className="py-12 md:py-24 bg-background relative">
      <div className="absolute top-1/2 left-0 w-full h-[500px] bg-linear-to-b from-muted/20 to-transparent -z-10" />
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-left mb-12 md:mb-16"
        >
          <Badge className="mb-4 bg-pink-500/10 text-pink-500 border-pink-500/20 px-4 py-1.5 text-xs font-bold tracking-widest uppercase">
            Benefícios Premium
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 tracking-tight leading-[1.1]">
            Transforme sua {" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-pink-500 to-purple-600">
              criatividade em negócio
            </span>
          </h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
            Oferecemos as ferramentas necessárias para você se destacar no mercado de UGC e construir uma carreira sólida e lucrativa.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
        >
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            return (
              <motion.div
                key={index}
                variants={item}
                className="group relative h-full"
              >
                <div className="relative h-full flex flex-col p-8 rounded-[2rem] border-2 border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-900/50 hover:border-pink-500/50 hover:shadow-2xl hover:shadow-pink-500/10 transition-all duration-500 overflow-hidden" >
                  {/* Decorative background glow on hover */}
                  <div className="absolute -top-24 -right-24 h-48 w-48 bg-pink-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                  <div className="relative z-10 flex flex-col h-full">
                    <div className="w-14 h-14 bg-zinc-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-8 ring-1 ring-zinc-200 dark:ring-white/10 group-hover:bg-linear-to-br group-hover:from-pink-500 group-hover:to-purple-600 transition-all duration-500 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-pink-500/25">
                      <IconComponent className="w-7 h-7 text-pink-500 dark:text-pink-400 group-hover:text-white transition-colors duration-500" />
                    </div>

                    <h3 className="text-xl font-bold text-foreground mb-4 leading-tight group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                      {benefit.title}
                    </h3>

                    <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mt-auto font-medium">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};
