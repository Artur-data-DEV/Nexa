"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/presentation/components/ui/button"
import { Card, CardContent } from "@/presentation/components/ui/card"
import { useAuth } from "@/presentation/contexts/auth-provider"
import { SubscriptionPlan } from "@/domain/repositories/payment-repository.interface"
import { ApiPaymentRepository } from "@/infrastructure/repositories/payment-repository"
import { api } from "@/infrastructure/api/axios-adapter"

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

const fallbackPlans: SubscriptionPlan[] = [
  {
    id: 1,
    name: "Acesso Mensal",
    description: "Ideal para quem está começando e quer testar a plataforma.",
    price: 39.9,
    duration_months: 1,
    monthly_price: 39.9,
    savings_percentage: undefined,
    features: [],
    sort_order: 1,
  },
  {
    id: 2,
    name: "Acesso Semestral",
    description: "Para creators que já estão fechando campanhas com frequência.",
    price: 179.4,
    duration_months: 6,
    monthly_price: 29.9,
    savings_percentage: 25,
    features: [],
    sort_order: 2,
  },
  {
    id: 3,
    name: "Acesso Anual",
    description: "Para quem quer viver de UGC e maximizar resultados.",
    price: 238.8,
    duration_months: 12,
    monthly_price: 19.9,
    savings_percentage: 50,
    features: [],
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
    <section id="pricing" className="py-12 md:py-20">
      <div className="max-w-6xl w-full mx-auto px-4 md:px-6">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-center tracking-tight mb-6">
          Planos de Acesso<span className="font-thin"> NEXA</span> UGC
        </h2>
        <p className="text-center text-sm md:text-base text-muted-foreground mb-12 max-w-3xl mx-auto">
          Escolha o plano ideal e altere quando quiser, diretamente pelo painel de assinatura.
        </p>

        {loading ? (
          <div className="flex flex-col-reverse sm:grid sm:grid-cols-3 gap-6">
            <div className="h-44 rounded-2xl bg-muted/40 animate-pulse" />
            <div className="h-44 rounded-2xl bg-muted/40 animate-pulse hidden sm:block" />
            <div className="h-44 rounded-2xl bg-muted/40 animate-pulse hidden sm:block" />
          </div>
        ) : (
          <div className="flex flex-col-reverse sm:grid sm:grid-cols-3 gap-6">
            {effectivePlans.map((plan) => {
              const monthly = getMonthlyPrice(plan)
              const isHighlighted =
                typeof plan.savings_percentage === "number" &&
                plan.savings_percentage > 0 &&
                plan.duration_months > 1
              const isSemestralPlan = plan.duration_months === 6

              return (
                <Card
                  key={plan.id}
                  className={`relative overflow-hidden transition hover:shadow-xl ${isHighlighted && !isSemestralPlan ? "border-pink-500" : ""
                    }`}
                >
                  <CardContent className="p-6">
                    {isHighlighted && (
                      <div className="absolute right-4 top-4">
                        <span className="rounded-full bg-emerald-500/15 text-emerald-600 text-xs font-semibold px-2 py-1">
                          {plan.savings_percentage}% OFF
                        </span>
                      </div>
                    )}
                    <div className="mb-4">
                      <div className="text-sm font-semibold text-foreground">{plan.name}</div>
                      <div className="mt-2 text-4xl font-extrabold">
                        <span className={isHighlighted ? "text-pink-500" : "text-foreground"}>
                          R$ {formatCurrency(monthly)}
                        </span>
                        <span className="ml-2 text-sm text-muted-foreground">
                          {plan.duration_months === 1 ? "por mês" : `por ${plan.duration_months} meses`}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button
                        className={`w-full ${isHighlighted ? "bg-pink-500 hover:bg-pink-600 text-white" : ""}`}
                        onClick={() => handleSelectPlan(plan)}
                      >
                        Assinar agora
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
