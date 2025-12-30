"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/presentation/components/ui/button"
import { Card, CardContent } from "@/presentation/components/ui/card"
import { useAuth } from "@/presentation/contexts/auth-provider"
import { SubscriptionPlan } from "@/domain/repositories/payment-repository.interface"
import { ApiPaymentRepository } from "@/infrastructure/repositories/payment-repository"
import { api } from "@/infrastructure/api/axios-adapter"
import { motion } from "framer-motion"
import { Check, Star, Zap } from "lucide-react"

const paymentRepository = new ApiPaymentRepository(api)

const getMonthlyPrice = (plan: SubscriptionPlan): number => {
  if (typeof plan.monthly_price === "number" && plan.monthly_price > 0) {
    return plan.monthly_price
  }
  if (typeof plan.price === "number" && plan.price > 0) {
    const duration = plan.duration_months || 1
    return plan.price / duration
  }
  return 0
}

const formatCurrency = (value: number): string => {
  return value.toFixed(2).replace(".", ",")
}

const defaultFeatures = [
  "Acesso a todas as campanhas",
  "Portfólio profissional integrado",
  "Pagamentos seguros e rápidos",
  "Suporte prioritário via WhatsApp",
  "Materiais educativos exclusivos"
]

const fallbackPlans: SubscriptionPlan[] = [
  {
    id: 1,
    name: "Plano Mensal",
    description: "Ideal para testar e começar sua jornada UGC.",
    price: 39.9,
    duration_months: 1,
    monthly_price: 39.9,
    savings_percentage: undefined,
    features: defaultFeatures.slice(0, 3),
    sort_order: 1,
  },
  {
    id: 2,
    name: "Plano Semestral",
    description: "Para quem já tem consistência e quer economizar.",
    price: 179.4,
    duration_months: 6,
    monthly_price: 29.9,
    savings_percentage: 25,
    features: defaultFeatures.slice(0, 4),
    sort_order: 2,
  },
  {
    id: 3,
    name: "Plano Anual",
    description: "O melhor custo-benefício para viver de UGC.",
    price: 238.8,
    duration_months: 12,
    monthly_price: 19.9,
    savings_percentage: 50,
    features: defaultFeatures,
    sort_order: 3,
  },
]

export const Pricing = () => {
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const data = await paymentRepository.getSubscriptionPlans()
        if (data && data.length > 0) {
          setPlans(data)
        } else {
          setPlans(fallbackPlans)
        }
      } catch {
        setPlans(fallbackPlans)
      } finally {
        setLoading(false)
      }
    }

    loadPlans()
  }, [])

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (!isAuthenticated || !user) {
      router.push(`/signup/creator?redirectTo=/dashboard/subscription?planId=${plan.id}`)
    } else {
      router.push(`/dashboard/subscription?planId=${plan.id}`)
    }
  }

  const effectivePlans = plans.length > 0 ? plans : fallbackPlans

  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-pink-500/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] -z-10" />

      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-black text-foreground mb-6 tracking-tight">
            Escolha sua <span className="text-transparent bg-clip-text bg-linear-to-r from-pink-500 to-purple-600">Jornada Nexa</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
            Invista na sua carreira de criador UGC com planos que cabem no seu bolso e maximizam seus ganhos.
          </p>
        </motion.div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[500px] rounded-3xl bg-zinc-100 dark:bg-zinc-900 border-2 border-zinc-200 dark:border-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8 items-stretch">
            {effectivePlans.map((plan, index) => {
              const monthly = getMonthlyPrice(plan)
              const isAnnual = plan.duration_months === 12
              const isSemestral = plan.duration_months === 6

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`h-full ${plan.duration_months === 12 ? "order-first md:order-3" : plan.duration_months === 6 ? "order-3 md:order-2" : "order-2 md:order-1"}`}
                >
                  <Card
                    className={`relative h-full flex flex-col overflow-hidden transition-all duration-500 border-2 ${isAnnual
                      ? "border-purple-500 shadow-[0_20px_50px_rgba(168,85,247,0.2)] bg-purple-50/30 dark:bg-zinc-950/50 backdrop-blur-xl scale-105 z-10"
                      : "border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/50 backdrop-blur-sm hover:border-purple-500/50"
                      } rounded-[2.5rem] p-8`}
                  >
                    {isAnnual && (
                      <div className="absolute top-0 right-0 left-0 bg-linear-to-r from-pink-500 to-purple-600 py-1.5 text-center">
                        <span className="text-[10px] font-black tracking-[0.2em] text-white uppercase flex items-center justify-center gap-2">
                          <Star className="w-3 h-3 fill-current" /> MAIS ESCOLHIDO <Star className="w-3 h-3 fill-current" />
                        </span>
                      </div>
                    )}

                    <div className="mt-4 mb-8">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-black tracking-widest uppercase ${isAnnual ? "text-purple-600 dark:text-purple-400" : "text-zinc-500"}`}>
                          {plan.name}
                        </span>
                        {plan.savings_percentage && (
                          <span className="bg-emerald-500/10 text-emerald-500 text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full ring-1 ring-emerald-500/20">
                            {plan.savings_percentage}% ECONOMIA
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold text-zinc-500">R$</span>
                        <span className="text-5xl font-black text-foreground tracking-tight">
                          {formatCurrency(monthly).split(',')[0]}
                        </span>
                        <span className="text-xl font-bold text-foreground">
                          ,{formatCurrency(monthly).split(',')[1]}
                        </span>
                        <span className="text-zinc-500 text-sm font-medium ml-1">/mês</span>
                      </div>
                      <p className="mt-4 text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm font-medium leading-relaxed">
                        {plan.description}
                      </p>
                    </div>

                    <div className="flex-1 space-y-4 mb-10">
                      {(plan.features || defaultFeatures).map((feature, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className={`mt-0.5 rounded-full p-0.5 ${isAnnual ? "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400" : "bg-zinc-100 dark:bg-white/5 text-zinc-500"}`}>
                            <Check className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 font-medium">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-auto pt-6 border-t border-zinc-100 dark:border-white/5 space-y-4">
                      <div className="text-center">
                        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                          {plan.duration_months === 1
                            ? "Cobrança Mensal"
                            : plan.duration_months === 6
                              ? `Cobrança Semestral de R$ ${formatCurrency(monthly * 6)}`
                              : `Cobrança Anual de R$ ${formatCurrency(monthly * 12)}`
                          }
                        </span>
                      </div>
                      <Button
                        className={`w-full py-7 rounded-2xl text-base font-black transition-all duration-300 group shadow-none ${isAnnual
                          ? "bg-linear-to-r from-pink-500 to-purple-600 text-white hover:opacity-90 active:scale-95 shadow-lg shadow-purple-500/25"
                          : "bg-zinc-100 dark:bg-white/5 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/10"
                          }`}
                        onClick={() => handleSelectPlan(plan)}
                      >
                        <span className="flex items-center gap-2">
                          {isAnnual && <Zap className="w-4 h-4 fill-current" />}
                          Assinar agora
                        </span>
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="text-center mt-12 text-sm text-zinc-400 dark:text-zinc-500 font-medium"
        >
          Cancelamento fácil a qualquer momento. Sem taxas ocultas.
        </motion.p>
      </div>
    </section>
  )
}

