"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Alert, AlertDescription } from "@/presentation/components/ui/alert";
import { Button } from "@/presentation/components/ui/button";
import { Info, CreditCard, Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { StripeConnectOnboarding } from "@/presentation/components/stripe/stripe-connect-onboarding";
import { ApiStripeRepository } from "@/infrastructure/repositories/stripe-repository";
import { api } from "@/infrastructure/api/axios-adapter";

const stripeRepository = new ApiStripeRepository(api);

export default function PaymentMethodsPage() {
  const [isLoadingPaymentMethod, setIsLoadingPaymentMethod] = useState(false);

  const handleConnectPaymentMethod = async () => {
    setIsLoadingPaymentMethod(true);
    try {
      const response = await stripeRepository.createPaymentMethodCheckout();

      if (response.success && response.url) {
        window.location.href = response.url;
        return;
      }

      throw new Error(response.message || "Erro ao criar sessão de checkout");
    } catch (error: any) {
      console.error("Error connecting payment method:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Erro ao conectar método de pagamento. Tente novamente.";
      toast.error(message);
      setIsLoadingPaymentMethod(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Configuração de Pagamento</h1>
          <p className="text-muted-foreground">
            Conecte sua conta Stripe para receber pagamentos de contratos com marcas de forma segura
          </p>
        </div>

        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <CreditCard className="w-5 h-5 text-primary" />
              Receber Pagamentos de Contratos
            </CardTitle>
            <CardDescription className="text-base">
              Conecte sua conta Stripe para receber pagamentos de marcas de forma segura e rápida
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">Por que preciso conectar minha conta Stripe?</p>
                  <p>
                    Para receber pagamentos de contratos com marcas, você precisa ter uma conta Stripe Connect ativa.
                    O processo é rápido, seguro e permite que você receba pagamentos diretamente na sua conta.
                  </p>
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Método de Pagamento para Saques
            </CardTitle>
            <CardDescription>
              Conecte um cartão de crédito ou débito para receber seus saques de campanhas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleConnectPaymentMethod}
              disabled={isLoadingPaymentMethod}
              className="w-full"
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

        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Seus dados estão seguros: o Stripe é certificado PCI DSS Level 1, o mais alto nível de segurança
            para processamento de pagamentos. Suas informações bancárias nunca passam pelos nossos servidores.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
