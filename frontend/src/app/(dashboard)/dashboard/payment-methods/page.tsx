"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Alert, AlertDescription } from "@/presentation/components/ui/alert";
import { Button } from "@/presentation/components/ui/button";
import { Info, CreditCard, Shield, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { StripeConnectOnboarding } from "@/presentation/components/stripe/stripe-connect-onboarding";
import { ApiStripeRepository } from "@/infrastructure/repositories/stripe-repository";
import { api } from "@/infrastructure/api/axios-adapter";
import { useAuth } from "@/presentation/contexts/auth-provider";
import type { AxiosError } from "axios";

const stripeRepository = new ApiStripeRepository(api);

export default function PaymentMethodsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-[#171717]">
          Carregando...
        </div>
      }
    >
      <PaymentMethodsInner />
    </Suspense>
  );
}

function PaymentMethodsInner() {
  const [isLoadingPaymentMethod, setIsLoadingPaymentMethod] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const role = user?.role;

  useEffect(() => {
    const status = searchParams.get("payment_method");
    const fundingSuccess = searchParams.get("funding_success");
    const fundingCanceled = searchParams.get("funding_canceled");
    const offerFundingSuccess = searchParams.get("offer_funding_success");
    const offerFundingCanceled = searchParams.get("offer_funding_canceled");
    const sessionId = searchParams.get("session_id");
    const contractId = searchParams.get("contract_id");

    if (status === "cancelled") {
      router.replace("/dashboard/payment-methods");
      return;
    }

    if (role === "brand") {
      if (fundingSuccess === "true" && sessionId && contractId) {
        toast.success("Pagamento do contrato confirmado! O financiamento foi registrado com sucesso.");
        router.replace("/dashboard/payment-methods");
        return;
      }

      if (offerFundingSuccess === "true" && sessionId) {
        toast.success("Fundos adicionados com sucesso. O pagamento da oferta foi processado.");
        router.replace("/dashboard/payment-methods");
        return;
      }

      if (fundingCanceled === "true") {
        toast("Pagamento cancelado", {
          description: "O financiamento do contrato foi cancelado. Você pode tentar novamente quando quiser.",
        });
        router.replace("/dashboard/payment-methods");
        return;
      }

      if (offerFundingCanceled === "true") {
        toast("Financiamento cancelado", {
          description: "O financiamento da oferta foi cancelado. Nenhuma cobrança foi realizada.",
        });
        router.replace("/dashboard/payment-methods");
      }
    }
  }, [searchParams, router, role]);

  const handleConnectPaymentMethod = async () => {
    setIsLoadingPaymentMethod(true);
    try {
      const response = await stripeRepository.createPaymentMethodCheckout();

      if (response.success && response.url) {
        window.location.href = response.url;
        return;
      }

      throw new Error(response.message || "Erro ao criar sessão de checkout");
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      console.error("Error connecting payment method:", axiosError);
      const message =
        axiosError.response?.data?.message ||
        axiosError.message ||
        "Erro ao conectar método de pagamento. Tente novamente.";
      toast.error(message);
      setIsLoadingPaymentMethod(false);
    }
  };

  const isBrand = role === "brand";

  return (
    <div className="min-h-screen bg-background py-6 md:py-8 w-full overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-4 space-y-4 md:space-y-6">
        <div className="mb-6 md:mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2 mb-4 pl-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            {isBrand ? "Pagamentos da Marca" : "Configuração de Pagamento"}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {isBrand
              ? "Conecte seus métodos de pagamento para financiar contratos e ofertas com segurança."
              : "Conecte sua conta Stripe para receber pagamentos de contratos com marcas de forma segura."}
          </p>
        </div>

        <Card className="border-2 border-primary/20 bg-linear-to-br from-primary/5 to-primary/10">
          <CardHeader className="p-4 md:p-6 pb-2 md:pb-4">
            <CardTitle className="flex items-start md:items-center gap-2 text-lg md:text-xl">
              <CreditCard className="w-5 h-5 text-primary shrink-0 mt-1 md:mt-0" />
              <span>{isBrand ? "Conta Stripe da Marca" : "Receber Pagamentos de Contratos"}</span>
            </CardTitle>
            <CardDescription className="text-sm md:text-base">
              {isBrand
                ? "Conecte sua conta Stripe para processar pagamentos de contratos e ofertas de forma segura."
                : "Conecte sua conta Stripe para receber pagamentos de marcas de forma segura e rápida."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
            <div className="mb-4 p-3 md:p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs md:text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">
                    {isBrand
                      ? "Por que preciso conectar a conta Stripe da minha marca?"
                      : "Por que preciso conectar minha conta Stripe?"}
                  </p>
                  {isBrand ? (
                    <p>
                      Para pagar contratos e financiar ofertas pela plataforma, sua marca utiliza pagamentos
                      processados via Stripe. A conexão é rápida e segura.
                    </p>
                  ) : (
                    <p>
                      Para receber pagamentos de contratos com marcas, você precisa ter uma conta Stripe Connect ativa.
                      O processo é rápido, seguro e permite que você receba pagamentos diretamente na sua conta.
                    </p>
                  )}
                </div>
              </div>
            </div>
            <StripeConnectOnboarding
              onComplete={() => {
                toast.success("Conta Stripe conectada com sucesso! Agora você pode receber pagamentos de contratos.");
              }}
              onError={(error) => {
                toast.error(error);
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 md:p-6 pb-2 md:pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="w-5 h-5" />
              {isBrand ? "Método de Pagamento para Contratos" : "Método de Pagamento para Saques"}
            </CardTitle>
            <CardDescription className="text-sm">
              {isBrand
                ? "Conecte um cartão de crédito ou débito para pagar contratos e financiar ofertas."
                : "Conecte um cartão de crédito ou débito para receber seus saques de campanhas."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
            <Button
              onClick={handleConnectPaymentMethod}
              disabled={isLoadingPaymentMethod}
              className="w-full text-sm h-10 md:h-11"
            >
              {isLoadingPaymentMethod ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Conectar Método de Pagamento
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Alert className="text-xs md:text-sm">
          <Shield className="h-4 w-4 shrink-0" />
          <AlertDescription>
            Seus dados estão seguros: o Stripe é certificado PCI DSS Level 1, o mais alto nível de segurança
            para processamento de pagamentos. Suas informações bancárias nunca passam pelos nossos servidores.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
