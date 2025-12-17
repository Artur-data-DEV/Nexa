"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Loader2, ArrowLeft, CreditCard, Shield, CheckCircle2, Star, Calendar, Crown, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/presentation/contexts/auth-provider";
import { ApiPaymentRepository } from "@/infrastructure/repositories/payment-repository";
import { api } from "@/infrastructure/api/axios-adapter";
import { SubscriptionPlan, SubscriptionStatus } from "@/domain/repositories/payment-repository.interface";

const paymentRepository = new ApiPaymentRepository(api);

const getMonthlyPrice = (plan: SubscriptionPlan): number => {
  if (typeof plan.monthly_price === "number" && plan.monthly_price > 0) {
    return plan.monthly_price;
  }

  if (typeof plan.price === "number" && plan.price > 0) {
    const duration = plan.duration_months || 1;
    return plan.price / duration;
  }

  return 0;
};

const formatCurrency = (value: number): string => {
  return value.toFixed(2).replace(".", ",");
};

const getOriginalMonthlyPrice = (plan: SubscriptionPlan): number => {
  const currentMonthly = getMonthlyPrice(plan);

  if (
    typeof plan.savings_percentage === "number" &&
    plan.savings_percentage > 0 &&
    plan.savings_percentage < 100
  ) {
    const factor = 1 - plan.savings_percentage / 100;
    return currentMonthly / factor;
  }

  return currentMonthly;
};

const formatDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString("pt-BR");
};

