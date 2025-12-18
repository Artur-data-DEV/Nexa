"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/presentation/components/ui/button"
import { Card, CardContent } from "@/presentation/components/ui/card"
import { Badge } from "@/presentation/components/ui/badge"
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

const getOriginalMonthlyPrice = (plan: SubscriptionPlan): number => {
  const currentMonthly = getMonthlyPrice(plan)

  if (
    typeof plan.savings_percentage === "number" &&
    plan.savings_percentage > 0 &&
    plan.savings_percentage < 100
  ) {
    const factor = 1 - plan.savings_percentage / 100
    return currentMonthly / factor
  }

  return currentMonthly
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
      <div className="max-w-4xl w-full mx-auto px-4 md:px-6">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center text-foreground mb-4">
          Planos de Acesso NEXA UGC
        </h2>
        <p className="text-center text-sm md:text-base text-muted-foreground mb-10 md:mb-12 max-w-3xl mx-auto">
          Escolha o plano que faz sentido para o seu momento e altere quando quiser, direto
          pelo painel de assinatura dentro da plataforma.
        </p>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="h-32 rounded-xl bg-muted/40 animate-pulse" />
            <div className="h-32 rounded-xl bg-muted/40 animate-pulse hidden sm:block" />
            <div className="h-32 rounded-xl bg-muted/40 animate-pulse hidden sm:block" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {effectivePlans.map((plan) => {
              const monthly = getMonthlyPrice(plan)
              const isHighlighted =
                typeof plan.savings_percentage === "number" &&
                plan.savings_percentage > 0 &&
                plan.duration_months > 1

              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => handleSelectPlan(plan)}
                  className={`rounded-xl border p-4 text-left transition hover:shadow-lg ${
                    isHighlighted
                      ? "border-pink-500 bg-pink-500/10"
                      : "border-border bg-background"
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-sm text-foreground">
                      {plan.name}
                    </span>
                    <span className="text-lg font-bold text-pink-500">
                      R$ {formatCurrency(monthly)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {plan.duration_months === 1
                      ? "por mês"
                      : `por ${plan.duration_months} meses`}
                  </p>
                  {isHighlighted && (
                    <div className="mt-2 inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-500">
                      <Badge className="mr-1 h-3 w-3 bg-transparent px-0 py-0 text-current">
                        {plan.savings_percentage}% OFF
                      </Badge>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
