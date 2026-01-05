"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Alert, AlertDescription } from '@/presentation/components/ui/alert';
import { Badge } from '@/presentation/components/ui/badge';
import { Loader2, CheckCircle, AlertCircle, RefreshCw, Building2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { ApiStripeRepository } from '@/infrastructure/repositories/stripe-repository';
import { api } from '@/infrastructure/api/axios-adapter';
import { StripeAccountStatus } from '@/domain/repositories/stripe-repository.interface';
import type { AxiosError } from "axios";

const stripeRepository = new ApiStripeRepository(api);

interface StripeConnectOnboardingProps {
  onComplete?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export const StripeConnectOnboarding: React.FC<StripeConnectOnboardingProps> = ({
  onComplete,
  onError,
  className = ''
}) => {
  const [accountStatus, setAccountStatus] = useState<StripeAccountStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAccountStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const status = await stripeRepository.getAccountStatus();
      setAccountStatus(status);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string }>
      const errorMessage = axiosError.response?.data?.message || axiosError.message || 'Erro ao carregar status da conta Stripe';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    loadAccountStatus();
  }, [loadAccountStatus]);

  const handleCreateAccountLink = async () => {
    try {
      setIsCreatingLink(true);
      setError(null);

      const accountLink = await stripeRepository.createAccountLink();
      console.log(accountLink);

      const browserLang = navigator.language || navigator.languages?.[0] || 'pt-BR';
      const isPortuguese = browserLang.startsWith('pt') || document.documentElement.lang === 'pt-BR';
      const locale = isPortuguese ? 'pt-BR' : browserLang;

      let stripeUrl = accountLink.url;
      try {
        const url = new URL(stripeUrl);
        if (!url.searchParams.has('locale')) {
          url.searchParams.set('locale', locale);
          stripeUrl = url.toString();
        }
      } catch {
        stripeUrl = stripeUrl.includes('?')
          ? `${stripeUrl}&locale=${locale}`
          : `${stripeUrl}?locale=${locale}`;
      }

      const newWindow = window.open(
        stripeUrl,
        'stripe-onboarding',
        'width=800,height=600,scrollbars=yes,resizable=yes'
      );

      if (!newWindow) {
        throw new Error('Não foi possível abrir a janela de onboarding. Verifique se o bloqueador de pop-ups está desabilitado.');
      }

      const checkClosed = setInterval(() => {
        if (newWindow.closed) {
          clearInterval(checkClosed);

          setTimeout(() => {
            loadAccountStatus();
            onComplete?.();
          }, 1000);
        }
      }, 1000);

      setTimeout(() => {
        if (!newWindow.closed) {
          newWindow.close();
          clearInterval(checkClosed);
        }
      }, 600000);

    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string }>
      const errorMessage = axiosError.response?.data?.message || axiosError.message || 'Erro ao criar link de onboarding';
      setError(errorMessage);
      onError?.(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsCreatingLink(false);
    }
  };


  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'enabled':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Ativo
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
            <RefreshCw className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
      case 'restricted':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Restrito
          </Badge>
        );
      case 'disabled':
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Desabilitado
          </Badge>
        );
      default:
        return <Badge variant="outline">Não configurado</Badge>;
    }
  };

  const translateRequirementField = (field: string): string => {
    const translations: { [key: string]: string } = {
      'business_profile.mcc': 'Código de categoria do negócio',
      'business_profile.product_description': 'Descrição dos produtos/serviços',
      'business_type': 'Tipo de negócio',
      'external_account': 'Conta bancária',
      'representative.address.city': 'Cidade do representante',
      'representative.address.line1': 'Endereço do representante',
      'representative.address.postal_code': 'CEP do representante',
      'representative.address.state': 'Estado do representante',
      'representative.dob.day': 'Dia de nascimento do representante',
      'representative.dob.month': 'Mês de nascimento do representante',
      'representative.dob.year': 'Ano de nascimento do representante',
      'representative.email': 'E-mail do representante',
      'representative.first_name': 'Nome do representante',
      'representative.id_number': 'CPF/CNPJ do representante',
      'representative.last_name': 'Sobrenome do representante',
      'representative.phone': 'Telefone do representante',
      'representative.political_exposure': 'Exposição política do representante',
      'representative.verification.additional_document': 'Documento adicional do representante',
      'representative.verification.document': 'Documento de verificação do representante',
      'tos_acceptance.date': 'Data de aceite dos termos',
      'tos_acceptance.ip': 'IP de aceite dos termos',
      'individual.address.city': 'Cidade',
      'individual.address.line1': 'Endereço',
      'individual.address.postal_code': 'CEP',
      'individual.address.state': 'Estado',
      'individual.dob.day': 'Dia de nascimento',
      'individual.dob.month': 'Mês de nascimento',
      'individual.dob.year': 'Ano de nascimento',
      'individual.email': 'E-mail',
      'individual.first_name': 'Nome',
      'individual.id_number': 'CPF',
      'individual.last_name': 'Sobrenome',
      'individual.phone': 'Telefone',
      'individual.verification.document': 'Documento de verificação',
    };

    return translations[field] || field.replace(/_/g, ' ').replace(/\./g, ' → ');
  };

  const getRequirementsText = (): React.ReactNode => {
    if (!accountStatus?.requirements) return null;

    const { currently_due, eventually_due, past_due, pending_verification } = accountStatus.requirements;

    const formatRequirements = (fields: string[]): string[] => {
      return fields.map(field => translateRequirementField(field));
    };

    if (past_due.length > 0) {
      const translatedFields = formatRequirements(past_due);
      return (
        <div className="space-y-2">
          <p className="font-semibold text-neutral-800 dark:text-neutral-100">Ação necessária para ativar sua conta:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {translatedFields.map((field, index) => (
              <li key={index}>{field}</li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground mt-2">
            Clique em &quot;Completar Configuração&quot; para preencher essas informações.
          </p>
        </div>
      );
    }

    if (currently_due.length > 0) {
      const translatedFields = formatRequirements(currently_due);
      return (
        <div className="space-y-2">
          <p className="font-semibold text-yellow-600 dark:text-yellow-500">📋 Informações pendentes:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {translatedFields.map((field, index) => (
              <li key={index}>{field}</li>
            ))}
          </ul>
        </div>
      );
    }

    if (pending_verification.length > 0) {
      const translatedFields = formatRequirements(pending_verification);
      return (
        <div className="space-y-2">
          <p className="font-semibold text-blue-600 dark:text-blue-500">⏳ Aguardando verificação:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {translatedFields.map((field, index) => (
              <li key={index}>{field}</li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground mt-2">
            Nossa equipe está verificando suas informações. Isso pode levar alguns dias úteis.
          </p>
        </div>
      );
    }

    if (eventually_due.length > 0) {
      const translatedFields = formatRequirements(eventually_due);
      return (
        <div className="space-y-2">
          <p className="font-semibold text-muted-foreground">ℹ️ Informações futuras necessárias:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {translatedFields.map((field, index) => (
              <li key={index}>{field}</li>
            ))}
          </ul>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-green-600 dark:text-green-500">
        <CheckCircle className="w-4 h-4" />
        <span className="font-medium">Conta configurada com sucesso!</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Carregando status da conta Stripe...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#635bff] flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          Configuração Stripe Connect
        </CardTitle>
        <CardDescription>
          Configure sua conta Stripe para receber pagamentos de forma segura
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {accountStatus?.has_account ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status da Conta:</span>
              {getStatusBadge(accountStatus.verification_status)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-between">
                <span>Pagamentos:</span>
                <Badge variant={accountStatus.charges_enabled ? "default" : "secondary"}>
                  {accountStatus.charges_enabled ? 'Habilitado' : 'Desabilitado'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Saques:</span>
                <Badge variant={accountStatus.payouts_enabled ? "default" : "secondary"}>
                  {accountStatus.payouts_enabled ? 'Habilitado' : 'Desabilitado'}
                </Badge>
              </div>
            </div>

            {accountStatus.requirements && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {getRequirementsText()}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleCreateAccountLink}
                disabled={isCreatingLink}
                className="flex-1"
              >
                {isCreatingLink ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Abrindo...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {accountStatus.verification_status === 'enabled' ? 'Gerenciar Conta' : 'Completar Configuração'}
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={loadAccountStatus}
                disabled={isLoading}
                className="flex-1"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto bg-linear-to-br from-[#635bff] to-[#7c3aed] rounded-full flex items-center justify-center shadow-lg">
              <Building2 className="w-10 h-10 text-white" />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Conecte sua conta Stripe</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Para receber pagamentos, você precisa conectar sua conta Stripe.
                O processo é rápido e seguro.
              </p>
            </div>

            <Button
              onClick={handleCreateAccountLink}
              disabled={isCreatingLink}
              size="lg"
              className="w-full sm:w-auto"
            >
              {isCreatingLink ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Conectar Conta Stripe
                </>
              )}
            </Button>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Seus dados são protegidos com criptografia de nível bancário</p>
          <p>• Você pode desconectar sua conta a qualquer momento</p>
          <p>• Suporte 24/7 disponível através do Stripe</p>
        </div>
      </CardContent>
    </Card>
  );
};