function SubscriptionForm({ plan }: { plan: SubscriptionPlan }) {
  const { user } = useAuth();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);

  const handlePurchase = async () => {
    if (!plan) return;
    if (!user) {
      toast.error("Login necessário", {
        description: "Faça login para prosseguir",
      });
      router.push("/auth/login");
      return;
    }

    setIsLoading(true);

    try {
      const checkoutUrl = await paymentRepository.getCheckoutUrl(plan.id);

      if (checkoutUrl && typeof window !== "undefined") {
        window.location.href = checkoutUrl;
        return;
      }

      toast.error("Não foi possível iniciar o pagamento", {
        description: "Tente novamente em alguns instantes.",
      });
    } catch (err) {
      console.error("Erro ao iniciar checkout:", err);

      let errorMessage = "Não foi possível iniciar o checkout. Tente novamente.";

      if (err && typeof err === "object") {
        const maybeAxiosError = err as {
          response?: { data?: { message?: string } };
          message?: string;
        };

        errorMessage =
          maybeAxiosError.response?.data?.message ??
          maybeAxiosError.message ??
          errorMessage;
      }

      toast.error("Erro ao iniciar checkout", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Resumo do Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {plan.description || 'Descrição não disponível'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                    R$ {formatCurrency(getMonthlyPrice(plan))}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {plan.duration_months === 1
                      ? 'por mês'
                      : `por ${plan.duration_months || 1} meses`
                    }
                  </p>
                </div>
              </div>

              {plan.features && Array.isArray(plan.features) && plan.features.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-semibold mb-2 text-foreground">
                    Benefícios incluídos:
                  </p>
                  <ul className="space-y-2">
                    {plan.features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-lg text-foreground">Total em 12 meses</p>
                  <p className="text-sm text-muted-foreground">
                    12x de R$ {formatCurrency(getMonthlyPrice(plan))}
                  </p>
                </div>
                <div className="text-right">
                  {getOriginalMonthlyPrice(plan) > getMonthlyPrice(plan) && (
                    <p className="text-sm text-muted-foreground line-through">
                      R$ {formatCurrency(getOriginalMonthlyPrice(plan) * 12)}
                    </p>
                  )}
                  <p className="text-2xl font-bold text-foreground">
                    R$ {formatCurrency(getMonthlyPrice(plan) * 12)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Forma de Pagamento</CardTitle>
            <CardDescription>
              O pagamento será processado de forma segura através do Stripe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/70 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-sm text-blue-900 dark:text-blue-200">
                    Pagamento Seguro
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Suas informações de pagamento são criptografadas e processadas de forma segura.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Finalizar Pagamento</CardTitle>
            <CardDescription>
              Você será redirecionado para uma página segura do Stripe para concluir o pagamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                onClick={handlePurchase}
                disabled={isLoading}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-3 text-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Assinar {plan.name}
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Ao clicar em Assinar {plan.name}, você será enviado para o Stripe e concorda com nossos termos de serviço.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const planId = searchParams.get("planId");

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        setLoadingPlans(true);
        const plans = await paymentRepository.getSubscriptionPlans();

        if (plans && Array.isArray(plans) && plans.length > 0) {
          setPlans(plans);

          if (planId) {
            const selected = plans.find((p) => p.id.toString() === planId);

            if (selected) {
              setSelectedPlan(selected);
            } else {
              toast.error("Plano não encontrado", {
                description: "O plano selecionado não existe",
              });
              setSelectedPlan(plans[0]);
            }
          } else {
            setSelectedPlan(plans[0]);
          }
        } else {
          toast.error("Nenhum plano disponível", {
            description: "Não há planos de assinatura ativos no momento",
          });
          setPlans([]);
          setSelectedPlan(null);
        }
      } catch (error) {
        console.error("Error loading plan:", error);
        toast.error("Erro", {
          description: "Não foi possível carregar o plano",
        });
      } finally {
        setLoadingPlans(false);
      }
    };

    loadPlans();
  }, [planId]);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        setLoadingStatus(true);
        const status = await paymentRepository.getSubscriptionStatus();
        setSubscriptionStatus(status);
      } catch (error) {
        console.error("Erro ao carregar status da assinatura:", error);
      } finally {
        setLoadingStatus(false);
      }
    };

    if (user) {
      loadStatus();
    }
  }, [user]);

  if (loadingPlans) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-pink-600" />
          <p className="text-muted-foreground">Carregando planos...</p>
        </div>
      </div>
    );
  }

  if (!selectedPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground mb-4">
              Plano não encontrado
            </p>
            <Button onClick={() => router.back()} className="w-full">
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Finalizar Assinatura</h1>
          <p className="text-muted-foreground mt-2">
            Complete seu pagamento para ativar o plano {selectedPlan.name}
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="rounded-full bg-purple-100 dark:bg-purple-900/40 p-3 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-500 dark:text-purple-200" />
            </div>
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <div>
                <div className="font-semibold text-base text-foreground flex items-center gap-2">
                  Status da Assinatura
                  {loadingStatus ? (
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-medium rounded-full">
                      Carregando...
                    </div>
                  ) : subscriptionStatus?.is_premium_active ? (
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs font-medium rounded-full">
                      <Crown className="w-3 h-3" />
                      Premium ativo
                    </div>
                  ) : subscriptionStatus?.has_premium && subscriptionStatus.days_remaining <= 0 ? (
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-xs font-medium rounded-full">
                      <AlertCircle className="w-3 h-3" />
                      Expirado
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-medium rounded-full">
                      Gratuito
                    </div>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {loadingStatus
                    ? "Carregando status da assinatura..."
                    : subscriptionStatus?.is_premium_active
                    ? "Sua assinatura premium é válida até:"
                    : subscriptionStatus?.has_premium && subscriptionStatus.days_remaining <= 0
                    ? "Sua assinatura premium expirou em:"
                    : "Você está usando o plano gratuito"}
                </div>
              </div>
              <div className="text-base text-foreground font-medium sm:text-right">
                {loadingStatus
                  ? "..."
                  : subscriptionStatus?.premium_expires_at
                  ? formatDate(subscriptionStatus.premium_expires_at)
                  : "Não disponível"}
              </div>
            </div>
          </CardContent>
        </Card>

        {plans.length > 1 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Planos Disponíveis</CardTitle>
              <CardDescription>Escolha o plano desejado antes de finalizar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {plans.map((p) => {
                  const isSelected = selectedPlan?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPlan(p)}
                      className={`rounded-xl border p-4 text-left transition ${
                        isSelected
                          ? "border-pink-500 bg-pink-500/10"
                          : "border-border bg-background"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-sm">{p.name}</span>
                        <span
                          className={`text-lg font-bold ${
                            isSelected ? "text-pink-500" : "text-pink-400"
                          }`}
                        >
                          R$ {formatCurrency(getMonthlyPrice(p))}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {p.duration_months === 1
                          ? "por mês"
                          : `por ${p.duration_months} meses`}
                      </p>
                      {typeof p.savings_percentage === "number" &&
                        p.savings_percentage > 0 &&
                        p.duration_months > 1 && (
                          <div className="mt-2 inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-500">
                            <Star className="mr-1 h-3 w-3 fill-emerald-500 text-emerald-500" />
                            {p.savings_percentage}% OFF
                          </div>
                        )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <SubscriptionForm plan={selectedPlan} />
      </div>

    </div>
  );
}
